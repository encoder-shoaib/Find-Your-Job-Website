import React from 'react';
import { ShieldCheck, Key } from 'lucide-react';

export function UserRoleCard({ adminUser, onOpenCredentials, className = "" }) {
  const name = adminUser?.name || 'Administrator';
  const email = adminUser?.email || 'admin@yourfindjob.com';

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          A
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-slate-900 truncate">{name}</div>
          <div className="text-[11px] text-slate-500 font-mono truncate">{email}</div>
        </div>
      </div>

      <button
        onClick={onOpenCredentials}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
      >
        <Key className="h-3.5 w-3.5 text-slate-400" />
        <span>Admin Credentials</span>
      </button>
    </div>
  );
}
