import { create } from 'zustand';

interface UserInfo {
  username: string;
  role: string;
}

interface AuthState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  login: (userInfo: UserInfo) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  userInfo: null,
  login: (userInfo) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    set({ isLoggedIn: true, userInfo });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    set({ isLoggedIn: false, userInfo: null });
  },
  initialize: () => {
    const token = localStorage.getItem('accessToken');
    const ui = localStorage.getItem('userInfo');
    if (token && ui) {
      try {
        set({ isLoggedIn: true, userInfo: JSON.parse(ui) });
      } catch {
        set({ isLoggedIn: false, userInfo: null });
      }
    }
  },
}));
