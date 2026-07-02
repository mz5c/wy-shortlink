import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Input, Space, Tag, Popconfirm, message, Tooltip } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  BarChartOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  LinkOutlined,
  EyeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { shortLinkApi, ShortLinkVO } from '../../api/shortLinkApi';
import LinkFormModal from './LinkFormModal';
import '../../App.css';

/** 复制到剪贴板（兼容非 HTTPS 环境） */
const fallbackCopy = (text: string) => {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  message.success('已复制');
};

const LinkListPage: React.FC = () => {
  const [data, setData] = useState<ShortLinkVO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ShortLinkVO | undefined>();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shortLinkApi.list({ page, size, keyword });
      const body = res.data as any;
      if (body.code === 0 && body.data) {
        setData(body.data.list ?? []);
        setTotal(body.data.total ?? 0);
      }
    } catch {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [page, size, keyword]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = () => { setEditingLink(undefined); setModalOpen(true); };
  const handleEdit = (record: ShortLinkVO) => { setEditingLink(record); setModalOpen(true); };

  const handleModalOk = async (values: any) => {
    try {
      if (editingLink?.shortCode) {
        await shortLinkApi.update(editingLink.shortCode, values);
        message.success('更新成功');
      } else {
        await shortLinkApi.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (shortCode: string) => {
    try {
      await shortLinkApi.delete(shortCode);
      message.success('删除成功');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  // 汇总统计
  const totalPv = data.reduce((sum, item) => sum + (item.pv || 0), 0);
  const totalUv = data.reduce((sum, item) => sum + (item.uv || 0), 0);
  const activeCount = data.filter((item) => !item.deleted).length;

  const getStatusTag = (record: ShortLinkVO) => {
    if (record.deleted) {
      if (record.expireTime && new Date(record.expireTime) < new Date()) {
        return <Tag color="error">已过期</Tag>;
      }
      return <Tag color="default">已失效</Tag>;
    }
    return <Tag color="success">正常</Tag>;
  };

  const columns: ColumnsType<ShortLinkVO> = [
    {
      title: '短码',
      dataIndex: 'shortCode',
      key: 'shortCode',
      width: 110,
      render: (code: string) => <span className="short-code-tag">{code}</span>,
    },
    {
      title: '短链',
      dataIndex: 'shortUrl',
      key: 'shortUrl',
      width: 250,
      ellipsis: true,
      render: (url: string) => (
        <Space size={4}>
          <span style={{ color: '#1E40AF', fontSize: 12 }}>{url}</span>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            style={{ color: '#94A3B8' }}
            onClick={() => {
              try {
                navigator.clipboard.writeText(url).then(
                  () => message.success('已复制'),
                  () => fallbackCopy(url),
                );
              } catch {
                fallbackCopy(url);
              }
            }}
          />
        </Space>
      ),
    },
    {
      title: '原始 URL',
      dataIndex: 'originalUrl',
      key: 'originalUrl',
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#475569', fontSize: 12 }}
          >
            {url}
          </a>
        </Tooltip>
      ),
    },
    {
      title: 'PV',
      dataIndex: 'pv',
      key: 'pv',
      width: 80,
      align: 'right',
      sorter: (a, b) => (a.pv || 0) - (b.pv || 0),
      render: (v: number) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v ?? 0}</span>
      ),
    },
    {
      title: 'UV',
      dataIndex: 'uv',
      key: 'uv',
      width: 80,
      align: 'right',
      sorter: (a, b) => (a.uv || 0) - (b.uv || 0),
      render: (v: number) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v ?? 0}</span>
      ),
    },
    {
      title: '过期时间',
      dataIndex: 'expireTime',
      key: 'expireTime',
      width: 130,
      render: (t: string | null) => (
        <span style={{ color: t ? '#475569' : '#94A3B8', fontSize: 12 }}>
          {t || '永久有效'}
        </span>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 70,
      render: (_: unknown, r: ShortLinkVO) => getStatusTag(r),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 130,
      render: (t: string) => (
        <span style={{ fontSize: 12, color: '#64748B' }}>{t}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, r: ShortLinkVO) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<BarChartOutlined />} onClick={() => navigate(`/links/${r.shortCode}/stats`)}>
            统计
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此短链？" onConfirm={() => handleDelete(r.shortCode)} placement="topRight">
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* KPI 概览 */}
      <div className="kpi-row">
        <div className="stat-card">
          <div className="stat-label">
            <LinkOutlined style={{ marginRight: 4 }} />短链总数
          </div>
          <div className="stat-value">{total}</div>
          <div className="stat-trend" style={{ color: '#64748B' }}>
            有效 {activeCount} 条
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <EyeOutlined style={{ marginRight: 4 }} />总 PV
          </div>
          <div className="stat-value">{totalPv.toLocaleString()}</div>
          <div className="stat-trend" style={{ color: '#16A34A' }}>当前页汇总</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <TeamOutlined style={{ marginRight: 4 }} />总 UV
          </div>
          <div className="stat-value">{totalUv.toLocaleString()}</div>
          <div className="stat-trend" style={{ color: '#16A34A' }}>当前页汇总</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📊 每链平均 PV</div>
          <div className="stat-value">
            {data.length > 0 ? Math.round(totalPv / data.length).toLocaleString() : '—'}
          </div>
          <div className="stat-trend" style={{ color: '#64748B' }}>PV ÷ 短链数</div>
        </div>
      </div>

      {/* 表格卡片 */}
      <div className="data-table-card">
        <div className="table-header table-header-responsive">
          <h3>短链列表</h3>
          <div className="table-header-actions">
            <Input
              placeholder="搜索短码或 URL…"
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              style={{ width: 280 }}
              allowClear
              size="middle"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建短链
            </Button>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="shortCode"
          loading={loading}
          size="middle"
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize: size,
            total,
            onChange: (p) => setPage(p),
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: false,
          }}
          locale={{ emptyText: <div className="empty-state"><p>暂无短链数据，点击"新建短链"开始</p></div> }}
        />
      </div>

      <LinkFormModal
        open={modalOpen}
        editingLink={editingLink}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};

export default LinkListPage;
