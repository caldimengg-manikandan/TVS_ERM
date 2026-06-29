import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';

const AppLayout: React.FC = () => {
  const sidebarCollapsed = useSelector((state: RootState) => state.ui.sidebarCollapsed);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AppHeader />
      <AppSidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
