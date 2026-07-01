import axios, { AxiosError } from 'axios';

const request = axios.create({ baseURL: '/api/v1', timeout: 10000 });

request.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

request.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { config, response } = error;

    // 非 401 或 refresh 接口自身的错误，不触发刷新逻辑
    if (response?.status !== 401 || config?.url === '/auth/refresh') {
      return Promise.reject(error);
    }

    if (!config) {
      doLogout();
      return Promise.reject(error);
    }
    const originalRequest = config;
    const alreadyRetried = (originalRequest as any)._retry;

    if (alreadyRetried) {
      // 已经用新 token 重试过了还是 401，说明 refresh token 也废了
      doLogout();
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      doLogout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push((token: string) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(request(originalRequest));
        });
      });
    }

    (originalRequest as any)._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefresh } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefresh);

      pendingRequests.forEach((cb) => cb(accessToken));
      pendingRequests = [];

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return request(originalRequest);
    } catch {
      pendingRequests = [];
      doLogout();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

function doLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');
  // 使用 replace 避免浏览器 history 中留下失效页面
  window.location.replace('/login');
}

export default request;
