import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/useAuthStore';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      const body = res.data;

      // 后端统一返回 { code, message, data }，code=0 才算成功
      if ((body as any).code !== 0 || !(body as any).data?.accessToken) {
        message.error((body as any).message || '登录失败');
        return;
      }

      const { accessToken, refreshToken, userInfo } = (body as any).data;
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card title="短链服务 - 登录" style={{ width: 400 }}>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
