import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  User, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Mail, 
  Lock,
  ArrowRightLeft
} from 'lucide-react';
import { fetchUsers, createUser, updateUserRole, deleteUser } from '../api';
import { Modal } from '../components/ui/Modal';

export function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    organization: 'uFirst-LTD',
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetchUsers();
      if (res && res.success) {
        setUsers(res.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await createUser(formData);
      if (res && res.success) {
        setUsers((prev) => [res.user, ...prev]);
        setIsAddModalOpen(false);
        setFormData({ name: '', email: '', password: '', role: 'user', organization: 'uFirst-LTD' });
        showToast('New user account registered successfully.', 'success');
      } else {
        showToast(res?.error || 'Failed to create user', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRole = async (user) => {
    const id = user._id;
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await updateUserRole(id, newRole);
      if (res && res.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === id ? { ...u, role: newRole } : u))
        );
        showToast(`User role changed to ${newRole.toUpperCase()}`, 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.name}" (${user.email})?`)) {
      return;
    }

    try {
      const res = await deleteUser(user._id);
      if (res && res.success) {
        setUsers((prev) => prev.filter((u) => u._id !== user._id));
        showToast('User deleted successfully.', 'success');
      } else {
        showToast(res?.error || 'Failed to delete user', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Users
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user accounts and permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create New User</span>
          </button>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition"
            title="Refresh Users"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast.show && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-bold transition shadow-xs ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Fetching users from MongoDB...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <Users className="h-8 w-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No users found</div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[200px]">User & Identity</th>
                  <th className="py-3 px-4 min-w-[140px]">Organization</th>
                  <th className="py-3 px-3 text-center w-28">Assigned Role</th>
                  <th className="py-3 px-3 text-center w-24">Status</th>
                  <th className="py-3 px-4 min-w-[120px]">Registered On</th>
                  <th className="py-3 px-4 text-right min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {users.map((u) => {
                  const isAdmin = u.role === 'admin' || u.role === 'Super Admin';
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${isAdmin ? 'bg-blue-600' : 'bg-slate-600'}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 ml-9">
                          {u.email}
                        </div>
                      </td>

                      {/* Organization */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>{u.organization || 'uFirst-LTD'}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isAdmin
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          {isAdmin ? 'ADMIN' : 'USER'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {u.status || 'Active'}
                        </span>
                      </td>

                      {/* Registered */}
                      <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                      </td>

                      {/* Actions: Toggle Role & Delete */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleRole(u)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium transition"
                            title="Toggle User/Admin Role"
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                            <span>{isAdmin ? 'Make User' : 'Make Admin'}</span>
                          </button>

                          {u.email !== 'admin@yourfiendjob.com' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600 transition"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Account" maxWidth="max-w-md">
        <form onSubmit={handleCreateUser} className="space-y-4 text-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Assign Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="user">User (Candidate / Job Seeker)</option>
              <option value="admin">Admin (Full Administrative Privileges)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Organization</label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
