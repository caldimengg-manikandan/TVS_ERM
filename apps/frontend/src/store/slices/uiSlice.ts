import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BreadcrumbItem { label: string; href?: string; }

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  breadcrumbs: BreadcrumbItem[];
  globalSearchOpen: boolean;
  notificationPanelOpen: boolean;
  activeModule: string;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  theme: 'light',
  breadcrumbs: [],
  globalSearchOpen: false,
  notificationPanelOpen: false,
  activeModule: 'dashboard',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => { state.sidebarCollapsed = action.payload; },
    setBreadcrumbs: (state, action: PayloadAction<BreadcrumbItem[]>) => { state.breadcrumbs = action.payload; },
    setGlobalSearchOpen: (state, action: PayloadAction<boolean>) => { state.globalSearchOpen = action.payload; },
    setNotificationPanelOpen: (state, action: PayloadAction<boolean>) => { state.notificationPanelOpen = action.payload; },
    setActiveModule: (state, action: PayloadAction<string>) => { state.activeModule = action.payload; },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setBreadcrumbs, setGlobalSearchOpen, setNotificationPanelOpen, setActiveModule } = uiSlice.actions;
export default uiSlice.reducer;
