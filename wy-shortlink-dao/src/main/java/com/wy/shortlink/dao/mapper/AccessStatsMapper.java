package com.wy.shortlink.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wy.shortlink.dao.entity.AccessStatsDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface AccessStatsMapper extends BaseMapper<AccessStatsDO> {
    void upsertStats(@Param("stat") AccessStatsDO stat);
    List<AccessStatsDO> selectByShortCodeAndDateRange(
            @Param("shortCode") String shortCode,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate
    );
    /** 批量查询多个 shortCode 的总计 PV/UV */
    List<AccessStatsDO> selectTotalByShortCodes(@Param("codes") java.util.Collection<String> codes);
}
