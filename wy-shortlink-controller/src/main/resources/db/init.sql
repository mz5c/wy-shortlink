CREATE DATABASE IF NOT EXISTS wy_shortlink DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wy_shortlink;

CREATE TABLE IF NOT EXISTS t_short_link (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    short_code VARCHAR(20) NOT NULL COMMENT '短码',
    original_url VARCHAR(2048) NOT NULL COMMENT '原始长URL',
    expire_time DATETIME DEFAULT NULL COMMENT '过期时间(NULL=永久)',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    creator VARCHAR(64) DEFAULT NULL COMMENT '创建者',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_short_code (short_code),
    KEY idx_expire_time (expire_time),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='短链接表';

CREATE TABLE IF NOT EXISTS t_access_log_202607 (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    short_code VARCHAR(20) NOT NULL COMMENT '短码',
    access_time DATETIME NOT NULL COMMENT '访问时间',
    ip VARCHAR(45) DEFAULT NULL COMMENT '访问者IP',
    user_agent VARCHAR(512) DEFAULT NULL COMMENT 'User-Agent',
    referer VARCHAR(2048) DEFAULT NULL COMMENT '来源URL',
    PRIMARY KEY (id),
    KEY idx_short_access (short_code, access_time),
    KEY idx_access_time (access_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访问日志表';

CREATE TABLE IF NOT EXISTS t_access_stats (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    short_code VARCHAR(20) NOT NULL COMMENT '短码',
    stat_date DATE NOT NULL COMMENT '统计日期',
    pv BIGINT NOT NULL DEFAULT 0 COMMENT '页面浏览量',
    uv BIGINT NOT NULL DEFAULT 0 COMMENT '独立访客数',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_code_date (short_code, stat_date),
    KEY idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访问统计表';

CREATE TABLE IF NOT EXISTS t_user (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(BCrypt)',
    role VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT '角色',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态 1-启用 0-禁用',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

INSERT IGNORE INTO t_user (username, password, role, status) VALUES
('admin', '$2a$10$anal2DVTD27kdCH1UGQtFeOBzJwpSrVIET83ss67VImqO/wzaH/GS', 'admin', 1);
