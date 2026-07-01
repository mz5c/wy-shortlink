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
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private final AccessStatsMapper statsMapper;
    private final ShortLinkMapper shortLinkMapper;
    private final StringRedisTemplate redisTemplate;

    @Override
    public StatsVO getStats(String shortCode, String startDate, String endDate) {
        ShortLinkDO link = shortLinkMapper.selectByShortCode(shortCode);
        if (link == null) {
            throw new BizException(ErrorCode.SHORT_CODE_NOT_FOUND);
        }

        List<AccessStatsDO> stats = statsMapper.selectByShortCodeAndDateRange(shortCode, startDate, endDate);
        long totalPv = stats.stream().mapToLong(AccessStatsDO::getPv).sum();
        long totalUv = stats.stream().mapToLong(AccessStatsDO::getUv).sum();
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
        Set<String> pvKeys = redisTemplate.keys("sl:stats:pv:*:" + today);
        if (pvKeys == null || pvKeys.isEmpty()) {
            return;
        }

        for (String pvKey : pvKeys) {
            try {
                String[] parts = pvKey.split(":");
                if (parts.length < 5) {
                    continue;
                }
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
                }
            } catch (Exception e) {
                log.error("Failed to sync stats for key={}", pvKey, e);
            }
        }
        log.info("Stats sync completed, processed {} keys", pvKeys.size());
    }
}
