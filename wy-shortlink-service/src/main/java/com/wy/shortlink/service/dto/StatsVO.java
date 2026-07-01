package com.wy.shortlink.service.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class StatsVO {
    private String shortCode;
    private Long totalPv;
    private Long totalUv;
    private List<DailyStat> dailyStats;

    @Data
    @Builder
    public static class DailyStat {
        private String date;
        private Long pv;
        private Long uv;
    }
}
