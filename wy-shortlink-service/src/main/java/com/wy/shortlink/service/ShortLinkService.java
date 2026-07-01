package com.wy.shortlink.service;

import com.wy.shortlink.common.result.PageResult;
import com.wy.shortlink.service.dto.*;

public interface ShortLinkService {
    ShortLinkVO createLink(CreateLinkRequest req, String domain);
    PageResult<ShortLinkVO> listLinks(int page, int size, String keyword, String sortBy, String order);
    ShortLinkVO getLink(String shortCode);
    ShortLinkVO updateLink(String shortCode, UpdateLinkRequest req);
    void deleteLink(String shortCode);
}
