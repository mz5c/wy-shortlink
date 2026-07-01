package com.wy.shortlink.service.impl;

import com.wy.shortlink.common.constant.Constants;
import com.wy.shortlink.common.enums.ErrorCode;
import com.wy.shortlink.common.exception.BizException;
import com.wy.shortlink.dao.entity.AccessStatsDO;
import com.wy.shortlink.dao.entity.ShortLinkDO;
import com.wy.shortlink.dao.mapper.AccessStatsMapper;
import com.wy.shortlink.dao.mapper.ShortLinkMapper;
import com.wy.shortlink.service.StatsService;
import com.wy.shortlink.service.dto.StatsVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private final AccessStatsMapper statsMapper;
    private final ShortLinkMapper shortLinkMapper;
    private final StringRedisTemplate redisTemplate;

    private static final int SCAN_BATCH_SIZE = 100;

    @Override
    public StatsVO getStats(String shortCode, String startDate, String endDate) {
        ShortLinkDO link = shortLinkMapper.selectByShortCode(shortCode);
        if (link == null) {
            throw new BizException(ErrorCode.SHORT_CODE_NOT_FOUND);
        }

        List<AccessStatsDO> stats = statsMapper.selectByShortCodeAndDateRange(shortCode, startDate, endDate);
        long totalPv = stats.stream().mapToLong(s -> s.getPv() != null ? s.getPv() : 0).sum();
        long totalUv = stats.stream().mapToLong(s -> s.getUv() != null ? s.getUv() : 0).sum();
        List<StatsVO.DailyStat> dailyStats = stats.stream()
                .map(s -> StatsVO.DailyStat.builder()
                        .date(s.getStatDate().toString())
                        .pv(s.getPv())
                        .uv(s.getUv())
                        .build())
                .collect(Collectors.toList());

        return StatsVO.builder()
                .shortCode(shortCode)
                .totalPv(totalPv)
                .totalUv(totalUv)
                .dailyStats(dailyStats)
                .build();
    }

    @Override
    public void syncStatsFromRedis() {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String pattern = "sl:stats:pv:*:" + today;

        List<String> pvKeys = new ArrayList<>();
        ScanOptions options = ScanOptions.scanOptions().match(pattern).count(SCAN_BATCH_SIZE).build();
        try (Cursor<String> cursor = redisTemplate.scan(options)) {
            cursor.forEachRemaining(pvKeys::add);
        } catch (Exception e) {
            log.error("Failed to scan Redis keys for stats sync", e);
            return;
        }

        if (pvKeys.isEmpty()) return;

        int processed = 0;
        for (String pvKey : pvKeys) {
            try {
                String[] parts = pvKey.split(":");
                if (parts.length < 5) continue;
                String shortCode = parts[3];
                String date = parts[4];

                String pvStr = redisTemplate.opsForValue().get(pvKey);
                long pv = pvStr != null ? Long.parseLong(pvStr) : 0;
                String uvKey = String.format(Constants.REDIS_STATS_UV, shortCode, date);
                long uv = redisTemplate.opsForHyperLogLog().size(uvKey);

                if (pv > 0) {
                    AccessStatsDO stat = new AccessStatsDO();
                    stat.setShortCode(shortCode);
                    stat.setStatDate(LocalDate.parse(date));
                    stat.setPv(pv);
                    stat.setUv(uv);
                    statsMapper.upsertStats(stat);
                    processed++;
                }
            } catch (Exception e) {
                log.error("Failed to sync stats for key={}", pvKey, e);
            }
        }
        log.info("Stats sync completed, scanned {} keys, synced {}", pvKeys.size(), processed);
    }
}
