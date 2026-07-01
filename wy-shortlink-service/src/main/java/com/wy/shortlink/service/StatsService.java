package com.wy.shortlink.service;

import com.wy.shortlink.service.dto.StatsVO;

public interface StatsService {
    StatsVO getStats(String shortCode, String startDate, String endDate);
    void syncStatsFromRedis();
}
