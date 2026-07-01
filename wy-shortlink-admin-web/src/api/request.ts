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

    if (response?.status !== 401 || config?.url === '/auth/refresh') {
      return Promise.reject(error);
    }

    if (!config) {
      doLogout();
      return Promise.reject(error);
    }

    const originalRequest = config;
    if ((originalRequest as any)._retry) {
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

      const body = res.data;
      if (body.code !== 0 || !body.data?.accessToken) {
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
  window.location.replace('/login');
}

export default request;
