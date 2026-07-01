package com.wy.shortlink.service;

public interface RedirectService {
    String getOriginalUrl(String shortCode);
    void recordAccess(String shortCode, String ip, String userAgent, String referer);
}
