package com.wy.shortlink.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_access_log")
public class AccessLogDO {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String shortCode;

    private LocalDateTime accessTime;

    private String ip;

    private String userAgent;

    private String referer;
}
