import { useEffect, useState, useCallback, useRef } from 'react';
import { Table, Button, Input, Space, Tag, Popconfirm, message, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, BarChartOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { shortLinkApi, ShortLinkVO } from '../../api/shortLinkApi';
import LinkFormModal from './LinkFormModal';

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
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // 取消上一次未完成的请求（防止 Strict Mode 双重调用）
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await shortLinkApi.list({ page, size, keyword });
      if (controller.signal.aborted) return;
      // 后端统一返回 { code, message, data: { total, page, size, list } }
      const body = res.data as any;
      if (body.code === 0 && body.data) {
        setData(body.data.list ?? []);
        setTotal(body.data.total ?? 0);
      }
    } catch {
      if (!controller.signal.aborted) message.error('获取数据失败');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
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

  const getStatusTag = (record: ShortLinkVO) => {
    if (record.deleted) {
      if (record.expireTime && new Date(record.expireTime) < new Date()) return <Tag color="red">已过期</Tag>;
      return <Tag color="default">已失效</Tag>;
    }
    return <Tag color="green">正常</Tag>;
  };

  const columns: ColumnsType<ShortLinkVO> = [
    { title: '短码', dataIndex: 'shortCode', key: 'shortCode', width: 100 },
    { title: '原始 URL', dataIndex: 'originalUrl', key: 'originalUrl', ellipsis: true,
      render: (url: string) => <Tooltip title={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></Tooltip> },
    { title: '访问量(PV)', dataIndex: 'pv', key: 'pv', width: 120 },
    { title: '过期时间', dataIndex: 'expireTime', key: 'expireTime', width: 180, render: (t: string | null) => t || '永久有效' },
    { title: '状态', key: 'status', width: 80, render: (_: unknown, r: ShortLinkVO) => getStatusTag(r) },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    { title: '操作', key: 'action', width: 200,
      render: (_: unknown, r: ShortLinkVO) => (
        <Space>
          <Button type="link" icon={<BarChartOutlined />} size="small" onClick={() => navigate(`/links/${r.shortCode}/stats`)}>统计</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除此短链？" onConfirm={() => handleDelete(r.shortCode)}>
            <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input placeholder="搜索短码或URL" prefix={<SearchOutlined />} value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }} style={{ width: 300 }} allowClear />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建短链</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="shortCode" loading={loading}
        pagination={{ current: page, pageSize: size, total, onChange: (p) => setPage(p), showTotal: (t) => `共 ${t} 条` }} />
      <LinkFormModal open={modalOpen} editingLink={editingLink} onOk={handleModalOk} onCancel={() => setModalOpen(false)} />
    </div>
  );
};

export default LinkListPage;
