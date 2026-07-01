package com.wy.shortlink.service.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserVO {

    private String username;

    private String role;

    private Integer status;

    private String createTime;
}
