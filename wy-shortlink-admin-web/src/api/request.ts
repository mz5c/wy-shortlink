import axios, { AxiosError } from 'axios';

const request = axios.create({ baseURL: '/api/v1', timeout: 10000 });

// --- request interceptor ---
request.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// --- response interceptor (401 auto-refresh) ---
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

request.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { config, response } = error;

    if (response?.status !== 401 || config?.url === '/auth/refresh') {
      return Promise.reject(error);
    }

    if (!config) {
      console.warn('[Request] 401 但无 request config，登出');
      doLogout();
      return Promise.reject(error);
    }

    const originalRequest = config;
    if ((originalRequest as any)._retry) {
      console.warn('[Request] 刷新后仍然 401，登出');
      doLogout();
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.warn('[Request] 401 但无 refreshToken，登出');
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
      console.log('[Request] 401，尝试刷新 token');
      const res = await axios.post('/api/v1/auth/refresh', { refreshToken });

      const body = res.data;
      if (body.code !== 0 || !body.data?.accessToken) {
        console.warn('[Request] 刷新失败:', body.message);
        doLogout();
        return Promise.reject(error);
      }

      const { accessToken, refreshToken: newRefresh } = body.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefresh);

      pendingRequests.forEach((cb) => cb(accessToken));
      pendingRequests = [];

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      console.log('[Request] token 刷新成功');
      return request(originalRequest);
    } catch (refreshErr) {
      console.error('[Request] 刷新请求异常:', refreshErr);
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
  window.location.replace('/login');
}

export default request;
