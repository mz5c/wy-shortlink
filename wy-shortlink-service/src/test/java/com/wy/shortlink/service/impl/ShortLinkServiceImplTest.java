package com.wy.shortlink.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.wy.shortlink.common.enums.ErrorCode;
import com.wy.shortlink.common.exception.BizException;
import com.wy.shortlink.common.util.Base62Utils;
import com.wy.shortlink.dao.entity.ShortLinkDO;
import com.wy.shortlink.dao.mapper.AccessStatsMapper;
import com.wy.shortlink.dao.mapper.ShortLinkMapper;
import com.wy.shortlink.service.dto.CreateLinkRequest;
import com.wy.shortlink.service.dto.ShortLinkVO;
import com.wy.shortlink.service.dto.UpdateLinkRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShortLinkServiceImplTest {

    @Mock
    private ShortLinkMapper shortLinkMapper;
    @Mock
    private AccessStatsMapper statsMapper;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOps;

    private ShortLinkServiceImpl service;
    private static final String DOMAIN = "http://localhost:8080";

    @BeforeEach
    void setUp() {
        service = new ShortLinkServiceImpl(shortLinkMapper, statsMapper, redisTemplate, DOMAIN);
    }

    @Test
    void createLink_withValidUrl_shouldReturnShortLinkVO() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        // 随机生成短码后仍会写缓存
        when(shortLinkMapper.insert(any(ShortLinkDO.class))).thenAnswer(invocation -> {
            ShortLinkDO entity = invocation.getArgument(0);
            entity.setCreateTime(LocalDateTime.now());
            return 1;
        });

        CreateLinkRequest req = new CreateLinkRequest();
        req.setUrl("https://example.com/test");

        ShortLinkVO vo = service.createLink(req);

        assertNotNull(vo);
        assertNotNull(vo.getShortCode());
        assertEquals(Base62Utils.DEFAULT_CODE_LENGTH, vo.getShortCode().length(),
                "随机短码应为6位");
        assertTrue(Pattern.matches("^[0-9a-zA-Z]+$", vo.getShortCode()),
                "短码应仅包含 Base62 字符");
        assertEquals(DOMAIN + "/s/" + vo.getShortCode(), vo.getShortUrl());
        assertNotNull(vo.getCreateTime());
        verify(shortLinkMapper).insert(any(ShortLinkDO.class));
    }

    @Test
    void createLink_withEmptyUrl_shouldThrow() {
        CreateLinkRequest req = new CreateLinkRequest();
        req.setUrl("");

        assertThrows(BizException.class, () -> service.createLink(req));
    }

    @Test
    void createLink_withSelfDomain_shouldThrow() {
        CreateLinkRequest req = new CreateLinkRequest();
        req.setUrl("http://localhost:8080/s/abc");

        assertThrows(BizException.class, () -> service.createLink(req));
    }

    @Test
    void createLink_withExpiredTime_shouldThrow() {
        CreateLinkRequest req = new CreateLinkRequest();
        req.setUrl("https://example.com");
        req.setExpireTime("2020-01-01T00:00:00");

        assertThrows(BizException.class, () -> service.createLink(req));
    }

    @Test
    void getLink_whenNotFound_shouldThrow() {
        when(shortLinkMapper.selectByShortCode("nonexistent")).thenReturn(null);

        assertThrows(BizException.class, () -> service.getLink("nonexistent"));
    }

    @Test
    void getLink_whenFound_shouldReturnVO() {
        ShortLinkDO entity = new ShortLinkDO();
        entity.setShortCode("abc");
        entity.setOriginalUrl("https://example.com");
        entity.setCreateTime(LocalDateTime.now());
        entity.setDeleted(0);

        when(shortLinkMapper.selectByShortCode("abc")).thenReturn(entity);

        ShortLinkVO vo = service.getLink("abc");
        assertNotNull(vo);
        assertEquals("abc", vo.getShortCode());
        assertEquals(DOMAIN + "/s/abc", vo.getShortUrl());
    }

    @Test
    void listLinks_shouldReturnPageResult() {
        Page<ShortLinkDO> mpPage = new Page<>(1, 20);
        mpPage.setTotal(0);
        mpPage.setRecords(java.util.Collections.emptyList());

        when(shortLinkMapper.selectPage(any(Page.class), any())).thenReturn(mpPage);

        var result = service.listLinks(1, 20, null, "createTime", "desc");
        assertNotNull(result);
        assertEquals(0, result.getTotal());
    }

    @Test
    void deleteLink_whenNotFound_shouldThrow() {
        when(shortLinkMapper.selectByShortCode("nonexistent")).thenReturn(null);

        assertThrows(BizException.class, () -> service.deleteLink("nonexistent"));
    }
}
