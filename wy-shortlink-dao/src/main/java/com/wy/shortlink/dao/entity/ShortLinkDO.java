package com.wy.shortlink.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_short_link")
public class ShortLinkDO {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String shortCode;

    private String originalUrl;

    private LocalDateTime expireTime;

    @TableLogic
    private Integer deleted;

    private String creator;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
