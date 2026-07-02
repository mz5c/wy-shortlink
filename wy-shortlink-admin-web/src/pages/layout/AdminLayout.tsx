import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button } from 'antd';
import {
  LinkOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../api/authApi';
import '../../App.css';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = useAuthStore((s) => s.userInfo);
  const logout = useAuthStore((s) => s.logout);
  const role = userInfo?.role;

  const menuItems = [
    {
      key: '/links',
      icon: <LinkOutlined />,
      label: '短链管理',
    },
  ];
  if (role === 'admin') {
    menuItems.push({
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
    });
  }

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  // 根据当前路径确定选中的菜单项
  const selectedKey = location.pathname.startsWith('/users') ? '/users' : '/links';

  return (
    <Layout className="admin-layout">
      <Sider
        className="admin-sider"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        collapsedWidth={64}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">SL</span>
          {!collapsed && <span className="sidebar-logo-text">短链服务</span>}
        </div>

        {/* 导航菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />

        {/* 底部用户区 */}
        <div className="sidebar-footer">
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {userInfo?.username?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>
                  {userInfo?.username}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  {role === 'admin' ? '管理员' : '用户'}
                </div>
              </div>
            </div>
          )}
        </div>
      </Sider>

      <Layout>
        {/* 顶栏 */}
        <Header className="admin-header">
          <div className="admin-header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 36, height: 36 }}
            />
            <span className="admin-header-title">
              {selectedKey === '/users' ? '用户管理' : '短链管理'}
            </span>
          </div>
          <div className="admin-header-right">
            <div className="admin-header-user">
              <span>{userInfo?.username}</span>
              <span className="role-badge">{role === 'admin' ? '管理员' : '用户'}</span>
            </div>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ color: '#64748B' }}
            >
              退出
            </Button>
          </div>
        </Header>

        {/* 内容区 */}
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
