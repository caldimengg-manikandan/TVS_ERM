import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Settings, User, Shield, Key, Bell, Building2 } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="page-wrapper">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-primary">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-primary">Profile Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'First Name', value: user?.firstName },
                { label: 'Last Name', value: user?.lastName },
                { label: 'Email Address', value: user?.email },
                { label: 'Role', value: user?.role?.replace('_', ' ') },
              ].map(field => (
                <div key={field.label} className="form-group">
                  <label className="form-label">{field.label}</label>
                  <input type="text" defaultValue={field.value || ''} className="form-input" readOnly />
                </div>
              ))}
            </div>
            <button className="mt-4 px-4 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent/90 transition-colors">
              Update Profile
            </button>
          </div>

          <div className="bg-white border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-primary">Change Password</h3>
            </div>
            <div className="space-y-3">
              {['Current Password', 'New Password', 'Confirm New Password'].map(label => (
                <div key={label} className="form-group">
                  <label className="form-label">{label}</label>
                  <input type="password" placeholder="••••••••" className="form-input" />
                </div>
              ))}
            </div>
            <button className="mt-4 px-4 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent/90 transition-colors">
              Change Password
            </button>
          </div>

          <div className="bg-white border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-primary">Notification Preferences</h3>
            </div>
            <div className="space-y-3">
              {[
                'Timesheet approval status',
                'New task assignments',
                'Project deadline reminders',
                'Resource allocation updates',
                'System announcements',
              ].map(pref => (
                <div key={pref} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-primary">{pref}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-muted peer-checked:bg-accent rounded-full transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Account Info */}
        <div className="space-y-5">
          <div className="bg-white border border-border rounded-lg p-5 shadow-card text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-accent text-xl font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            </div>
            <h3 className="font-bold text-primary">{user?.firstName} {user?.lastName}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>

          <div className="bg-white border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-primary">Security</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Status</span>
                <span className="text-success font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">2FA</span>
                <span className="text-muted-foreground">Not enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Login</span>
                <span>Just now</span>
              </div>
            </div>
          </div>

          <div className="bg-warning/5 border border-warning/30 rounded-lg p-4">
            <p className="text-xs text-warning font-medium mb-1">⚠️ Security Note</p>
            <p className="text-xs text-muted-foreground">Regularly update your password and never share your credentials with others.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
