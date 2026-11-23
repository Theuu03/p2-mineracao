package br.edu.textoemdados.auth;

import br.edu.textoemdados.config.AppProperties;
import br.edu.textoemdados.security.AuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private static final String REFRESH_COOKIE = "refresh_token";
    private static final Set<String> STATEFUL_ENDPOINTS = Set.of("/api/v1/auth/login", "/api/v1/auth/refresh", "/api/v1/auth/logout");
    private final AuthService authService;
    private final AppProperties properties;

    public AuthController(AuthService authService, AppProperties properties) {
        this.authService = authService;
        this.properties = properties;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDtos.MessageResponse> register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.accepted().body(new AuthDtos.MessageResponse("Se o endereço puder ser cadastrado, enviaremos instruções de confirmação."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.SessionResponse> login(@Valid @RequestBody AuthDtos.LoginRequest request,
                                                           @RequestHeader(value = "Origin", required = false) String origin,
                                                           HttpServletRequest servletRequest) {
        requireTrustedOrigin(origin);
        AuthService.LoginResult result = authService.login(request, servletRequest.getHeader("User-Agent"));
        return sessionResponse(result);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthDtos.SessionResponse> refresh(@CookieValue(value = REFRESH_COOKIE, required = false) String refreshToken,
                                                             @RequestHeader(value = "Origin", required = false) String origin,
                                                             HttpServletRequest servletRequest) {
        requireTrustedOrigin(origin);
        return sessionResponse(authService.refresh(refreshToken, servletRequest.getHeader("User-Agent")));
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthDtos.MessageResponse> logout(@CookieValue(value = REFRESH_COOKIE, required = false) String refreshToken,
                                                            @RequestHeader(value = "Origin", required = false) String origin) {
        requireTrustedOrigin(origin);
        authService.logout(refreshToken);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .body(new AuthDtos.MessageResponse("Sessão encerrada."));
    }

    @PostMapping("/verify-email")
    public AuthDtos.MessageResponse verifyEmail(@Valid @RequestBody AuthDtos.TokenRequest request) {
        authService.verifyEmail(request.token());
        return new AuthDtos.MessageResponse("Endereço confirmado. Agora você pode entrar.");
    }

    @PostMapping("/forgot-password")
    public AuthDtos.MessageResponse forgotPassword(@Valid @RequestBody AuthDtos.ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.email());
        return new AuthDtos.MessageResponse("Se a conta existir, enviaremos instruções de redefinição.");
    }

    @PostMapping("/reset-password")
    public AuthDtos.MessageResponse resetPassword(@Valid @RequestBody AuthDtos.ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return new AuthDtos.MessageResponse("Senha atualizada. Entre novamente.");
    }

    @GetMapping("/me")
    public AuthDtos.AccountResponse current(Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return authService.currentAccount(user.id());
    }

    private ResponseEntity<AuthDtos.SessionResponse> sessionResponse(AuthService.LoginResult result) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, result.refreshToken())
                .httpOnly(true)
                .secure(properties.secureCookies())
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(Duration.ofDays(properties.refreshTokenDays()))
                .build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString())
                .cacheControl(CacheControl.noStore()).body(result.session());
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE, "").httpOnly(true).secure(properties.secureCookies())
                .sameSite("Strict").path("/api/v1/auth").maxAge(Duration.ZERO).build();
    }

    private void requireTrustedOrigin(String origin) {
        Set<String> allowed = Arrays.stream(properties.corsOrigins().split(",")).map(String::trim).collect(java.util.stream.Collectors.toSet());
        if (origin == null || !allowed.contains(origin)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Origem não autorizada.");
    }
}
