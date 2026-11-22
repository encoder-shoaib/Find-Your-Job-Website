import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Bookmark, 
  ExternalLink, 
  Building2, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  Sparkles,
  Check
} from 'lucide-react';
import { fetchJobs, updateJobStatus } from '../api';
import { PriorityBadge, ScoreBadge } from '../components/ui/Badge';

export function AllJobs({ onSelectJob }) {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');
  const [location, setLocation] = useState('All');
  const [minScore, setMinScore] = useState('');
  const [sortBy, setSortBy] = useState('posted_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        category: category !== 'All' ? category : undefined,
        priority: priority !== 'All' ? priority : undefined,
        status: status !== 'All' ? status : undefined,
        location: location !== 'All' ? location : undefined,
        minScore: minScore ? parseInt(minScore, 10) : undefined,
        sortBy,
        sortOrder,
      };
      const res = await fetchJobs(params);
      if (res && res.success) {
        setJobs(res.jobs || []);
        setPagination(res.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [page, category, priority, status, location, minScore, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadJobs();
  };

  const handleStatusChange = async (jobId, newStatus, e) => {
    e.stopPropagation();
    try {
      await updateJobStatus(jobId, { status: newStatus });
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId || j.job_id === jobId ? { ...j, status: newStatus } : j))
      );
    } catch (err) {
      console.error('Failed to update job status:', err);
    }
  };

  const handleToggleBookmark = async (job, e) => {
    e.stopPropagation();
    const newStatus = job.status === 'Saved' ? 'New' : 'Saved';
    const id = job._id || job.job_id;
    try {
      await updateJobStatus(id, { status: newStatus });
      setJobs((prev) =>
        prev.map((j) => (j._id === id || j.job_id === id ? { ...j, status: newStatus } : j))
      );
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header & View Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Discovered Opportunities</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, filter, analyze AI reasoning, and apply directly to verified Bangladesh tech openings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <button
            onClick={loadJobs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
        {/* Search Input Row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, company, skills (e.g. Python, React, AI)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
          >
            Search
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="All">All Priorities</option>
              <option value="High">High (8-10)</option>
              <option value="Medium">Medium (5-7)</option>
              <option value="Low">Low (1-4)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Saved">Saved</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Applied">Applied</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Min Score */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min Match Score</label>
            <select
              value={minScore}
              onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">Any Score</option>
              <option value="8">8+ (High Fit)</option>
              <option value="6">6+ (Good Fit)</option>
              <option value="5">5+ (Average)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="posted_date">Posting Date</option>
              <option value="match_score">Match Score</option>
              <option value="title">Job Title</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setCategory('All');
                setPriority('All');
                setStatus('All');
                setLocation('All');
                setMinScore('');
                setSortBy('posted_date');
                setSortOrder('desc');
                setPage(1);
              }}
              className="w-full py-1.5 rounded-md border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Count & Meta */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <span className="font-bold text-slate-900">{jobs.length}</span> of{' '}
          <span className="font-bold text-slate-900">{pagination.total}</span> jobs found
        </span>
        <span className="font-mono text-[11px] text-slate-400">Page {pagination.page} of {pagination.pages || 1}</span>
      </div>

      {/* Main Content: Table or Cards */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Querying MongoDB for latest positions...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <Briefcase className="h-8 w-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No jobs match your filter criteria</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your search terms, adjusting minimum score, or run the agent to discover more tech jobs.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Semantic Responsive Table on Clean White */
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">Save</th>
                  <th className="py-3 px-4 min-w-[240px]">Job Title & Company</th>
                  <th className="py-3 px-4 min-w-[130px]">Category</th>
                  <th className="py-3 px-4 min-w-[120px]">Location</th>
                  <th className="py-3 px-4 min-w-[140px]">Experience / Salary</th>
                  <th className="py-3 px-3 text-center w-24">Score</th>
                  <th className="py-3 px-3 text-center w-28">Priority</th>
                  <th className="py-3 px-3 text-center w-28">Status</th>
                  <th className="py-3 px-4 min-w-[110px]">Posted</th>
                  <th className="py-3 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {jobs.map((job) => {
                  const isSaved = job.status === 'Saved';
                  const titleText = job.title || job.job_title || 'Untitled Tech Position';
                  const companyText = job.company || job.company_name || 'Confidential Employer';

                  return (
                    <tr
                      key={job._id || job.job_id}
                      onClick={() => onSelectJob(job)}
                      className="hover:bg-blue-50/40 transition cursor-pointer group"
                    >
                      {/* Save Star */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => handleToggleBookmark(job, e)}
                          title={isSaved ? 'Remove from Saved' : 'Save Job'}
                          className={`p-1 rounded hover:bg-slate-100 transition ${
                            isSaved ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-amber-500' : ''}`} />
                        </button>
                      </td>

                      {/* Title & Company */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate max-w-[260px]">
                          {titleText}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate max-w-[260px]">
                          <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate font-medium">{companyText}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[140px]">
                          {job.category || job.job_category || 'Technology'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-slate-700 truncate max-w-[130px]">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{job.location || 'Dhaka'}</span>
                        </div>
                      </td>

                      {/* Experience / Salary */}
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        <div>{job.experience || 'Experience Not Stated'}</div>
                        <div className="text-slate-900 font-bold truncate max-w-[130px]">{job.salary || 'Negotiable'}</div>
                      </td>

                      {/* Match Score */}
                      <td className="py-3 px-3 text-center">
                        <ScoreBadge score={job.match_score} />
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 text-center">
                        <PriorityBadge priority={job.priority} />
                      </td>

                      {/* Interactive Status Selector */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={job.status || 'New'}
                          onChange={(e) => handleStatusChange(job._id || job.job_id, e.target.value, e)}
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-2xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="New">New</option>
                          <option value="Saved">Saved</option>
                          <option value="Reviewed">Reviewed</option>
                          <option value="Applied">Applied</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </td>

                      {/* Posted Date */}
                      <td className="py-3 px-4 text-[11px] text-slate-500 whitespace-nowrap font-mono">
                        {job.posted_date || 'Recent'}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectJob(job)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
                            title="View Full AI Analysis"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {(job.url || job.original_url || job.apply_link) && (
                            <a
                              href={job.url || job.original_url || job.apply_link}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition"
                              title="Apply on Bdjobs"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
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
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const isSaved = job.status === 'Saved';
            const titleText = job.title || job.job_title || 'Untitled Tech Position';
            const companyText = job.company || job.company_name || 'Confidential Employer';

            return (
              <div
                key={job._id || job.job_id}
                onClick={() => onSelectJob(job)}
                className="rounded-xl border border-slate-200 bg-white hover:border-blue-300 p-4 space-y-3 cursor-pointer transition shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition line-clamp-2">
                      {titleText}
                    </span>
                    <button
                      onClick={(e) => handleToggleBookmark(job, e)}
                      className={`p-1 rounded hover:bg-slate-100 transition flex-shrink-0 ${
                        isSaved ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate font-medium">{companyText}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{job.location || 'Dhaka, Bangladesh'}</span>
                  </div>

                  {job.match_reason && (
                    <div className="mt-2.5 p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-slate-700 line-clamp-2 italic">
                      "{job.match_reason}"
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <PriorityBadge priority={job.priority} />
                    <ScoreBadge score={job.match_score} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="font-bold text-slate-900">{job.salary || 'Negotiable'}</span>
                    {(job.url || job.original_url || job.apply_link) && (
                      <a
                        href={job.url || job.original_url || job.apply_link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold"
                      >
                        <span>Bdjobs</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-500 font-medium">
            Page <span className="font-bold text-slate-900">{pagination.page}</span> of {pagination.pages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
            disabled={pagination.page >= pagination.pages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
