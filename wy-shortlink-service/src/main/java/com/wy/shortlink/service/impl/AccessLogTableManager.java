package com.wy.shortlink.service.impl;

import com.wy.shortlink.dao.mapper.AccessLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class AccessLogTableManager {
    private final AccessLogMapper accessLogMapper;
    private final ConcurrentHashMap<String, Boolean> createdTables = new ConcurrentHashMap<>();
    /** 只允许 t_access_log_yyyyMM 格式，防止注入 */
    private static final java.util.regex.Pattern TABLE_NAME_PATTERN =
            java.util.regex.Pattern.compile("^t_access_log_\\d{6}$");
    private static final DateTimeFormatter TABLE_SUFFIX = DateTimeFormatter.ofPattern("yyyyMM");

    private void validateTableName(String tableName) {
        if (!TABLE_NAME_PATTERN.matcher(tableName).matches()) {
            throw new IllegalArgumentException("Invalid table name: " + tableName);
        }
    }

    public String getCurrentTableName() {
        return "t_access_log_" + LocalDate.now().format(TABLE_SUFFIX);
    }

    public String getTableName(int year, int month) {
        return String.format("t_access_log_%04d%02d", year, month);
    }

    public void ensureTableExists() {
        String tableName = getCurrentTableName();
        createdTables.computeIfAbsent(tableName, key -> {
            validateTableName(key);
            accessLogMapper.createTableIfNotExists(key);
            log.info("Created access log table: {}", key);
            return true;
        });
    }
}
