package com.wy.shortlink.controller;

import com.wy.shortlink.common.result.PageResult;
import com.wy.shortlink.common.result.Result;
import com.wy.shortlink.service.UserService;
import com.wy.shortlink.service.dto.CreateUserRequest;
import com.wy.shortlink.service.dto.UserVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public Result<UserVO> create(@Valid @RequestBody CreateUserRequest req) {
        return Result.success(userService.createUser(req));
    }

    @GetMapping
    @PreAuthorize("hasRole('admin')")
    public Result<PageResult<UserVO>> list(@RequestParam(defaultValue = "1") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return Result.success(userService.listUsers(page, size));
    }
}
