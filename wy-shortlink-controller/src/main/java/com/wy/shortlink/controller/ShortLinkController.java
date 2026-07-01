package com.wy.shortlink.controller;

import com.wy.shortlink.common.result.PageResult;
import com.wy.shortlink.common.result.Result;
import com.wy.shortlink.service.ShortLinkService;
import com.wy.shortlink.service.StatsService;
import com.wy.shortlink.service.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/short-links")
@RequiredArgsConstructor
public class ShortLinkController {

    private final ShortLinkService shortLinkService;
    private final StatsService statsService;

    @Value("${shortlink.domain}")
    private String domain;

    @PostMapping
    public Result<ShortLinkVO> create(@RequestBody CreateLinkRequest req) {
        return Result.success(shortLinkService.createLink(req, domain));
    }

    @GetMapping
    public Result<PageResult<ShortLinkVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "createTime") String sortBy,
            @RequestParam(defaultValue = "desc") String order) {
        return Result.success(shortLinkService.listLinks(page, size, keyword, sortBy, order));
    }

    @GetMapping("/{shortCode}")
    public Result<ShortLinkVO> get(@PathVariable String shortCode) {
        return Result.success(shortLinkService.getLink(shortCode));
    }

    @PutMapping("/{shortCode}")
    public Result<ShortLinkVO> update(@PathVariable String shortCode, @RequestBody UpdateLinkRequest req) {
        return Result.success(shortLinkService.updateLink(shortCode, req));
    }

    @DeleteMapping("/{shortCode}")
    public Result<Void> delete(@PathVariable String shortCode) {
        shortLinkService.deleteLink(shortCode);
        return Result.success();
    }

    @GetMapping("/{shortCode}/stats")
    public Result<StatsVO> stats(@PathVariable String shortCode,
                                 @RequestParam String startDate,
                                 @RequestParam String endDate) {
        return Result.success(statsService.getStats(shortCode, startDate, endDate));
    }
}
