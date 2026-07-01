package com.wy.shortlink.controller.config;

import com.wy.shortlink.common.constant.Constants;
import com.wy.shortlink.common.enums.ErrorCode;
import com.wy.shortlink.common.result.Result;
import com.wy.shortlink.service.config.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Collections;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            Claims claims = jwtTokenProvider.parseToken(token);
            String tokenId = claims.getId();
            String blacklistKey = String.format(Constants.REDIS_BLACKLIST_ACCESS, tokenId);
            if (Boolean.TRUE.equals(redisTemplate.hasKey(blacklistKey))) {
                log.warn("[JWT] Token 已黑名单: tokenId={}", tokenId);
                writeError(response, ErrorCode.TOKEN_BLACKLISTED, "此账号已在其他设备登录");
                return;
            }
            String role = claims.get("role", String.class);
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            claims.getSubject(), null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role)));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        } catch (ExpiredJwtException e) {
            log.warn("[JWT] Token 已过期: uri={}", request.getRequestURI());
            writeError(response, ErrorCode.UNAUTHORIZED, "Token 已过期");
            return;
        } catch (JwtException e) {
            String preview = token.length() > 30 ? token.substring(0, 30) + "..." : token;
            log.warn("[JWT] Token 无效: uri={}, token={}, error={}", request.getRequestURI(), preview, e.getMessage());
            writeError(response, ErrorCode.UNAUTHORIZED, "Token 无效");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    private void writeError(HttpServletResponse response, ErrorCode code, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        new ObjectMapper().writeValue(response.getOutputStream(), Result.fail(code, message));
    }
}
