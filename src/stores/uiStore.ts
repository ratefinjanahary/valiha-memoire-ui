import { create } from 'zustand';

interface UiState {
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (isOpen: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true, // Desktop : étendue / mini
  isMobileSidebarOpen: false, // Mobile : fermée par défaut
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleMobileSidebar: () => set((s) => ({ isMobileSidebarOpen: !s.isMobileSidebarOpen })),
  setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
}));