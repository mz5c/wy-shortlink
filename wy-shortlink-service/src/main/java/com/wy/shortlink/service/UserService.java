package com.wy.shortlink.service;

import com.wy.shortlink.common.result.PageResult;
import com.wy.shortlink.service.dto.CreateUserRequest;
import com.wy.shortlink.service.dto.UserVO;

public interface UserService {

    UserVO createUser(CreateUserRequest req);

    PageResult<UserVO> listUsers(int page, int size);
}
