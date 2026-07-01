package com.wy.shortlink.common.enums;

import lombok.Getter;

@Getter
public enum ErrorCode {
    SUCCESS(0, "success"),
    PARAM_ERROR(1001, "参数校验失败"),
    SHORT_CODE_NOT_FOUND(1002, "短码不存在"),
    ALIAS_OCCUPIED(1003, "别名已被占用"),
    LINK_EXPIRED(1004, "链接已失效"),
    LINK_DELETED(1005, "链接已删除"),
    URL_INVALID(1006, "URL 格式不合法"),
    SYSTEM_ERROR(2001, "系统错误"),
    UNAUTHORIZED(2002, "未登录或 Token 无效"),
    FORBIDDEN(2003, "无权限"),
    LOGIN_FAILED(2004, "用户名或密码错误"),
    USERNAME_EXISTS(2005, "用户名已存在"),
    USER_NOT_FOUND(2006, "用户不存在"),
    TOKEN_BLACKLISTED(2007, "Token 已失效"),
    ;

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
