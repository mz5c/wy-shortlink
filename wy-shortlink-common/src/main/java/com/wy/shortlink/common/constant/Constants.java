package com.wy.shortlink.common.constant;

public final class Constants {
    private Constants() {}

    /** Redis key: 短链映射 */
    public static final String REDIS_LINK_KEY = "sl:link:%s";
    /** Redis key: ID 发号器 */
    public static final String REDIS_ID_KEY = "shortlink:id";
    /** Redis key: 实时 PV */
    public static final String REDIS_STATS_PV = "sl:stats:pv:%s:%s";
    /** Redis key: 实时 UV (HyperLogLog) */
    public static final String REDIS_STATS_UV = "sl:stats:uv:%s:%s";
    /** Redis key: access token 黑名单 */
    public static final String REDIS_BLACKLIST_ACCESS = "auth:blacklist:access:%s";
    /** Redis key: refresh token 黑名单 */
    public static final String REDIS_BLACKLIST_REFRESH = "auth:blacklist:refresh:%s";
    /** Redis key: 用户当前 refresh token */
    public static final String REDIS_REFRESH_TOKEN = "auth:refresh:%d";
}
