package com.wy.shortlink.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wy.shortlink.dao.entity.ShortLinkDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ShortLinkMapper extends BaseMapper<ShortLinkDO> {
    ShortLinkDO selectByShortCode(@Param("shortCode") String shortCode);
}
