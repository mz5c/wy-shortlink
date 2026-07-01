import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, theme } from 'antd';
import { LinkOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../api/authApi';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = useAuthStore((s) => s.userInfo);
  const logout = useAuthStore((s) => s.logout);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const menuItems = [{ key: '/links', icon: <LinkOutlined />, label: '短链管理' }];
  if (userInfo?.role === 'admin') {
    menuItems.push({ key: '/users', icon: <UserOutlined />, label: '用户管理' });
  }

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
          {collapsed ? 'SL' : '短链服务'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={({ key }) => navigate(key)} />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ marginRight: 16 }}>{userInfo?.username} ({userInfo?.role})</span>
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>退出</Button>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
