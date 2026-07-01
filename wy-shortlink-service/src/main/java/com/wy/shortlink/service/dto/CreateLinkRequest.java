package com.wy.shortlink.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateLinkRequest {
    @NotBlank(message = "URL 不能为空")
    private String url;

    @Pattern(regexp = "^[a-zA-Z0-9]{6,20}$", message = "别名须为6-20位字母数字")
    private String alias;

    private String expireTime;
}
