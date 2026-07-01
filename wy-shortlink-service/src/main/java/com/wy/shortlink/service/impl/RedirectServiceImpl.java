package com.wy.shortlink.service.impl;

import com.wy.shortlink.common.constant.Constants;
import com.wy.shortlink.dao.entity.AccessLogDO;
import com.wy.shortlink.dao.entity.ShortLinkDO;
import com.wy.shortlink.dao.mapper.AccessLogMapper;
import com.wy.shortlink.dao.mapper.ShortLinkMapper;
import com.wy.shortlink.service.RedirectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedirectServiceImpl implements RedirectService {

    private final ShortLinkMapper shortLinkMapper;
    private final StringRedisTemplate redisTemplate;
    private final AccessLogMapper accessLogMapper;
    private final AccessLogTableManager tableManager;

    @Override
    public String getOriginalUrl(String shortCode) {
        String cacheKey = String.format(Constants.REDIS_LINK_KEY, shortCode);
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) return cached;

        ShortLinkDO entity = shortLinkMapper.selectByShortCode(shortCode);
        if (entity == null) return null;
        if (entity.getExpireTime() != null && entity.getExpireTime().isBefore(LocalDateTime.now())) return null;

        redisTemplate.opsForValue().set(cacheKey, entity.getOriginalUrl(),
                24 + (long) (Math.random() * 4), TimeUnit.HOURS);
        return entity.getOriginalUrl();
    }

    @Override
    @Async
    public void recordAccess(String shortCode, String ip, String userAgent, String referer) {
        try {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
            String pvKey = String.format(Constants.REDIS_STATS_PV, shortCode, today);
            String uvKey = String.format(Constants.REDIS_STATS_UV, shortCode, today);
            redisTemplate.opsForValue().increment(pvKey);
            redisTemplate.expire(pvKey, 7, TimeUnit.DAYS);
            redisTemplate.opsForHyperLogLog().add(uvKey, ip != null ? ip : "unknown");
            redisTemplate.expire(uvKey, 7, TimeUnit.DAYS);

            tableManager.ensureTableExists();
            AccessLogDO log = new AccessLogDO();
            log.setShortCode(shortCode);
            log.setAccessTime(LocalDateTime.now());
            log.setIp(ip);
            log.setUserAgent(userAgent);
            log.setReferer(referer);
            accessLogMapper.insertLog(tableManager.getCurrentTableName(), log);
        } catch (Exception e) {
            log.error("Failed to record access for shortCode={}", shortCode, e);
        }
    }
}
