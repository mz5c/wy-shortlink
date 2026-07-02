import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { userApi, UserVO } from '../../api/userApi';
import '../../App.css';

const UserListPage: React.FC = () => {
  const [data, setData] = useState<UserVO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.list({ page, size });
      const body = res.data as any;
      if (body.code === 0 && body.data) {
        setData(body.data.list ?? []);
        setTotal(body.data.total ?? 0);
      }
    } catch {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = () => { form.resetFields(); setModalOpen(true); };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await userApi.create(values);
      message.success('用户创建成功');
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err?.response) message.error(err.response.data?.message || '创建失败');
    }
  };

  const columns: ColumnsType<UserVO> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 180,
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: '#0F172A' }}>
          <UserOutlined style={{ marginRight: 6, color: '#94A3B8' }} />
          {name}
        </span>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'blue' : 'default'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (t: string) => (
        <span style={{ fontSize: 12, color: '#64748B' }}>{t}</span>
      ),
    },
  ];

  const adminCount = data.filter((u) => u.role === 'admin').length;
  const activeCount = data.filter((u) => u.status === 1).length;

  return (
    <div>
      {/* KPI 概览 */}
      <div className="kpi-row">
        <div className="stat-card">
          <div className="stat-label">
            <UserOutlined style={{ marginRight: 4 }} />用户总数
          </div>
          <div className="stat-value">{total}</div>
          <div className="stat-trend" style={{ color: '#64748B' }}>
            管理员 {adminCount} 人
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">启用用户</div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-trend" style={{ color: '#16A34A' }}>
            当前页统计
          </div>
        </div>
        {/* 占位：保持网格对齐 */}
        <div />
        <div />
      </div>

      {/* 表格卡片 */}
      <div className="data-table-card">
        <div className="table-header table-header-responsive">
          <h3>用户列表</h3>
          <div className="table-header-actions">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建用户
            </Button>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="username"
          loading={loading}
          size="middle"
          scroll={{ x: 560 }}
          pagination={{
            current: page,
            pageSize: size,
            total,
            onChange: (p) => setPage(p),
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: false,
          }}
          locale={{ emptyText: <div className="empty-state"><p>暂无用户数据</p></div> }}
        />
      </div>

      <Modal
        title="创建用户"
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, min: 3, message: '用户名至少3个字符' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, min: 6, message: '密码至少6个字符' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            initialValue="user"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: '普通用户 (user)', value: 'user' },
                { label: '管理员 (admin)', value: 'admin' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserListPage;
