import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, LinkOutlined } from '@ant-design/icons';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/useAuthStore';
import '../App.css';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      const body = res.data as any;

      if (body.code !== 0 || !body.data?.accessToken) {
        message.error(body.message || '登录失败');
        return;
      }

      const { accessToken, refreshToken, userInfo } = body.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      useAuthStore.getState().login(userInfo);

      message.success('登录成功');
      const from = location.state?.from?.pathname || '/links';
      navigate(from, { replace: true });
    } catch (err: any) {
      message.error(err?.response?.data?.message || '登录失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* 左侧品牌区 */}
      <div className="login-brand">
        <div className="login-brand-icon">
          <LinkOutlined />
        </div>
        <h1>短链管理后台</h1>
        <p>高性能短链接服务，数据驱动、实时统计、高效管理</p>
      </div>

      {/* 右侧登录表单 */}
      <div className="login-form-area">
        <div className="login-form-card">
          <h2>账号登录</h2>
          <p className="subtitle">请输入您的账号信息</p>
          <Form onFinish={onFinish} size="large" autoComplete="off">
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94A3B8' }} />}
                placeholder="用户名"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
                placeholder="密码"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 42, fontWeight: 600 }}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
