import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { userApi, UserVO } from '../../api/userApi';

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
      setData(res.data.list); setTotal(res.data.total);
    } catch { message.error('获取用户列表失败'); }
    finally { setLoading(false); }
  }, [page, size]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = () => { form.resetFields(); setModalOpen(true); };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await userApi.create(values);
      message.success('用户创建成功');
      setModalOpen(false); fetchData();
    } catch (err: any) {
      if (err?.response) message.error(err.response.data?.message || '创建失败');
    }
  };

  const columns: ColumnsType<UserVO> = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (role: string) => <Tag color={role === 'admin' ? 'red' : 'blue'}>{role}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: number) => <Tag color={status === 1 ? 'green' : 'red'}>{status === 1 ? '启用' : '禁用'}</Tag> },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h3>用户管理</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建用户</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="username" loading={loading}
        pagination={{ current: page, pageSize: size, total, onChange: (p) => setPage(p), showTotal: (t) => `共 ${t} 条` }} />
      <Modal title="创建用户" open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, min: 3, message: '用户名至少3个字符' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6, message: '密码至少6个字符' }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="user" rules={[{ required: true }]}>
            <Select options={[{ label: '普通用户 (user)', value: 'user' }, { label: '管理员 (admin)', value: 'admin' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserListPage;
