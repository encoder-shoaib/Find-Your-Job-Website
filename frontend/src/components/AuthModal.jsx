import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  Key, 
  Lock, 
  Mail, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { loginUser, registerUser } from '../api';

export function AuthModal({ isOpen, onClose, currentUser, onAuthSuccess, onLogout }) {
  const [mode, setMode] = useState('demo'); // 'demo' | 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const demoAccounts = {
    admin: {
      email: 'admin@yourfiendjob.com',
      password: 'Admin@2026#Jobs',
      role: 'Super Admin',
      label: 'Administrator (uFirst-LTD)',
      badge: 'Full Access (Admin Dashboard, CRUD Jobs, Users, Agent)',
    },
    user: {
      email: 'candidate@ufirst.com',
      password: 'User@2026#Jobs',
      role: 'Candidate User',
      label: 'Job Seeker (Candidate)',
      badge: 'Public Candidate View (Job Cards, Search, Filters, Bookmark, Apply)',
    },
  };

  const handleQuickLogin = async (accEmail, accPass) => {
    try {
      setLoading(true);
      setError('');
      const res = await loginUser(accEmail, accPass);
      if (res && res.success) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setError(res?.error || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    handleQuickLogin(email, password);
  };

  const handleManualRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await registerUser({ name, email, password });
      if (res && res.success) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setError(res?.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Authentication & Role Switcher" maxWidth="max-w-xl">
      <div className="space-y-5 text-slate-800">
        {/* Current Active Session Bar */}
        {currentUser && (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/70">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[11px] text-blue-700 font-semibold uppercase">
                  Logged in as: {currentUser.role}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-xs font-bold text-rose-600 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
          <button
            onClick={() => setMode('demo')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              mode === 'demo' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1-Click Role Switcher
          </button>
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              mode === 'login' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Sign In
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              mode === 'register' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        {/* Mode 1: 1-Click Role Switcher & Preconfigured Demo Cards */}
        {mode === 'demo' && (
          <div className="space-y-3.5">
            <p className="text-xs text-slate-500">
              Select any role below to switch instantly and experience the distinct role-based dashboard:
            </p>

            {/* Role 1: Super Admin */}
            <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-white p-4 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-600 text-white shadow-2xs">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">Administrator Role</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                        SUPER ADMIN
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono">
                      admin@yourfiendjob.com
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy('Admin@2026#Jobs', 'adminPass')}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                >
                  {copiedKey === 'adminPass' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === 'adminPass' ? 'Copied' : 'Copy Pass'}</span>
                </button>
              </div>

              <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                Full administrative dashboard: CRUD management on all jobs, trigger AI agent hunts, streaming logs, users, and config.yaml settings.
              </div>

              <button
                onClick={() => handleQuickLogin(demoAccounts.admin.email, demoAccounts.admin.password)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In as Super Admin'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Role 2: Candidate User */}
            <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-700 text-white shadow-2xs">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">Candidate Role</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                        USER (JOB SEEKER)
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono">
                      candidate@ufirst.com
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy('User@2026#Jobs', 'userPass')}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:underline"
                >
                  {copiedKey === 'userPass' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === 'userPass' ? 'Copied' : 'Copy Pass'}</span>
                </button>
              </div>

              <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                Candidate job search portal: explore attractive AI job cards, filter by category/skills/salary, view match breakdown, bookmark jobs, and apply directly.
              </div>

              <button
                onClick={() => handleQuickLogin(demoAccounts.user.email, demoAccounts.user.password)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In as Candidate User'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Mode 2: Manual Login */}
        {mode === 'login' && (
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Email or Username</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourfiendjob.com"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Mode 3: Manual Register */}
        {mode === 'register' && (
          <form onSubmit={handleManualRegister} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register as Candidate'}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
