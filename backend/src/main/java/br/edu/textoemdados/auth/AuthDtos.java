package br.edu.textoemdados.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() { }

    public record RegisterRequest(
            @Email @NotBlank @Size(max = 254) String email,
            @NotBlank @Size(min = 2, max = 100) String displayName,
            @NotBlank @Size(min = 12, max = 128) String password) { }

    public record LoginRequest(@Email @NotBlank @Size(max = 254) String email,
                               @NotBlank @Size(max = 128) String password) { }
    public record TokenRequest(@NotBlank @Size(max = 200) String token) { }
    public record ResetPasswordRequest(@NotBlank @Size(max = 200) String token,
                                       @NotBlank @Size(min = 12, max = 128) String newPassword) { }
    public record ForgotPasswordRequest(@Email @NotBlank @Size(max = 254) String email) { }
    public record SessionResponse(String accessToken, long expiresIn, String displayName, List<String> roles) { }
    public record AccountResponse(UUID id, String email, String displayName, List<String> roles) { }
    public record MessageResponse(String message) { }
}
