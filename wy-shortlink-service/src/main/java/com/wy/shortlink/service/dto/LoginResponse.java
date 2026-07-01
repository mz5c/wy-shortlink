package com.wy.shortlink.service.dto;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private UserInfo userInfo;

    @Data
    @Builder
    public static class UserInfo {
        private String username;
        private String role;
    }
}
