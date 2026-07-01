package com.wy.shortlink.controller;

import com.wy.shortlink.common.result.Result;
import com.wy.shortlink.service.AuthService;
import com.wy.shortlink.service.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        log.debug("[Auth] 登录请求: username={}", req.getUsername());
        try {
            Result<LoginResponse> result = Result.success(authService.login(req));
            log.info("[Auth] 登录成功");
            return result;
        } catch (Exception e) {
            log.warn("[Auth] 登录失败: error={}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/refresh")
    public Result<LoginResponse> refresh(@RequestBody RefreshRequest req) {
        String tokenPreview = req.getRefreshToken() != null && req.getRefreshToken().length() > 20
                ? req.getRefreshToken().substring(0, 20) + "..." : String.valueOf(req.getRefreshToken());
        log.info("[Auth] 刷新Token请求: token={}", tokenPreview);
        return Result.success(authService.refresh(req.getRefreshToken()));
    }

    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String tokenPreview = token.length() > 20 ? token.substring(0, 20) + "..." : token;
        log.info("[Auth] 登出请求: token={}", tokenPreview);
        authService.logout(token);
        return Result.success();
    }
}
