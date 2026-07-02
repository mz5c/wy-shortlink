package com.wy.shortlink.common.util;

/**
 * Base62 编解码工具，字符集 0-9a-zA-Z，共 62 个字符。
 * 用于将十进制 ID 转换为短码字符串，以及反向解析。
 */
public final class Base62Utils {

    private static final String CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int BASE = CHARS.length();

    /** 短码默认长度 */
    public static final int DEFAULT_CODE_LENGTH = 6;

    private Base62Utils() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * 随机生成固定长度的 Base62 短码字符串。
     *
     * @param length 短码长度
     * @return 随机短码
     */
    public static String generateRandomCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int idx = java.util.concurrent.ThreadLocalRandom.current().nextInt(BASE);
            sb.append(CHARS.charAt(idx));
        }
        return sb.toString();
    }

    /**
     * 将十进制数字编码为 Base62 字符串，自然长度不补位。
     */
    public static String encode(long num) {
        if (num == 0) {
            return String.valueOf(CHARS.charAt(0));
        }
        StringBuilder sb = new StringBuilder();
        while (num > 0) {
            int remainder = (int) (num % BASE);
            sb.append(CHARS.charAt(remainder));
            num /= BASE;
        }
        return sb.reverse().toString();
    }

    /**
     * 将 Base62 字符串解码为十进制数字。
     */
    public static long decode(String code) {
        long result = 0;
        for (int i = 0; i < code.length(); i++) {
            char c = code.charAt(i);
            int index = CHARS.indexOf(c);
            if (index == -1) {
                throw new IllegalArgumentException("Invalid Base62 character: " + c);
            }
            result = result * BASE + index;
        }
        return result;
    }
}
