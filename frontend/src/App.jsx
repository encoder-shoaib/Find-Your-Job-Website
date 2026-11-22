import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { UserDashboard } from './pages/UserDashboard';
import { AdminJobManagement } from './pages/AdminJobManagement';
import { AdminUserManagement } from './pages/AdminUserManagement';
import { AgentActivity } from './pages/AgentActivity';
import { Settings } from './pages/Settings';
import { JobDetailsModal } from './pages/JobDetailsModal';
import { AuthModal } from './components/AuthModal';
import {
  fetchDashboardStats,
  fetchAgentStatus,
  fetchCurrentUser,
  logoutUser,
  loginUser
} from './api';
import {
  LayoutDashboard,
  Briefcase,
  Activity,
  Users,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  // Role State: 'admin' | 'user'
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('yourfiendjob_role') || 'user';
  });

  // Active Tab
  const [currentTab, setCurrentTab] = useState(() => {
    const role = localStorage.getItem('yourfiendjob_role') || 'user';
    return role === 'admin' ? 'dashboard' : 'user-explore';
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const loadInitialData = async () => {
    try {
      const [statsRes, agentRes] = await Promise.all([
        fetchDashboardStats(),
        fetchAgentStatus(),
      ]);
      if (statsRes?.success) {
        // Anti-Flicker Protection: If API briefly returns 0 due to cold serverless container, check client cache
        let effectiveTotal = statsRes.stats?.totalJobs ?? 0;
        let effectiveRecent = statsRes.recentJobs || statsRes.stats?.recentJobs || [];

        if (effectiveTotal === 0) {
          try {
            const cachedRaw = localStorage.getItem('yourfiendjob_cached_jobs');
            if (cachedRaw) {
              const cachedList = JSON.parse(cachedRaw);
              if (cachedList && cachedList.length > 0) {
                effectiveTotal = cachedList.length;
                effectiveRecent = cachedList.slice(0, 6);
              }
            }
          } catch (e) {}
        }

        setStats({
          ...statsRes.stats,
          totalJobs: effectiveTotal,
          recentJobs: effectiveRecent,
          categoryDistribution: statsRes.stats?.categoryDistribution || {},
          priorityDistribution: statsRes.stats?.priorityDistribution || {},
        });
      }
      if (agentRes?.success) setAgentStatus(agentRes);

      // Fetch session from token
      try {
        const authRes = await fetchCurrentUser();
        if (authRes?.success) {
          setCurrentUser(authRes.user);
          setCurrentRole(authRes.user.role === 'admin' ? 'admin' : 'user');
        }
      } catch (e) {
        // Auto login default demo account
        const defaultEmail = currentRole === 'admin' ? 'admin@yourfiendjob.com' : 'candidate@ufirst.com';
        const defaultPass = currentRole === 'admin' ? 'Admin@2026#Jobs' : 'User@2026#Jobs';
        const autoLogin = await loginUser(defaultEmail, defaultPass).catch(() => null);
        if (autoLogin?.success) {
          setCurrentUser(autoLogin.user);
        }
      }
    } catch (err) {
      console.error('Failed to load platform data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
    // Auto-sync dashboard metrics and agent status with MongoDB every 15 seconds
    const interval = setInterval(async () => {
      try {
        const [statsRes, agentRes] = await Promise.all([
          fetchDashboardStats(),
          fetchAgentStatus(),
        ]);
        if (statsRes?.success) {
          let effectiveTotal = statsRes.stats?.totalJobs ?? 0;
          let effectiveRecent = statsRes.recentJobs || statsRes.stats?.recentJobs || [];

          if (effectiveTotal === 0) {
            try {
              const cachedRaw = localStorage.getItem('yourfiendjob_cached_jobs');
              if (cachedRaw) {
                const cachedList = JSON.parse(cachedRaw);
                if (cachedList && cachedList.length > 0) {
                  effectiveTotal = cachedList.length;
                  effectiveRecent = cachedList.slice(0, 6);
                }
              }
            } catch (e) {}
          }

          setStats({
            ...statsRes.stats,
            totalJobs: effectiveTotal,
            recentJobs: effectiveRecent,
            categoryDistribution: statsRes.stats?.categoryDistribution || {},
            priorityDistribution: statsRes.stats?.priorityDistribution || {},
          });
        }
        if (agentRes?.success) setAgentStatus(agentRes);
      } catch (e) { }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAgentRunComplete = async (res) => {
    // Instantly refresh all platform data
    await loadInitialData();
  };

  const handleToggleRoleView = async () => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setCurrentRole(newRole);
    localStorage.setItem('yourfiendjob_role', newRole);
    setCurrentTab(newRole === 'admin' ? 'dashboard' : 'user-explore');

    // Sign in matching demo account
    const accEmail = newRole === 'admin' ? 'admin@yourfiendjob.com' : 'candidate@ufirst.com';
    const accPass = newRole === 'admin' ? 'Admin@2026#Jobs' : 'User@2026#Jobs';
    try {
      const res = await loginUser(accEmail, accPass);
      if (res?.success) setCurrentUser(res.user);
    } catch (e) { }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    const roleNormalized = user.role === 'admin' ? 'admin' : 'user';
    setCurrentRole(roleNormalized);
    localStorage.setItem('yourfiendjob_role', roleNormalized);
    setCurrentTab(roleNormalized === 'admin' ? 'dashboard' : 'user-explore');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentRole('user');
    localStorage.setItem('yourfiendjob_role', 'user');
    setCurrentTab('user-explore');
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleStatusUpdated = (jobId, newStatus) => {
    if (selectedJob && (selectedJob._id === jobId || selectedJob.job_id === jobId)) {
      setSelectedJob({ ...selectedJob, status: newStatus });
    }
    loadInitialData();
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        currentRole={currentRole}
        onToggleRoleView={handleToggleRoleView}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      {currentRole === 'admin' ? (
        /* ================= ADMIN VIEW ================= */
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar
            currentRole={currentRole}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            stats={stats}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onToggleRoleView={handleToggleRoleView}
          />

          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {currentTab === 'dashboard' && (
              <Dashboard
                stats={stats}
                onNavigateJobs={() => setCurrentTab('manage-jobs')}
                onSelectJob={handleSelectJob}
                onOpenAdminModal={() => setIsAuthModalOpen(true)}
                onAgentComplete={handleAgentRunComplete}
              />
            )}

            {currentTab === 'manage-jobs' && (
              <AdminJobManagement onSelectJob={handleSelectJob} />
            )}

            {currentTab === 'manage-users' && (
              <AdminUserManagement />
            )}

            {currentTab === 'activity' && (
              <AgentActivity
                onOpenAdminModal={() => setIsAuthModalOpen(true)}
                onAgentRunComplete={handleAgentRunComplete}
              />
            )}

            {currentTab === 'settings' && (
              <Settings onOpenAdminModal={() => setIsAuthModalOpen(true)} />
            )}
          </main>
        </div>
      ) : (
        /* ================= CANDIDATE VIEW: 2 CARDS IN A ROW, EXPANSIVE & FULL WHITE ================= */
        <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <UserDashboard onSelectJob={handleSelectJob} user={currentUser} />
        </main>
      )}

      {/* Mobile Bottom Navigation for Admin */}
      {currentRole === 'admin' && (
        <div className="lg:hidden sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md px-3 py-2 flex items-center justify-around">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 text-[10px] font-bold transition ${currentTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500'
              }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setCurrentTab('manage-jobs')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 text-[10px] font-bold transition ${currentTab === 'manage-jobs' ? 'text-blue-600' : 'text-slate-500'
              }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Jobs</span>
          </button>
          <button
            onClick={() => setCurrentTab('manage-users')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 text-[10px] font-bold transition ${currentTab === 'manage-users' ? 'text-blue-600' : 'text-slate-500'
              }`}
          >
            <Users className="h-4 w-4" />
            <span>Users</span>
          </button>
          <button
            onClick={() => setCurrentTab('activity')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 text-[10px] font-bold transition ${currentTab === 'activity' ? 'text-blue-600' : 'text-slate-500'
              }`}
          >
            <Activity className="h-4 w-4" />
            <span>Agent</span>
          </button>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-2.5 text-[10px] font-bold text-blue-700"
          >
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Auth</span>
          </button>
        </div>
      )}

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusUpdated={handleStatusUpdated}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />
    </div>
  );
}
