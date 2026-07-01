import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userInfo = useAuthStore((s) => s.userInfo);
  const navigate = useNavigate();

  if (userInfo?.role !== 'admin') {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面"
        extra={
          <Button type="primary" onClick={() => navigate('/links')}>
            返回首页
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
