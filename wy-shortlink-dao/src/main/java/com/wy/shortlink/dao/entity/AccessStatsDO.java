package com.wy.shortlink.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("t_access_stats")
public class AccessStatsDO {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String shortCode;

    private LocalDate statDate;

    private Long pv;

    private Long uv;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
