import request from './request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  userInfo: { username: string; role: string };
}

export const authApi = {
  login: (params: LoginParams) => request.post<any, { data: LoginResult }>('/auth/login', params),
  refresh: (refreshToken: string) => request.post('/auth/refresh', { refreshToken }),
  logout: () => request.post('/auth/logout'),
};
