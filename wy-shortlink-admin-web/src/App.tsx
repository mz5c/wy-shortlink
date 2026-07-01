import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import AuthGuard from './components/AuthGuard';
import AdminGuard from './components/AdminGuard';
import AdminLayout from './pages/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import LinkListPage from './pages/links/LinkListPage';
import LinkStatsPage from './pages/links/LinkStatsPage';
import UserListPage from './pages/users/UserListPage';

const App: React.FC = () => {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AuthGuard><AdminLayout /></AuthGuard>}>
        <Route index element={<Navigate to="/links" replace />} />
        <Route path="links" element={<LinkListPage />} />
        <Route path="links/:code/stats" element={<LinkStatsPage />} />
        <Route path="users" element={<AdminGuard><UserListPage /></AdminGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/links" replace />} />
    </Routes>
  );
};

export default App;
