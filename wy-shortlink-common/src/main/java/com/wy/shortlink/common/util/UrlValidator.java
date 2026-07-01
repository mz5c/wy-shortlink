package com.wy.shortlink.common.util;

import java.net.URI;

public final class UrlValidator {
    private UrlValidator() {}

    public static boolean isValid(String url) {
        if (url == null || url.isBlank()) return false;
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            return scheme != null && (scheme.equals("http") || scheme.equals("https"))
                    && uri.getHost() != null && !uri.getHost().isBlank();
        } catch (Exception e) {
            return false;
        }
    }

    /** 补全协议，默认加 https:// */
    public static String ensureProtocol(String url) {
        if (url == null) return null;
        String trimmed = url.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        return "https://" + trimmed;
    }
}
