import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, DatePicker, Breadcrumb, Spin, message, Typography, Tag } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUpOutlined, LinkOutlined, EyeOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { shortLinkApi, ShortLinkVO, StatsVO } from '../../api/shortLinkApi';
import '../../App.css';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const LinkStatsPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<ShortLinkVO | null>(null);
  const [stats, setStats] = useState<StatsVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    Promise.all([
      shortLinkApi.get(code),
      shortLinkApi.getStats(
        code,
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD'),
      ),
    ])
      .then(([linkRes, statsRes]) => {
        const linkBody = linkRes.data as any;
        const statsBody = statsRes.data as any;
        if (linkBody.code === 0 && linkBody.data) setLink(linkBody.data);
        if (statsBody.code === 0 && statsBody.data) setStats(statsBody.data);
      })
      .catch(() => message.error('获取统计数据失败'))
      .finally(() => setLoading(false));
  }, [code, dateRange]);

  const chartData =
    stats?.dailyStats?.map((d) => ({
      date: d.date,
      PV: d.pv,
      UV: d.uv,
    })) || [];

  // 计算趋势（简单比较前两天）
  const trendPv =
    chartData.length >= 2
      ? ((chartData[chartData.length - 1].PV - chartData[0].PV) / Math.max(chartData[0].PV, 1)) * 100
      : 0;

  return (
    <div>
      {/* 面包屑 */}
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb
          items={[
            {
              title: (
                <a onClick={() => navigate('/links')}>
                  <LinkOutlined style={{ marginRight: 4 }} />
                  短链管理
                </a>
              ),
            },
            { title: '访问统计' },
          ]}
        />
      </div>

      <Spin spinning={loading}>
        {/* 短链信息卡 */}
        {link && (
          <Card
            size="small"
            style={{ marginBottom: 16, border: '1px solid #E2E8F0' }}
            bodyStyle={{ padding: '14px 20px' }}
          >
            <Row gutter={24} align="middle">
              <Col flex="auto">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span className="short-code-tag" style={{ fontSize: 14 }}>
                    {link.shortCode}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 2 }}>短链</div>
                    <Text copyable style={{ fontSize: 13, color: '#1E40AF' }}>
                      {link.shortUrl}
                    </Text>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 2 }}>原始 URL</div>
                    <Text
                      ellipsis
                      style={{ fontSize: 13, color: '#475569', maxWidth: 420 }}
                    >
                      {link.originalUrl}
                    </Text>
                  </div>
                  <Tag color={link.deleted ? 'error' : 'success'}>
                    {link.deleted ? '已失效' : '正常'}
                  </Tag>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* KPI 卡片 + 日期选择 */}
        <div className="kpi-row">
          <div className="stat-card">
            <div className="stat-label">
              <EyeOutlined style={{ marginRight: 4 }} />总 PV
            </div>
            <div className="stat-value">
              {(stats?.totalPv || 0).toLocaleString()}
            </div>
            <div className="stat-trend" style={{ color: trendPv >= 0 ? '#16A34A' : '#DC2626' }}>
              {chartData.length >= 2 ? (
                <>
                  <ArrowUpOutlined
                    rotate={trendPv < 0 ? 180 : 0}
                    style={{ fontSize: 10 }}
                  />{' '}
                  {Math.abs(trendPv).toFixed(1)}% vs 起始日
                </>
              ) : (
                '—'
              )}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              <TeamOutlined style={{ marginRight: 4 }} />总 UV
            </div>
            <div className="stat-value">
              {(stats?.totalUv || 0).toLocaleString()}
            </div>
            <div className="stat-trend" style={{ color: '#64748B' }}>
              去重访客数
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              <CalendarOutlined style={{ marginRight: 4 }} />PV / UV 比
            </div>
            <div className="stat-value">
              {stats?.totalUv
                ? (stats.totalPv / stats.totalUv).toFixed(1)
                : '—'}
            </div>
            <div className="stat-trend" style={{ color: '#64748B' }}>
              人均访问次数
            </div>
          </div>

          <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates?.[0] && dates[1]) setDateRange([dates[0], dates[1]]);
              }}
              allowClear={false}
              size="middle"
            />
          </div>
        </div>

        {/* 趋势图 */}
        <Card
          title={
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              每日 PV / UV 趋势
            </span>
          }
          size="small"
          style={{ border: '1px solid #E2E8F0' }}
          bodyStyle={{ padding: '16px 20px' }}
        >
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="PV"
                  stroke="#1E40AF"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#1E40AF', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#1E40AF', strokeWidth: 2, stroke: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="UV"
                  stroke="#16A34A"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#16A34A', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#16A34A', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <p>所选日期范围内暂无访问数据</p>
            </div>
          )}
        </Card>
      </Spin>
    </div>
  );
};

export default LinkStatsPage;
