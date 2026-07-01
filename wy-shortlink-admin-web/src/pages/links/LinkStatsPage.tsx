import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, DatePicker, Breadcrumb, Spin, message, Typography } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { shortLinkApi, ShortLinkVO, StatsVO } from '../../api/shortLinkApi';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const LinkStatsPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<ShortLinkVO | null>(null);
  const [stats, setStats] = useState<StatsVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(7, 'day'), dayjs()]);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    Promise.all([
      shortLinkApi.get(code),
      shortLinkApi.getStats(code, dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')),
    ]).then(([linkRes, statsRes]) => { setLink(linkRes.data); setStats(statsRes.data); })
      .catch(() => message.error('获取统计数据失败'))
      .finally(() => setLoading(false));
  }, [code, dateRange]);

  const chartData = stats?.dailyStats.map((d) => ({ date: d.date, PV: d.pv, UV: d.uv })) || [];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: <a onClick={() => navigate('/links')}>短链管理</a> }, { title: '访问统计' }]} />
      </div>
      <Spin spinning={loading}>
        {link && (
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}><Text strong>短链：</Text><Text copyable>{link.shortUrl}</Text></Col>
              <Col span={12}><Text strong>原始 URL：</Text><Text ellipsis style={{ maxWidth: 400 }}>{link.originalUrl}</Text></Col>
            </Row>
          </Card>
        )}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}><Card><Statistic title="总 PV" value={stats?.totalPv || 0} /></Card></Col>
          <Col span={8}><Card><Statistic title="总 UV" value={stats?.totalUv || 0} /></Card></Col>
          <Col span={8}><Card><RangePicker value={dateRange} onChange={(dates) => { if (dates?.[0] && dates[1]) setDateRange([dates[0], dates[1]]); }} /></Card></Col>
        </Row>
        <Card title="每日 PV / UV 趋势">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="PV" stroke="#1677ff" strokeWidth={2} />
                <Line type="monotone" dataKey="UV" stroke="#52c41a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>暂无数据</div>}
        </Card>
      </Spin>
    </div>
  );
};

export default LinkStatsPage;
