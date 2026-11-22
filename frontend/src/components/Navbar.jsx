import React from 'react';
import { 
  Bot, 
  ShieldCheck, 
  User, 
  ArrowRightLeft
} from 'lucide-react';

export function Navbar({ 
  currentUser, 
  currentRole, 
  onToggleRoleView, 
  onOpenAuthModal 
}) {
  const isAdmin = currentRole === 'admin';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 shadow-2xs">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-xs ${isAdmin ? 'bg-indigo-700' : 'bg-indigo-600'}`}>
          <Bot className="h-5 w-5" />
        </div>
        <span className="font-extrabold tracking-tight text-slate-900 text-lg">YourFindJob</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Toggle Admin / Candidate View */}
        <button
          onClick={onToggleRoleView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition cursor-pointer shadow-2xs"
        >
          <ArrowRightLeft className="h-3.5 w-3.5 text-slate-500" />
          <span>{isAdmin ? 'Candidate View' : 'Admin Mode'}</span>
        </button>

        {/* User Account / Role Switcher */}
        <button
          onClick={onOpenAuthModal}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 transition cursor-pointer shadow-2xs"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full text-white text-[11px] font-bold bg-indigo-600">
            {isAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
          </div>
          <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
            {currentUser?.name || (isAdmin ? 'Admin' : 'Candidate')}
          </span>
        </button>
      </div>
    </header>
  );
}
