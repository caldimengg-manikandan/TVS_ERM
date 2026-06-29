import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Users, Calendar, ClipboardList,
  BarChart3, Settings, Shield, Building2, ChevronLeft, ChevronRight,
  Layers, Clock, UserCheck, TrendingUp, FileText
} from 'lucide-react';
import { RootState } from '../../store';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { UserRole } from '@tvs/shared';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles?: UserRole[];
  badge?: string;
}

const NAV_ITEMS: (NavItem | { section: string })[] = [
  { section: 'Overview' },
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  
  { section: 'Work Management' },
  { label: 'Projects', icon: FolderKanban, href: '/projects' },
  { label: 'Tasks', icon: ClipboardList, href: '/tasks' },
  
  { section: 'Resource Management' },
  { label: 'Employees', icon: Users, href: '/employees' },
  { label: 'Resource Allocation', icon: Layers, href: '/resources' },
  { label: 'Capacity Planning', icon: TrendingUp, href: '/capacity' },
  
  { section: 'Time & Attendance' },
  { label: 'Timesheets', icon: Clock, href: '/timesheets' },
  { label: 'TL Approvals', icon: UserCheck, href: '/timesheets/approvals', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEAM_LEAD, UserRole.PROJECT_MANAGER] },
  { label: 'Attendance', icon: Calendar, href: '/attendance' },
  
  { section: 'Analytics' },
  { label: 'Reports', icon: BarChart3, href: '/reports' },
  
  { section: 'Administration', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] } as NavItem & { section: string },
  { label: 'Departments', icon: Building2, href: '/departments', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  { label: 'Audit Logs', icon: Shield, href: '/audit-logs', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

const AppSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);
  const userRole = user?.role as UserRole;

  const canAccess = (roles?: UserRole[]) => !roles || roles.includes(userRole);

  return (
    <aside className="app-sidebar relative">
      {/* Logo Area */}
      <div className="flex items-center h-14 px-4 border-b border-white/10 flex-shrink-0">
        <motion.div 
          className="flex items-center gap-3 overflow-hidden"
          animate={{ opacity: 1 }}
        >
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <div className="text-white font-bold text-sm leading-none">TVS ERM</div>
                <div className="text-slate-400 text-2xs">Enterprise Resource Mgmt</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Collapse Toggle */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="ml-auto w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 
                     flex items-center justify-center text-slate-300 hover:text-white 
                     transition-all duration-150 flex-shrink-0"
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 no-scrollbar">
        {NAV_ITEMS.map((item, idx) => {
          // Section header
          if ('section' in item && !('href' in item)) {
            if (!canAccess((item as { roles?: UserRole[] }).roles)) return null;
            if (sidebarCollapsed) return <div key={idx} className="my-2 border-t border-white/10" />;
            return (
              <div key={idx} className="px-2 pt-4 pb-1 first:pt-1">
                <span className="text-2xs font-semibold uppercase tracking-widest text-slate-500">
                  {item.section}
                </span>
              </div>
            );
          }

          const navItem = item as NavItem;
          if (!canAccess(navItem.roles)) return null;

          return (
            <NavLink
              key={navItem.href}
              to={navItem.href}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`
              }
              title={sidebarCollapsed ? navItem.label : undefined}
            >
              <navItem.icon className="sidebar-item-icon" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {navItem.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* User Summary at Bottom */}
      {!sidebarCollapsed && user && (
        <div className="border-t border-white/10 p-3 flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center flex-shrink-0">
            <span className="text-accent text-xs font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
          <div className="overflow-hidden">
            <div className="text-white text-xs font-medium truncate">{user.fullName}</div>
            <div className="text-slate-400 text-2xs truncate">{user.role.replace('_', ' ')}</div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
