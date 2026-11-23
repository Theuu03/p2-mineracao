package br.edu.textoemdados.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {
    private static final int LIMIT = 20;
    private static final long WINDOW_SECONDS = 60;
    private final Map<String, ArrayDeque<Long>> requests = new ConcurrentHashMap<>();
    private final ObjectMapper mapper;

    public ApiRateLimitFilter(ObjectMapper mapper) { this.mapper = mapper; }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if ("POST".equals(request.getMethod()) && (path.startsWith("/api/v1/auth/") || path.startsWith("/api/v1/nlp/"))) {
            String key = request.getRemoteAddr() + ":" + path;
            long now = Instant.now().getEpochSecond();
            ArrayDeque<Long> timestamps = requests.computeIfAbsent(key, unused -> new ArrayDeque<>());
            synchronized (timestamps) {
                while (!timestamps.isEmpty() && now - timestamps.peekFirst() >= WINDOW_SECONDS) timestamps.removeFirst();
                if (timestamps.size() >= LIMIT) {
                    response.setStatus(429);
                    response.setContentType("application/json");
                    mapper.writeValue(response.getOutputStream(), Map.of("error", "rate_limit", "message", "Muitas solicitações. Tente novamente em instantes."));
                    return;
                }
                timestamps.addLast(now);
            }
        }
        chain.doFilter(request, response);
    }
}
