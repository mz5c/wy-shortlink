package com.wy.shortlink.controller.config;

import com.wy.shortlink.service.StatsService;
import com.wy.shortlink.service.impl.AccessLogTableManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class ScheduleConfig {
    private final StatsService statsService;
    private final AccessLogTableManager tableManager;

    @Scheduled(cron = "0 */5 * * * ?")
    public void syncStats() {
        statsService.syncStatsFromRedis();
    }

    @Scheduled(cron = "0 0 2 1 * ?")
    public void ensureNextMonthTable() {
        tableManager.ensureTableExists();
        log.info("Monthly log table check completed");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        tableManager.ensureTableExists();
        log.info("Application ready, access log table ensured");
    }
}
