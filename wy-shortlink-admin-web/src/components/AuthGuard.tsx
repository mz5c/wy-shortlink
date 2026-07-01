import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const userInfo = useAuthStore((s) => s.userInfo);
  const location = useLocation();

  // 同时检查 Zustand 状态和 localStorage，任一有 token 即认为已登录
  const hasToken = !!(localStorage.getItem('accessToken') && localStorage.getItem('userInfo'));

  if (!isLoggedIn && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果 localStorage 有但 Zustand 没有，同步状态（处理页面刷新后 Zustand 状态丢失）
  if (!isLoggedIn && hasToken) {
    const store = useAuthStore.getState();
    store.initialize();
  }

  return <>{children}</>;
};

export default AuthGuard;
