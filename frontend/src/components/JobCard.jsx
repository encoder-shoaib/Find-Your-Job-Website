import React from 'react';
import { 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Bookmark, 
  ExternalLink, 
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';

function formatPostedDate(dateStr) {
  if (!dateStr || dateStr === 'Recent') return 'Recent';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch (e) {}
  return dateStr.split('T')[0] || dateStr;
}

export function JobCard({ job, onSelect, onToggleBookmark }) {
  if (!job) return null;

  const isSaved = job.status === 'Saved' || job.is_saved === true;
  const title = job.title || job.job_title || 'Untitled Tech Position';
  const company = job.company || job.company_name || 'Confidential Employer';
  const category = job.category || job.job_category || 'Technology';
  const location = job.location || 'Dhaka, Bangladesh';
  const salary = job.salary || 'Negotiable';
  const experience = job.experience || job.experience_level || 'Not Stated';
  const matchScore = job.match_score ?? 7;
  const priority = job.priority || 'Medium';
  const postedDate = job.posted_date || job.job_posting_date || 'Recent';
  const deadline = job.deadline || job.application_deadline || '';
  const applyUrl = job.url || job.original_url || job.apply_link;

  // Process skills array
  let skills = [];
  if (Array.isArray(job.skills)) {
    skills = job.skills;
  } else if (typeof job.skills === 'string') {
    skills = job.skills.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (typeof job.required_skills === 'string') {
    skills = job.required_skills.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const initial = company.charAt(0).toUpperCase();

  // Cohesive Match badge styling
  const isHighFit = matchScore >= 8;
  const matchBadgeClass = isHighFit
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
    : 'bg-slate-100 text-slate-700 border-slate-200';
  const matchIconClass = isHighFit ? 'text-emerald-600' : 'text-slate-500';

  return (
    <div 
      onClick={() => onSelect(job)}
      className="group relative rounded-xl border border-slate-200/90 bg-white p-6 md:p-7 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer min-h-[275px]"
    >
      <div className="space-y-4">
        {/* Top: Avatar, Title, Bookmark */}
        <div className="flex items-start justify-between gap-3.5">
          <div className="flex items-start gap-4 min-w-0">
            {/* Company Avatar */}
            <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:bg-slate-200/70 transition">
              {initial}
            </div>
            
            {/* Title & Company Meta */}
            <div className="min-w-0">
              <h3 className="font-bold text-base md:text-lg text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                {title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs md:text-sm text-slate-500 mt-1.5">
                <span className="font-semibold text-slate-800">{company}</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  {location}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  {formatPostedDate(postedDate)}
                </span>

                {/* Replaced Deadline with Match Score & Priority Badges */}
                <span className="text-slate-300">•</span>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${matchBadgeClass}`}>
                  <Sparkles className={`h-3 w-3 ${matchIconClass}`} />
                  <span>{matchScore}/10 Match</span>
                </div>
                {priority && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    priority === 'High'
                      ? 'bg-amber-50 text-amber-800 border-amber-200/90'
                      : priority === 'Medium'
                      ? 'bg-blue-50 text-blue-800 border-blue-200/90'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {priority}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(job, e);
            }}
            className={`p-2.5 rounded-lg border transition flex-shrink-0 cursor-pointer ${
              isSaved
                ? 'bg-amber-50 border-amber-300 text-amber-600'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300'
            }`}
            title={isSaved ? 'Remove from Saved' : 'Save Job'}
          >
            <Bookmark className={`h-4.5 w-4.5 ${isSaved ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Cohesive Metadata Tags */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80">
            <DollarSign className="h-3.5 w-3.5 text-slate-500" />
            {salary}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/80">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
            {experience}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/80">
            {category}
          </span>
        </div>

        {/* Minimalist Skills Chips */}
        {skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {skills.slice(0, 5).map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:border-slate-300 transition"
              >
                {skill}
              </span>
            ))}
            {skills.length > 5 && (
              <span className="text-xs font-medium text-slate-400 self-center">
                +{skills.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Deadline placed on the left, Details & Apply on the right */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {deadline ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/90 px-2.5 py-1 rounded-md border border-indigo-200/80">
              <Clock className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
              <span>Deadline: {deadline}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 py-1">
              <Clock className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
              <span>Open Application</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(job);
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition shadow-2xs cursor-pointer"
          >
            Details
          </button>

          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition shadow-xs hover:shadow-sm hover:shadow-indigo-500/25 cursor-pointer"
            >
              <span>Apply</span>
              <ExternalLink className="h-3.5 w-3.5 text-white/90" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
