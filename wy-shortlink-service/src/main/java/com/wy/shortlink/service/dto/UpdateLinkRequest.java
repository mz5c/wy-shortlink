package com.wy.shortlink.service.dto;

import lombok.Data;

@Data
public class UpdateLinkRequest {
    private String url;
    private String expireTime;
}
