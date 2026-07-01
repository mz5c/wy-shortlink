import request from './request';

export interface CreateUserParams {
  username: string;
  password: string;
  role: string;
}

export interface UserVO {
  username: string;
  role: string;
  status: number;
  createTime: string;
}

export const userApi = {
  create: (params: CreateUserParams) => request.post<any, { data: UserVO }>('/users', params),
  list: (params: { page: number; size: number }) =>
    request.get<any, { data: { total: number; page: number; size: number; list: UserVO[] } }>('/users', { params }),
};
