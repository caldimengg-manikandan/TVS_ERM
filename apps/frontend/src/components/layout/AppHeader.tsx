import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, User, ChevronDown, Settings } from 'lucide-react';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { setGlobalSearchOpen, setNotificationPanelOpen } from '../../store/slices/uiSlice';
import { authApi } from '../../services/api';
import { toast } from 'sonner';

const AppHeader: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { unreadCount } = useSelector((state: RootState) => state.notifications);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch { /* silent */ }
    dispatch(logout());
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <header className="app-header" style={{ gridColumn: '1 / -1' }}>
      {/* Company branding */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-primary font-bold text-sm">TVS Group</div>
        <span className="text-border">|</span>
        <div className="text-muted-foreground text-xs">Enterprise Resource Management</div>
      </div>

      {/* Global Search */}
      <button
        id="global-search-btn"
        onClick={() => dispatch(setGlobalSearchOpen(true))}
        className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-muted-foreground 
                   hover:bg-muted/80 transition-colors text-sm min-w-[200px] group"
      >
        <Search className="w-4 h-4 group-hover:text-accent transition-colors" />
        <span>Search anything...</span>
        <kbd className="ml-auto bg-white border border-border rounded text-2xs px-1.5 py-0.5 hidden sm:block">
          ⌘K
        </kbd>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          id="notifications-btn"
          onClick={() => dispatch(setNotificationPanelOpen(true))}
          className="relative w-9 h-9 flex items-center justify-center rounded-md 
                     hover:bg-muted text-muted-foreground hover:text-primary transition-all"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white 
                             text-2xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            id="user-menu-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted 
                       transition-all text-sm"
          >
            <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/30 
                           flex items-center justify-center">
              <span className="text-accent text-xs font-bold">
                {user?.firstName[0]}{user?.lastName[0]}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-primary leading-none">{user?.fullName}</div>
              <div className="text-2xs text-muted-foreground">{user?.role?.replace('_', ' ')}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border 
                           rounded-lg shadow-dropdown z-50 py-1">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-xs font-semibold text-primary">{user?.fullName}</div>
                <div className="text-2xs text-muted-foreground">{user?.email}</div>
              </div>
              <button
                onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary 
                           hover:bg-muted transition-colors"
              >
                <User className="w-4 h-4" />
                Profile & Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger 
                           hover:bg-danger/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </header>
  );
};

export default AppHeader;
