import request from './request';

export interface CreateLinkParams {
  url: string;
  alias?: string;
  expireTime?: string;
}

export interface ShortLinkVO {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  expireTime: string | null;
  createTime: string;
  pv: number;
  uv: number;
  deleted: boolean;
}

export interface PageResult<T> {
  total: number;
  page: number;
  size: number;
  list: T[];
}

export interface StatsVO {
  shortCode: string;
  totalPv: number;
  totalUv: number;
  dailyStats: Array<{ date: string; pv: number; uv: number }>;
}

export const shortLinkApi = {
  create: (params: CreateLinkParams) => request.post<any, { data: ShortLinkVO }>('/short-links', params),
  list: (params: { page: number; size: number; keyword?: string; sortBy?: string; order?: string }) =>
    request.get<any, { data: PageResult<ShortLinkVO> }>('/short-links', { params }),
  get: (shortCode: string) => request.get<any, { data: ShortLinkVO }>(`/short-links/${shortCode}`),
  update: (shortCode: string, params: { url?: string; expireTime?: string }) =>
    request.put<any, { data: ShortLinkVO }>(`/short-links/${shortCode}`, params),
  delete: (shortCode: string) => request.delete(`/short-links/${shortCode}`),
  getStats: (shortCode: string, startDate: string, endDate: string) =>
    request.get<any, { data: StatsVO }>(`/short-links/${shortCode}/stats`, { params: { startDate, endDate } }),
};
