package br.edu.textoemdados.auth;

import br.edu.textoemdados.config.AppProperties;
import br.edu.textoemdados.security.JwtService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MailService mailService;
    private final AppProperties properties;
    private final String dummyPasswordHash;

    public AuthService(JdbcTemplate jdbc, PasswordEncoder passwordEncoder, JwtService jwtService,
                       MailService mailService, AppProperties properties) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.properties = properties;
        this.dummyPasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    @Transactional
    public void register(AuthDtos.RegisterRequest request) {
        String email = normalizeEmail(request.email());
        List<UUID> created = jdbc.query(
                "INSERT INTO users(email,password_hash,display_name) VALUES (?,?,?) ON CONFLICT (email) DO NOTHING RETURNING id",
                (rs, row) -> rs.getObject(1, UUID.class), email, passwordEncoder.encode(request.password()), request.displayName().trim());
        if (created.isEmpty()) {
            // Keep the response shape identical so registration cannot enumerate existing accounts.
            return;
        }
        UUID id = created.get(0);
        jdbc.update("INSERT INTO user_roles(user_id,role) VALUES (?,'STUDENT')", id);
        String token = createOneTimeToken(id, "VERIFY_EMAIL");
        mailService.sendVerification(email, token);
    }

    @Transactional
    public LoginResult login(AuthDtos.LoginRequest request, String userAgent) {
        String email = normalizeEmail(request.email());
        List<AccountRow> accounts = jdbc.query(
                "SELECT id,email,display_name,password_hash,email_verified,status FROM users WHERE email = ?",
                (rs, row) -> new AccountRow(rs.getObject("id", UUID.class), rs.getString("email"),
                        rs.getString("display_name"), rs.getString("password_hash"), rs.getBoolean("email_verified"), rs.getString("status")),
                email);
        if (accounts.isEmpty()) {
            passwordEncoder.matches(request.password(), dummyPasswordHash);
            throw invalidCredentials();
        }
        AccountRow account = accounts.get(0);
        if (!passwordEncoder.matches(request.password(), account.passwordHash()) || !account.emailVerified() || !"ACTIVE".equals(account.status())) {
            throw invalidCredentials();
        }
        return createSession(account.id(), account.email(), account.displayName(), userAgent);
    }

    @Transactional
    public LoginResult refresh(String rawRefreshToken, String userAgent) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) throw invalidCredentials();
        String tokenHash = hash(rawRefreshToken);
        List<UUID> sessionUsers = jdbc.query(
                "SELECT user_id FROM auth_sessions WHERE refresh_token_hash = ? AND revoked_at IS NULL AND expires_at > now() FOR UPDATE",
                (rs, row) -> rs.getObject(1, UUID.class), tokenHash);
        if (sessionUsers.isEmpty()) throw invalidCredentials();
        UUID userId = sessionUsers.get(0);
        AccountRow account = jdbc.queryForObject(
                "SELECT id,email,display_name,password_hash,email_verified,status FROM users WHERE id = ?",
                (rs, row) -> new AccountRow(rs.getObject("id", UUID.class), rs.getString("email"),
                        rs.getString("display_name"), rs.getString("password_hash"), rs.getBoolean("email_verified"), rs.getString("status")),
                userId);
        if (account == null || !account.emailVerified() || !"ACTIVE".equals(account.status())) throw invalidCredentials();
        jdbc.update("UPDATE auth_sessions SET revoked_at = now() WHERE refresh_token_hash = ? AND revoked_at IS NULL", tokenHash);
        return createSession(account.id(), account.email(), account.displayName(), userAgent);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            jdbc.update("UPDATE auth_sessions SET revoked_at = now() WHERE refresh_token_hash = ? AND revoked_at IS NULL", hash(rawRefreshToken));
        }
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        TokenRow token = findUsableToken(rawToken, "VERIFY_EMAIL");
        jdbc.update("UPDATE auth_tokens SET used_at = now() WHERE id = ?", token.id());
        jdbc.update("UPDATE users SET email_verified = TRUE, status = 'ACTIVE', updated_at = now() WHERE id = ?", token.userId());
    }

    @Transactional
    public void requestPasswordReset(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        List<UUID> users = jdbc.query("SELECT id FROM users WHERE email = ? AND status = 'ACTIVE'", (rs, row) -> rs.getObject(1, UUID.class), email);
        if (users.isEmpty()) return;
        String token = createOneTimeToken(users.get(0), "RESET_PASSWORD");
        mailService.sendPasswordReset(email, token);
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        TokenRow token = findUsableToken(rawToken, "RESET_PASSWORD");
        jdbc.update("UPDATE auth_tokens SET used_at = now() WHERE id = ?", token.id());
        jdbc.update("UPDATE users SET password_hash = ?, updated_at = now() WHERE id = ?", passwordEncoder.encode(newPassword), token.userId());
        jdbc.update("UPDATE auth_sessions SET revoked_at = now() WHERE user_id = ? AND revoked_at IS NULL", token.userId());
    }

    public AuthDtos.AccountResponse currentAccount(UUID id) {
        AccountRow account = jdbc.queryForObject(
                "SELECT id,email,display_name,password_hash,email_verified,status FROM users WHERE id = ? AND status = 'ACTIVE'",
                (rs, row) -> new AccountRow(rs.getObject("id", UUID.class), rs.getString("email"),
                        rs.getString("display_name"), rs.getString("password_hash"), rs.getBoolean("email_verified"), rs.getString("status")), id);
        if (account == null) throw invalidCredentials();
        return new AuthDtos.AccountResponse(account.id(), account.email(), account.displayName(), roles(account.id()));
    }

    private LoginResult createSession(UUID userId, String email, String displayName, String userAgent) {
        List<String> roles = roles(userId);
        String refreshToken = opaqueToken();
        Instant expiresAt = Instant.now().plusSeconds(properties.refreshTokenDays() * 86_400);
        jdbc.update("INSERT INTO auth_sessions(user_id,refresh_token_hash,expires_at,user_agent_hash) VALUES (?,?,?,?)",
                userId, hash(refreshToken), Timestamp.from(expiresAt), userAgent == null ? null : hash(userAgent));
        String accessToken = jwtService.issue(userId.toString(), roles);
        return new LoginResult(new AuthDtos.SessionResponse(accessToken, properties.accessTokenMinutes() * 60, displayName, roles), refreshToken);
    }

    private List<String> roles(UUID userId) {
        return jdbc.query("SELECT role FROM user_roles WHERE user_id = ? ORDER BY role", (rs, row) -> rs.getString(1), userId);
    }

    private String createOneTimeToken(UUID userId, String purpose) {
        jdbc.update("DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ? AND used_at IS NULL", userId, purpose);
        String raw = opaqueToken();
        jdbc.update("INSERT INTO auth_tokens(user_id,purpose,token_hash,expires_at) VALUES (?,?,?,?)",
                userId, purpose, hash(raw), Timestamp.from(Instant.now().plusSeconds(1800)));
        return raw;
    }

    private TokenRow findUsableToken(String rawToken, String purpose) {
        if (rawToken == null || rawToken.isBlank()) throw invalidToken();
        List<TokenRow> tokens = jdbc.query(
                "SELECT id,user_id FROM auth_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > now() FOR UPDATE",
                (rs, row) -> new TokenRow(rs.getObject("id", UUID.class), rs.getObject("user_id", UUID.class)), hash(rawToken), purpose);
        if (tokens.isEmpty()) throw invalidToken();
        return tokens.get(0);
    }

    private String opaqueToken() {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private String normalizeEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    private ResponseStatusException invalidCredentials() { return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas ou conta não verificada."); }
    private ResponseStatusException invalidToken() { return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido ou expirado."); }

    public record LoginResult(AuthDtos.SessionResponse session, String refreshToken) { }
    private record AccountRow(UUID id, String email, String displayName, String passwordHash, boolean emailVerified, String status) { }
    private record TokenRow(UUID id, UUID userId) { }
}

