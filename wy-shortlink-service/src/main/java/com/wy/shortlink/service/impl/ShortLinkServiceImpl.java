package com.wy.shortlink.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.wy.shortlink.common.constant.Constants;
import com.wy.shortlink.common.enums.ErrorCode;
import com.wy.shortlink.common.exception.BizException;
import com.wy.shortlink.common.result.PageResult;
import com.wy.shortlink.common.util.Base62Utils;
import com.wy.shortlink.common.util.UrlValidator;
import com.wy.shortlink.dao.entity.ShortLinkDO;
import com.wy.shortlink.dao.mapper.ShortLinkMapper;
import com.wy.shortlink.service.ShortLinkService;
import com.wy.shortlink.service.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShortLinkServiceImpl implements ShortLinkService {

    private final ShortLinkMapper shortLinkMapper;
    private final StringRedisTemplate redisTemplate;

    private static final Pattern ALIAS_PATTERN = Pattern.compile("^[a-zA-Z0-9]{6,20}$");
    private static final DateTimeFormatter DT_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    @Override
    @Transactional
    public ShortLinkVO createLink(CreateLinkRequest req, String domain) {
        String url = UrlValidator.ensureProtocol(req.getUrl());
        if (!UrlValidator.isValid(url)) {
            throw new BizException(ErrorCode.URL_INVALID, "请提供有效的URL");
        }
        if (url.length() > 2048) {
            throw new BizException(ErrorCode.PARAM_ERROR, "URL 长度超过限制(2048字符)");
        }
        if (domain != null && url.contains(domain)) {
            throw new BizException(ErrorCode.PARAM_ERROR, "短链不能指向自身域名");
        }

        LocalDateTime expireTime = null;
        if (StringUtils.hasText(req.getExpireTime())) {
            try {
                expireTime = LocalDateTime.parse(req.getExpireTime(), DT_FORMAT);
            } catch (Exception e) {
                throw new BizException(ErrorCode.PARAM_ERROR, "过期时间格式不正确，请使用 yyyy-MM-ddTHH:mm:ss");
            }
            if (expireTime.isBefore(LocalDateTime.now())) {
                throw new BizException(ErrorCode.PARAM_ERROR, "过期时间不能早于当前时间");
            }
        }

        String shortCode;
        if (StringUtils.hasText(req.getAlias())) {
            if (!ALIAS_PATTERN.matcher(req.getAlias()).matches()) {
                throw new BizException(ErrorCode.PARAM_ERROR, "别名须为6-20位字母数字");
            }
            shortCode = req.getAlias();
        } else {
            Long id = redisTemplate.opsForValue().increment(Constants.REDIS_ID_KEY);
            if (id == null) {
                throw new BizException(ErrorCode.SYSTEM_ERROR, "ID 生成服务不可用");
            }
            shortCode = Base62Utils.encode(id);
        }

        ShortLinkDO entity = new ShortLinkDO();
        entity.setShortCode(shortCode);
        entity.setOriginalUrl(url);
        entity.setExpireTime(expireTime);

        int retries = 3;
        while (retries > 0) {
            try {
                shortLinkMapper.insert(entity);
                break;
            } catch (DuplicateKeyException e) {
                retries--;
                if (retries == 0) {
                    throw new BizException(ErrorCode.ALIAS_OCCUPIED, "别名已被占用，请换一个");
                }
                if (!StringUtils.hasText(req.getAlias())) {
                    Long newId = redisTemplate.opsForValue().increment(Constants.REDIS_ID_KEY);
                    shortCode = Base62Utils.encode(newId);
                    entity.setShortCode(shortCode);
                }
            }
        }

        String cacheKey = String.format(Constants.REDIS_LINK_KEY, shortCode);
        redisTemplate.opsForValue().set(cacheKey, url, 24 + (long) (Math.random() * 4), TimeUnit.HOURS);

        return ShortLinkVO.builder()
                .shortCode(shortCode)
                .shortUrl(domain + "/s/" + shortCode)
                .originalUrl(url)
                .expireTime(expireTime != null ? expireTime.format(DT_FORMAT) : null)
                .createTime(LocalDateTime.now().format(DT_FORMAT))
                .pv(0L).uv(0L).deleted(false)
                .build();
    }

    @Override
    public PageResult<ShortLinkVO> listLinks(int page, int size, String keyword, String sortBy, String order) {
        LambdaQueryWrapper<ShortLinkDO> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(ShortLinkDO::getShortCode, keyword)
                    .or().like(ShortLinkDO::getOriginalUrl, keyword));
        }
        if ("createTime".equals(sortBy)) {
            wrapper.orderBy(true, "asc".equalsIgnoreCase(order), ShortLinkDO::getCreateTime);
        } else {
            wrapper.orderByDesc(ShortLinkDO::getCreateTime);
        }

        Page<ShortLinkDO> mpPage = new Page<>(page, size);
        Page<ShortLinkDO> result = shortLinkMapper.selectPage(mpPage, wrapper);

        List<ShortLinkVO> vos = result.getRecords().stream().map(this::toVO).collect(Collectors.toList());
        return PageResult.of(result.getTotal(), page, size, vos);
    }

    @Override
    public ShortLinkVO getLink(String shortCode) {
        ShortLinkDO entity = shortLinkMapper.selectByShortCode(shortCode);
        if (entity == null) throw new BizException(ErrorCode.SHORT_CODE_NOT_FOUND);
        return toVO(entity);
    }

    @Override
    @Transactional
    public ShortLinkVO updateLink(String shortCode, UpdateLinkRequest req) {
        ShortLinkDO entity = shortLinkMapper.selectByShortCode(shortCode);
        if (entity == null) throw new BizException(ErrorCode.SHORT_CODE_NOT_FOUND);
        if (entity.getExpireTime() != null && entity.getExpireTime().isBefore(LocalDateTime.now())) {
            throw new BizException(ErrorCode.LINK_EXPIRED);
        }

        if (StringUtils.hasText(req.getUrl())) {
            String url = UrlValidator.ensureProtocol(req.getUrl());
            if (!UrlValidator.isValid(url)) throw new BizException(ErrorCode.URL_INVALID);
            entity.setOriginalUrl(url);
        }
        if (StringUtils.hasText(req.getExpireTime())) {
            entity.setExpireTime(LocalDateTime.parse(req.getExpireTime(), DT_FORMAT));
        }
        shortLinkMapper.updateById(entity);

        String cacheKey = String.format(Constants.REDIS_LINK_KEY, shortCode);
        redisTemplate.opsForValue().set(cacheKey, entity.getOriginalUrl(), 24 + (long) (Math.random() * 4), TimeUnit.HOURS);

        return toVO(entity);
    }

    @Override
    @Transactional
    public void deleteLink(String shortCode) {
        ShortLinkDO entity = shortLinkMapper.selectByShortCode(shortCode);
        if (entity == null) throw new BizException(ErrorCode.SHORT_CODE_NOT_FOUND);
        shortLinkMapper.deleteById(entity.getId());
        redisTemplate.delete(String.format(Constants.REDIS_LINK_KEY, shortCode));
    }

    private ShortLinkVO toVO(ShortLinkDO entity) {
        boolean isExpired = entity.getExpireTime() != null && entity.getExpireTime().isBefore(LocalDateTime.now());
        return ShortLinkVO.builder()
                .shortCode(entity.getShortCode())
                .originalUrl(entity.getOriginalUrl())
                .expireTime(entity.getExpireTime() != null ? entity.getExpireTime().format(DT_FORMAT) : null)
                .createTime(entity.getCreateTime().format(DT_FORMAT))
                .deleted(entity.getDeleted() == 1 || isExpired)
                .pv(0L).uv(0L)
                .build();
    }
}
