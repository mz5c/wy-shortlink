package com.wy.shortlink.service;

import com.wy.shortlink.service.dto.LoginRequest;
import com.wy.shortlink.service.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest req);
    LoginResponse refresh(String refreshToken);
    void logout(String accessToken);
}
