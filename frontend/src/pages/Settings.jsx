import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Sparkles, 
  Mail, 
  MapPin, 
  Briefcase, 
  Tag, 
  X, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { fetchSettings, updateSettings } from '../api';

export function Settings({ onOpenAdminModal }) {
  const [settings, setSettings] = useState({
    skills: [],
    categories: [],
    locations: ['Dhaka', 'Remote'],
    experience_level: 'Any',
    email: {
      enabled: true,
      receiver_email: '',
      frequency: 'Daily morning',
    },
    max_jobs: 30,
  });

  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchSettings();
      if (res && res.success && res.settings) {
        const s = res.settings;
        setSettings({
          skills: s.preferred_skills || ['Python', 'Django', 'FastAPI', 'React', 'AI', 'MongoDB', 'Docker'],
          categories: s.categories || ['Software Development', 'AI & Data', 'IT & Networking'],
          locations: s.locations || ['Dhaka', 'Remote'],
          experience_level: s.experience_level || 'Any',
          email: {
            enabled: s.email?.enabled ?? true,
            receiver_email: s.email?.receiver_email || s.email?.to || '',
            frequency: s.email?.frequency || 'Daily morning',
          },
          max_jobs: s.max_jobs_per_run || 30,
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (e) => {
    e?.preventDefault();
    const val = newSkill.trim();
    if (val && !settings.skills.includes(val)) {
      setSettings((prev) => ({
        ...prev,
        skills: [...prev.skills, val],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSettings((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleToggleCategory = (cat) => {
    setSettings((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists ? prev.categories.filter((c) => c !== cat) : [...prev.categories, cat],
      };
    });
  };

  const handleToggleLocation = (loc) => {
    setSettings((prev) => {
      const exists = prev.locations.includes(loc);
      return {
        ...prev,
        locations: exists ? prev.locations.filter((l) => l !== loc) : [...prev.locations, loc],
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        preferred_skills: settings.skills,
        categories: settings.categories,
        locations: settings.locations,
        experience_level: settings.experience_level,
        email: settings.email,
        max_jobs_per_run: settings.max_jobs,
      };

      const res = await updateSettings(payload);
      if (res && res.success) {
        setToast({ show: true, message: 'Settings saved and synced with config.yaml & MongoDB!', type: 'success' });
      } else {
        setToast({ show: true, message: 'Failed to update settings', type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: err.message || 'Error saving settings', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    }
  };

  const allAvailableCategories = [
    'Software Development',
    'AI & Data',
    'IT & Networking',
    'Other Technology Jobs',
  ];

  const allAvailableLocations = ['Dhaka', 'Chittagong', 'Sylhet', 'Remote', 'Anywhere in Bangladesh'];

  return (
    <div className="space-y-7 animate-fade-in pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure search criteria and notifications.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
        >
          {saving ? (
            <Sparkles className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? 'Saving Preferences...' : 'Save Changes'}</span>
        </button>
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
            <AlertCircle className="h-4 w-4 text-rose-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Form Sections */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Preferred Skills Tag Editor */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Target Skills & Tech Stacks</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Used for AI Fit Score (0-10)</span>
          </div>
          <p className="text-xs text-slate-500">
            The AI Agent calculates Match Score by checking if job descriptions include these technologies.
          </p>

          {/* Active Skills Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {settings.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-800 font-semibold group hover:border-blue-300 transition"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="rounded-full p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add Skill Input */}
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Add skill (e.g., Next.js, PyTorch, GraphQL)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 transition"
            >
              <Plus className="h-3.5 w-3.5 text-blue-600" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Job Categories */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">Tech Job Categories</h2>
          </div>
          <p className="text-xs text-slate-500">
            Select which departments and domains on Bdjobs the agent should crawl.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {allAvailableCategories.map((cat) => {
              const checked = settings.categories.includes(cat);
              return (
                <label
                  key={cat}
                  onClick={() => handleToggleCategory(cat)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    checked
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs">{cat}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Locations & Experience Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Location Preferences */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Preferred Locations</h2>
            </div>
            <div className="space-y-2">
              {allAvailableLocations.map((loc) => {
                const checked = settings.locations.includes(loc);
                return (
                  <label
                    key={loc}
                    onClick={() => handleToggleLocation(loc)}
                    className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0"
                    />
                    <span>{loc}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Experience Level & Crawl Limit */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-amber-600" />
                <span>Experience Level Target</span>
              </label>
              <select
                value={settings.experience_level}
                onChange={(e) => setSettings({ ...settings, experience_level: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Any">Any Experience</option>
                <option value="Entry">Entry-Level / Junior (0-2 years)</option>
                <option value="Mid">Mid-Level (2-5 years)</option>
                <option value="Senior">Senior (5+ years)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Maximum Jobs Per Crawl Run
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={settings.max_jobs}
                onChange={(e) => setSettings({ ...settings, max_jobs: parseInt(e.target.value, 10) || 30 })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 30 jobs</span>
            </div>
          </div>
        </div>

        {/* Email Notification Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Daily Gmail Notifications</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.email.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, enabled: e.target.checked },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Receive automated daily job briefings with top matching jobs directly in your Gmail inbox.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Recipient Email Address
              </label>
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={settings.email.receiver_email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, receiver_email: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Dispatch Frequency
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Every morning (08:00 AM BD Time)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
          >
            {saving ? (
              <Sparkles className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save All Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
