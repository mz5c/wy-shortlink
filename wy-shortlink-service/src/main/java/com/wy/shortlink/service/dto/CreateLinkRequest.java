package com.wy.shortlink.service.dto;

import lombok.Data;

@Data
public class CreateLinkRequest {
    private String url;
    private String alias;
    private String expireTime;
}
