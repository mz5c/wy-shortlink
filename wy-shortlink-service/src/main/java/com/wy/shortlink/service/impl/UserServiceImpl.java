package com.wy.shortlink.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.wy.shortlink.common.enums.ErrorCode;
import com.wy.shortlink.common.exception.BizException;
import com.wy.shortlink.common.result.PageResult;
import com.wy.shortlink.dao.entity.UserDO;
import com.wy.shortlink.dao.mapper.UserMapper;
import com.wy.shortlink.service.UserService;
import com.wy.shortlink.service.dto.CreateUserRequest;
import com.wy.shortlink.service.dto.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;

    private final PasswordEncoder passwordEncoder;

    private static final Set<String> VALID_ROLES = Set.of("admin", "user");

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    @Override
    @Transactional
    public UserVO createUser(CreateUserRequest req) {
        if (!StringUtils.hasText(req.getUsername()) || req.getUsername().length() < 3) {
            throw new BizException(ErrorCode.PARAM_ERROR, "用户名至少3个字符");
        }
        if (!StringUtils.hasText(req.getPassword()) || req.getPassword().length() < 6) {
            throw new BizException(ErrorCode.PARAM_ERROR, "密码至少6个字符");
        }
        String role = StringUtils.hasText(req.getRole()) ? req.getRole() : "user";
        if (!VALID_ROLES.contains(role)) {
            throw new BizException(ErrorCode.PARAM_ERROR, "无效的角色，仅支持 admin 或 user");
        }
        UserDO existing = userMapper.selectByUsername(req.getUsername());
        if (existing != null) {
            throw new BizException(ErrorCode.USERNAME_EXISTS);
        }
        UserDO user = new UserDO();
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(role);
        user.setStatus(1);
        userMapper.insert(user);
        return UserVO.builder()
                .username(user.getUsername())
                .role(user.getRole())
                .status(user.getStatus())
                .createTime(user.getCreateTime().format(DT))
                .build();
    }

    @Override
    public PageResult<UserVO> listUsers(int page, int size) {
        LambdaQueryWrapper<UserDO> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(UserDO::getCreateTime);
        Page<UserDO> mpPage = new Page<>(page, size);
        Page<UserDO> result = userMapper.selectPage(mpPage, wrapper);
        List<UserVO> vos = result.getRecords().stream()
                .map(u -> UserVO.builder()
                        .username(u.getUsername())
                        .role(u.getRole())
                        .status(u.getStatus())
                        .createTime(u.getCreateTime().format(DT))
                        .build())
                .collect(Collectors.toList());
        return PageResult.of(result.getTotal(), page, size, vos);
    }
}
