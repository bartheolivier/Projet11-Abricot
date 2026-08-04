import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: null,
  setUser: (userData) => set({ user: userData }),
  clearUser: () => set({ user: null }),

  // Fonction utilitaire pour extraire le token des cookies
  getToken: () => {
    if (typeof document === 'undefined') return null;
    return (
      document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1] || null
    );
  },
}));
