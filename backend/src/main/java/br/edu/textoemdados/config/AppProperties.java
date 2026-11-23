package br.edu.textoemdados.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String frontendUrl,
        String corsOrigins,
        String jwtSecret,
        long accessTokenMinutes,
        long refreshTokenDays,
        boolean secureCookies,
        String mailFrom,
        String nlpServiceUrl) { }
