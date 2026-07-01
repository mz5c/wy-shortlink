package com.wy.shortlink.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateUserRequest {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, message = "用户名至少3个字符")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, message = "密码至少6个字符")
    private String password;

    private String role;
}
