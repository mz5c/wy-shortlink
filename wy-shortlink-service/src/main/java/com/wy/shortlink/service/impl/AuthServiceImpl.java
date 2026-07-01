package com.wy.shortlink.service.impl;

import com.wy.shortlink.common.constant.Constants;
import com.wy.shortlink.common.enums.ErrorCode;
import com.wy.shortlink.common.exception.BizException;
import com.wy.shortlink.service.config.JwtTokenProvider;
import com.wy.shortlink.dao.entity.UserDO;
import com.wy.shortlink.dao.mapper.UserMapper;
import com.wy.shortlink.service.AuthService;
import com.wy.shortlink.service.dto.LoginRequest;
import com.wy.shortlink.service.dto.LoginResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;

    @Override
    public LoginResponse login(LoginRequest req) {
        UserDO user = userMapper.selectByUsername(req.getUsername());
        if (user == null) throw new BizException(ErrorCode.LOGIN_FAILED);
        if (user.getStatus() != null && user.getStatus() == 0)
            throw new BizException(ErrorCode.LOGIN_FAILED, "账号已被禁用，请联系管理员");
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword()))
            throw new BizException(ErrorCode.LOGIN_FAILED);

        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getUsername(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getUsername());

        String refreshKey = String.format(Constants.REDIS_REFRESH_TOKEN, user.getId());
        String oldRefresh = redisTemplate.opsForValue().get(refreshKey);
        if (oldRefresh != null) {
            try {
                String oldTokenId = jwtTokenProvider.getTokenId(oldRefresh);
                redisTemplate.opsForValue().set(
                        String.format(Constants.REDIS_BLACKLIST_REFRESH, oldTokenId), "1",
                        jwtTokenProvider.getRemainingMillis(oldRefresh), TimeUnit.MILLISECONDS);
            } catch (Exception ignored) {}
        }
        redisTemplate.opsForValue().set(refreshKey, refreshToken, 7, TimeUnit.DAYS);

        return LoginResponse.builder()
                .accessToken(accessToken).refreshToken(refreshToken)
                .userInfo(LoginResponse.UserInfo.builder().username(user.getUsername()).role(user.getRole()).build())
                .build();
    }

    @Override
    public LoginResponse refresh(String refreshToken) {
        try {
            Claims claims = jwtTokenProvider.parseToken(refreshToken);
            String tokenId = claims.getId();
            if (Boolean.TRUE.equals(redisTemplate.hasKey(
                    String.format(Constants.REDIS_BLACKLIST_REFRESH, tokenId))))
                throw new BizException(ErrorCode.TOKEN_BLACKLISTED);

            Long userId = claims.get("userId", Long.class);
            String storedRefresh = redisTemplate.opsForValue()
                    .get(String.format(Constants.REDIS_REFRESH_TOKEN, userId));
            if (!refreshToken.equals(storedRefresh))
                throw new BizException(ErrorCode.TOKEN_BLACKLISTED);

            UserDO user = userMapper.selectById(userId);
            if (user == null || user.getStatus() == 0)
                throw new BizException(ErrorCode.UNAUTHORIZED);

            redisTemplate.opsForValue().set(
                    String.format(Constants.REDIS_BLACKLIST_REFRESH, tokenId), "1",
                    jwtTokenProvider.getRemainingMillis(refreshToken), TimeUnit.MILLISECONDS);

            String newAccess = jwtTokenProvider.generateAccessToken(userId, user.getUsername(), user.getRole());
            String newRefresh = jwtTokenProvider.generateRefreshToken(userId, user.getUsername());
            redisTemplate.opsForValue().set(
                    String.format(Constants.REDIS_REFRESH_TOKEN, userId), newRefresh, 7, TimeUnit.DAYS);

            return LoginResponse.builder()
                    .accessToken(newAccess).refreshToken(newRefresh)
                    .userInfo(LoginResponse.UserInfo.builder().username(user.getUsername()).role(user.getRole()).build())
                    .build();
        } catch (BizException e) {
            throw e;
        } catch (JwtException e) {
            throw new BizException(ErrorCode.UNAUTHORIZED, "Refresh token 无效或已过期");
        }
    }

    @Override
    public void logout(String accessToken) {
        try {
            String tokenId = jwtTokenProvider.getTokenId(accessToken);
            long remaining = jwtTokenProvider.getRemainingMillis(accessToken);
            redisTemplate.opsForValue().set(
                    String.format(Constants.REDIS_BLACKLIST_ACCESS, tokenId), "1", remaining, TimeUnit.MILLISECONDS);

            Claims claims = jwtTokenProvider.parseToken(accessToken);
            Long userId = claims.get("userId", Long.class);
            String refreshKey = String.format(Constants.REDIS_REFRESH_TOKEN, userId);
            String storedRefresh = redisTemplate.opsForValue().get(refreshKey);
            if (storedRefresh != null) {
                try {
                    String refreshTokenId = jwtTokenProvider.getTokenId(storedRefresh);
                    redisTemplate.opsForValue().set(
                            String.format(Constants.REDIS_BLACKLIST_REFRESH, refreshTokenId), "1",
                            jwtTokenProvider.getRemainingMillis(storedRefresh), TimeUnit.MILLISECONDS);
                } catch (Exception ignored) {}
                redisTemplate.delete(refreshKey);
            }
        } catch (Exception e) {
            // token 已过期或无效，登出仍算成功
        }
    }
}
