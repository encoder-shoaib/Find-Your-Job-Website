import React, { useState, useEffect } from 'react';
import { Save, X, Edit3, Sparkles, Building2, MapPin, DollarSign, Briefcase } from 'lucide-react';
import { Modal } from './ui/Modal';
import { updateJob } from '../api';

export function EditJobModal({ job, isOpen, onClose, onJobUpdated }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    category: '',
    location: '',
    salary: '',
    experience: '',
    match_score: 7,
    priority: 'Medium',
    status: 'New',
    match_reason: '',
    skills: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (job) {
      let skillsStr = '';
      if (Array.isArray(job.skills)) skillsStr = job.skills.join(', ');
      else if (typeof job.skills === 'string') skillsStr = job.skills;
      else if (typeof job.required_skills === 'string') skillsStr = job.required_skills;

      setFormData({
        title: job.title || job.job_title || '',
        company: job.company || job.company_name || '',
        category: job.category || job.job_category || 'Software Development',
        location: job.location || 'Dhaka',
        salary: job.salary || 'Negotiable',
        experience: job.experience || job.experience_level || '',
        match_score: job.match_score ?? 7,
        priority: job.priority || 'Medium',
        status: job.status || 'New',
        match_reason: job.match_reason || '',
        skills: skillsStr,
        description: job.description || job.job_description || '',
      });
      setError('');
    }
  }, [job]);

  if (!job) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const id = job._id || job.job_id;
      const res = await updateJob(id, formData);
      if (res && res.success) {
        if (onJobUpdated) onJobUpdated(res.job);
        onClose();
      } else {
        setError(res?.error || 'Failed to update job');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error updating job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admin: Edit Opportunity Details" maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Job Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="Software Development">Software Development</option>
              <option value="AI & Data">AI & Data</option>
              <option value="IT & Networking">IT & Networking</option>
              <option value="Other Technology Jobs">Other Technology Jobs</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Salary Range</label>
            <input
              type="text"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Experience Required</label>
            <input
              type="text"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">AI Match Score (0 - 10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.match_score}
              onChange={(e) => setFormData({ ...formData, match_score: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Required Skills (Comma separated)</label>
          <input
            type="text"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            placeholder="Python, Django, React, AI, SQL"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">AI Fit Evaluation & Reason</label>
          <input
            type="text"
            value={formData.match_reason}
            onChange={(e) => setFormData({ ...formData, match_reason: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white italic"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Job Description</label>
          <textarea
            rows="4"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed font-sans"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Job Changes'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
