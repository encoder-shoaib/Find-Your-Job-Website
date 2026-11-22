import React from 'react';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  Clock, 
  ExternalLink, 
  Bookmark, 
  Sparkles, 
  CheckCircle2, 
  Award,
  Layers
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { PriorityBadge, ScoreBadge } from '../components/ui/Badge';
import { updateJobStatus } from '../api';

export function JobDetailsModal({ job, isOpen, onClose, onStatusUpdated }) {
  if (!job) return null;

  const handleStatusChange = async (newStatus) => {
    const id = job._id || job.job_id;
    try {
      await updateJobStatus(id, { status: newStatus });
      if (onStatusUpdated) onStatusUpdated(id, newStatus);
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const isSaved = job.status === 'Saved';
  const titleText = job.title || job.job_title || 'Untitled Tech Position';
  const companyText = job.company || job.company_name || 'Confidential Employer';
  const categoryText = job.category || job.job_category || 'Information Technology';
  const applyUrl = job.url || job.original_url || job.apply_link;

  // Ensure skills array
  let skillsList = [];
  if (Array.isArray(job.skills)) {
    skillsList = job.skills;
  } else if (typeof job.skills === 'string') {
    skillsList = job.skills.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (typeof job.required_skills === 'string') {
    skillsList = job.required_skills.split(',').map((s) => s.trim()).filter(Boolean);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Job Details" maxWidth="max-w-4xl">
      <div className="space-y-6 text-slate-800">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {titleText}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                {companyText}
              </span>
              <span className="flex items-center gap-1 font-normal">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {job.location || 'Dhaka, Bangladesh'}
              </span>
              <span className="flex items-center gap-1 font-normal">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                {categoryText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <PriorityBadge priority={job.priority} />
            <ScoreBadge score={job.match_score} />
          </div>
        </div>

        {/* AI Recommendation Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>AI Match Evaluation & Strategic Insights</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed italic">
            "{job.match_reason || 'Strong correlation with preferred candidate skills and tech requirements.'}"
          </p>
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
            <span>Calculated Fit: <strong className="text-slate-900 font-bold">{job.match_score || 7}/10</strong></span>
            <span>Recommended Priority: <strong className="text-slate-900 font-bold">{job.priority || 'Medium'}</strong></span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Salary</div>
            <div className="text-xs font-bold text-slate-900 mt-1 truncate">
              {job.salary || 'Negotiable'}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Experience</div>
            <div className="text-xs font-bold text-slate-900 mt-1 truncate">
              {job.experience || 'Not specified'}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Posted Date</div>
            <div className="text-xs font-bold text-slate-900 mt-1 truncate">
              {job.posted_date || 'Recent'}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Deadline</div>
            <div className="text-xs font-bold text-slate-900 mt-1 truncate">
              {job.deadline || job.application_deadline || 'Available'}
            </div>
          </div>
        </div>

        {/* Required Skills */}
        {skillsList.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-slate-500" />
              <span>Required & Relevant Tech Skills</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skillsList.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-700 font-medium hover:border-slate-300 transition"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Full Job Description */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-slate-500" />
            <span>Job Description & Responsibilities</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-700 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-line font-sans">
            {job.description || job.job_description || 'Full description not scraped or details provided on Bdjobs application page.'}
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Changer */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Status:</span>
            <select
              value={job.status || 'New'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:border-slate-400 cursor-pointer"
            >
              <option value="New">New</option>
              <option value="Saved">Saved</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Applied">Applied</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleStatusChange(isSaved ? 'New' : 'Saved')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold transition shadow-2xs cursor-pointer ${
                isSaved
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-amber-500 text-amber-600' : 'text-slate-400'}`} />
              <span>{isSaved ? 'Saved' : 'Bookmark'}</span>
            </button>

            {applyUrl ? (
              <a
                href={applyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm hover:shadow-indigo-500/25 transition cursor-pointer"
              >
                <span>Apply on Bdjobs</span>
                <ExternalLink className="h-3.5 w-3.5 text-white/90" />
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic">No apply URL available</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
