import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const location = useLocation();

  const hasToken = !!(localStorage.getItem('accessToken') && localStorage.getItem('userInfo'));

  // localStorage 有但 Zustand 没有 → 页面刷新后恢复状态
  useEffect(() => {
    if (!isLoggedIn && hasToken) {
      useAuthStore.getState().initialize();
    }
  }, [isLoggedIn, hasToken]);

  if (!isLoggedIn && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
