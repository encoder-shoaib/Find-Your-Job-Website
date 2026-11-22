import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Building2, 
  MapPin, 
  Eye, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { fetchJobs, updateJobStatus, deleteJob } from '../api';
import { PriorityBadge, ScoreBadge } from '../components/ui/Badge';
import { EditJobModal } from '../components/EditJobModal';

export function AdminJobManagement({ onSelectJob }) {
  const [jobs, setJobs] = useState([]);
  const [limit, setLimit] = useState(15);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);

  // Edit / Delete states
  const [editingJob, setEditingJob] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        category: category !== 'All' ? category : undefined,
        priority: priority !== 'All' ? priority : undefined,
        status: status !== 'All' ? status : undefined,
      };

      const res = await fetchJobs(params);
      if (res && res.success) {
        let fetched = res.jobs || [];
        let totalCount = res.pagination?.total || 0;
        const isFilterActive = Boolean(search.trim() || (category !== 'All') || (priority !== 'All') || (status !== 'All'));

        if (fetched.length > 0) {
          totalCount = res.pagination?.total || fetched.length;
          setJobs(fetched);
          try {
            if (!isFilterActive) {
              localStorage.setItem('yourfindjob_cached_jobs', JSON.stringify(fetched));
            }
          } catch (e) {}
        } else if (!isFilterActive) {
          // If no filter active but serverless cold container returned 0, restore cached jobs
          try {
            const raw = localStorage.getItem('yourfindjob_cached_jobs') || localStorage.getItem('yourfiendjob_cached_jobs');
            if (raw) {
              const cached = JSON.parse(raw);
              if (cached && cached.length > 0) {
                totalCount = cached.length;
                fetched = cached.slice((page - 1) * limit, page * limit);
              }
            }
          } catch (e) {}
          setJobs(fetched);
        } else {
          setJobs([]);
        }

        setPagination({
          page: res.pagination?.page || page,
          limit: res.pagination?.limit || limit,
          total: totalCount,
          pages: Math.max(1, Math.ceil(totalCount / limit)),
        });
      }
    } catch (err) {
      console.error('Failed to load admin jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [page, limit, category, priority, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadJobs();
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await updateJobStatus(jobId, { status: newStatus });
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId || j.job_id === jobId ? { ...j, status: newStatus } : j))
      );
      showToast(`Job status updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (job) => {
    const id = job._id || job.job_id;
    const title = job.title || job.job_title || 'this job';
    if (!window.confirm(`Are you sure you want to delete "${title}" from MongoDB and local storage?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await deleteJob(id);
      if (res && res.success) {
        setJobs((prev) => prev.filter((j) => j._id !== id && j.job_id !== id));
        showToast('Job permanently deleted from database.', 'success');
      } else {
        showToast(res?.error || 'Failed to delete job', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const handleJobUpdated = (updated) => {
    setJobs((prev) =>
      prev.map((j) =>
        (j._id === updated._id || j.job_id === updated.job_id) ? updated : j
      )
    );
    showToast('Job details updated successfully.', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Jobs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage all discovered job listings.
          </p>
        </div>

        <button
          onClick={loadJobs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Database</span>
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
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, company, skills, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Categories</option>
              <option value="Software Development">Software Development</option>
              <option value="AI & Data">AI & Data</option>
              <option value="IT & Networking">IT & Networking</option>
              <option value="Other Technology Jobs">Other Technology Jobs</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Saved">Saved</option>
              <option value="Applied">Applied</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setCategory('All');
                setPriority('All');
                setStatus('All');
                setPage(1);
              }}
              className="w-full py-1.5 rounded-md border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Meta & Page Size Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 px-1">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-900 font-bold">{jobs.length}</strong> of{' '}
            <strong className="text-slate-900 font-bold">{pagination.total}</strong> stored jobs
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-mono text-slate-600">Page {pagination.page} of {pagination.pages || 1}</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-slate-600">Show per page:</label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs focus:outline-none focus:border-indigo-500"
          >
            <option value={15}>15 jobs per page</option>
            <option value={30}>30 jobs per page</option>
            <option value={50}>50 jobs per page</option>
            <option value={100}>100 jobs per page</option>
            <option value={500}>Show All ({pagination.total})</option>
          </select>
        </div>
      </div>

      {/* Main Admin Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading database records...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <Briefcase className="h-8 w-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No records found matching filters</div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[240px]">Job Title & Company</th>
                  <th className="py-3 px-4 min-w-[130px]">Category</th>
                  <th className="py-3 px-3 text-center w-24">AI Fit</th>
                  <th className="py-3 px-3 text-center w-28">Priority</th>
                  <th className="py-3 px-4 text-center w-32">Status</th>
                  <th className="py-3 px-4 min-w-[110px]">Posted</th>
                  <th className="py-3 px-4 min-w-[120px]">Deadline</th>
                  <th className="py-3 px-4 text-right min-w-[150px]">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {jobs.map((job) => {
                  const id = job._id || job.job_id;
                  const titleText = job.title || job.job_title || 'Untitled Position';
                  const companyText = job.company || job.company_name || 'Confidential Employer';

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition">
                      {/* Title & Company */}
                      <td className="py-3 px-4">
                        <div 
                          onClick={() => onSelectJob(job)} 
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition truncate max-w-[260px]"
                        >
                          {titleText}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate max-w-[260px]">
                          <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate font-medium">{companyText}</span>
                          <span className="text-slate-300">•</span>
                          <span className="truncate">{job.location || 'Dhaka'}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[130px]">
                          {job.category || job.job_category || 'Technology'}
                        </span>
                      </td>

                      {/* AI Fit */}
                      <td className="py-3 px-3 text-center">
                        <ScoreBadge score={job.match_score} />
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 text-center">
                        <PriorityBadge priority={job.priority} />
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4 text-center">
                        <select
                          value={job.status || 'New'}
                          onChange={(e) => handleStatusChange(id, e.target.value)}
                          className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-2xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="New">New</option>
                          <option value="Reviewed">Reviewed</option>
                          <option value="Saved">Saved</option>
                          <option value="Applied">Applied</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </td>

                      {/* Posted */}
                      <td className="py-3 px-4 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                        {job.posted_date || 'Recent'}
                      </td>

                      {/* Deadline */}
                      <td className="py-3 px-4 text-[11px] font-semibold text-indigo-700 whitespace-nowrap">
                        {job.deadline || job.application_deadline || 'Available'}
                      </td>

                      {/* Admin Actions: Details, Edit, Delete */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectJob(job)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                            title="View Full Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingJob(job);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition"
                            title="Edit Job Details"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(job)}
                            disabled={deletingId === id}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600 transition disabled:opacity-40"
                            title="Delete Job from MongoDB"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 transition shadow-2xs"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-500">
            Page <strong className="text-slate-900">{pagination.page}</strong> of {pagination.pages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
            disabled={pagination.page >= pagination.pages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 transition shadow-2xs"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Edit Job Modal */}
      <EditJobModal
        job={editingJob}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onJobUpdated={handleJobUpdated}
      />
    </div>
  );
}
