package com.wy.shortlink.service.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShortLinkVO {
    private String shortCode;
    private String shortUrl;
    private String originalUrl;
    private String expireTime;
    private String createTime;
    private Long pv;
    private Long uv;
    private Boolean deleted;
}
