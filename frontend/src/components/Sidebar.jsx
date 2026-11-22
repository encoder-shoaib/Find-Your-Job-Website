import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Activity, 
  Settings, 
  Users
} from 'lucide-react';
import { UserRoleCard } from './UserRoleCard';

export function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  stats, 
  currentUser, 
  onOpenAuthModal 
}) {
  const adminNavItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'manage-jobs',
      label: 'Jobs',
      icon: Briefcase,
      badge: stats?.totalJobs ?? null,
    },
    {
      id: 'manage-users',
      label: 'Users',
      icon: Users,
      badge: null,
    },
    {
      id: 'activity',
      label: 'Agent & Logs',
      icon: Activity,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-200 bg-white p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navigation Category */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Admin Panel
          </div>

          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-indigo-700 text-white font-bold' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Admin User Card at Bottom */}
      <div className="pt-4 border-t border-slate-100">
        <UserRoleCard adminUser={currentUser} onOpenCredentials={onOpenAuthModal} />
      </div>
    </aside>
  );
}
