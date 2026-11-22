import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Copy, 
  Check, 
  Building2, 
  Lock, 
  User, 
  Mail, 
  Eye, 
  EyeOff,
  Sparkles 
} from 'lucide-react';
import { Modal } from './ui/Modal';

export function AdminLoginModal({ isOpen, onClose }) {
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);

  const adminCredentials = {
    email: 'admin@yourfiendjob.com',
    username: 'admin',
    password: 'Admin@2026#Jobs',
    role: 'Super Admin',
    organization: 'uFirst-LTD',
    built_for: 'uFirst-LTD Enterprise Solution',
    permissions: [
      'Scrape & Crawl Bdjobs Portals',
      'Execute OpenAI Agent Decision Engine',
      'Manage MongoDB Database Collections',
      'Export Formatted Excel Reports',
      'Configure Skills & Global Settings',
      'Send Automated Daily Job Briefing Emails'
    ]
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(adminCredentials.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admin Authentication & Role Credentials" maxWidth="max-w-xl">
      <div className="space-y-5 text-slate-800">
        {/* Banner */}
        <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/60">
          <div className="p-2.5 rounded-lg bg-blue-600 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Admin Account Verified</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                ROLE: SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Built exclusively for <strong className="text-blue-700">uFirst-LTD</strong> by Antigravity AI Assistant.
            </p>
          </div>
        </div>

        {/* Credentials Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="h-4 w-4 text-blue-600" />
            <span>Master Admin Access Credentials</span>
          </div>

          <div className="space-y-2.5">
            {/* Username/Email */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-xs">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Admin Email:</span>
                <span className="font-mono font-semibold text-slate-900">{adminCredentials.email}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                User: admin
              </span>
            </div>

            {/* Password with Reveal & Copy */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-xs">
                <Lock className="h-4 w-4 text-blue-600" />
                <span className="text-slate-500">Password:</span>
                <span className="font-mono font-bold text-blue-700 text-sm">
                  {showPass ? adminCredentials.password : '••••••••••••••••'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                  title={showPass ? 'Hide Password' : 'Show Password'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-semibold text-blue-700 transition"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Built For & Role Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
            <span className="text-slate-500">Target Organization:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-blue-600" />
              uFirst-LTD
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-700">Admin Permissions Granted:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            {adminCredentials.permissions.map((perm, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                <span>{perm}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
