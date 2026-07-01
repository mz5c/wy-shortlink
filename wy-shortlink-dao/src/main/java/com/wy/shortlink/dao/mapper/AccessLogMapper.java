package com.wy.shortlink.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wy.shortlink.dao.entity.AccessLogDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AccessLogMapper extends BaseMapper<AccessLogDO> {
    void createTableIfNotExists(@Param("tableName") String tableName);
    int insertLog(@Param("tableName") String tableName, @Param("log") AccessLogDO log);
}
