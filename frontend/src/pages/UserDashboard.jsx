import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bookmark,
  RefreshCw,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { fetchJobs, updateJobStatus } from '../api';
import { JobCard } from '../components/JobCard';

export function UserDashboard({ onSelectJob, defaultTab = 'all' }) {
  const [jobs, setJobs] = useState([]);
  const [limit, setLimit] = useState(12);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(defaultTab === 'saved');

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [minScore, setMinScore] = useState('');
  const [sortBy, setSortBy] = useState('match_score');
  const [page, setPage] = useState(1);

  const categories = [
    'All',
    'Software Development',
    'AI & Data',
    'IT & Networking',
    'Other Technology Jobs'
  ];

  const loadJobs = async (showRefreshSpin = false) => {
    try {
      if (showRefreshSpin) setIsRefreshing(true);
      else if (jobs.length === 0) setLoading(true);

      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        category: category !== 'All' ? category : undefined,
        priority: priority !== 'All' ? priority : undefined,
        status: showSavedOnly ? 'Saved' : undefined,
        minScore: minScore ? parseInt(minScore, 10) : undefined,
        sortBy,
        sortOrder: 'desc',
      };

      const res = await fetchJobs(params);
      if (res && res.success) {
        let fetched = res.jobs || [];
        let totalCount = res.pagination?.total || 0;
        const isFilterActive = Boolean(search.trim() || (category !== 'All') || (priority !== 'All') || showSavedOnly || minScore);

        if (fetched.length > 0) {
          totalCount = res.pagination?.total || fetched.length;
          setJobs(fetched);
          try {
            if (!isFilterActive) {
              localStorage.setItem('yourfindjob_cached_jobs', JSON.stringify(fetched));
            }
          } catch (e) {}
        } else if (!isFilterActive) {
          // If no filter active but API returned 0 due to cold serverless container, restore cached jobs
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
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load and whenever filters change
  useEffect(() => {
    loadJobs();
  }, [page, limit, category, priority, showSavedOnly, minScore, sortBy]);

  // LIVE AUTO-SYNC: Polls MongoDB every 15 seconds with Anti-Flicker Protection
  useEffect(() => {
    const autoSyncInterval = setInterval(async () => {
      try {
        const params = {
          page,
          limit,
          search: search.trim() || undefined,
          category: category !== 'All' ? category : undefined,
          priority: priority !== 'All' ? priority : undefined,
          status: showSavedOnly ? 'Saved' : undefined,
          minScore: minScore ? parseInt(minScore, 10) : undefined,
          sortBy,
          sortOrder: 'desc',
        };

        const res = await fetchJobs(params);
        if (res && res.success) {
          let fetched = res.jobs || [];
          let totalCount = res.pagination?.total || 0;
          const isFilterActive = Boolean(search.trim() || (category !== 'All') || (priority !== 'All') || showSavedOnly || minScore);

          if (fetched.length > 0) {
            totalCount = res.pagination?.total || fetched.length;
            setJobs(fetched);
            try {
              if (!isFilterActive) {
                localStorage.setItem('yourfindjob_cached_jobs', JSON.stringify(fetched));
              }
            } catch (e) {}
          } else if (!isFilterActive) {
            // Keep existing or cache
            try {
              const raw = localStorage.getItem('yourfindjob_cached_jobs') || localStorage.getItem('yourfiendjob_cached_jobs');
              if (raw) {
                const cached = JSON.parse(raw);
                if (cached && cached.length > 0) {
                  totalCount = cached.length;
                  fetched = cached.slice((page - 1) * limit, page * limit);
                  setJobs(fetched);
                }
              }
            } catch (e) {}
          } else {
            setJobs([]);
          }

          if (totalCount > 0) {
            setPagination({
              page: res.pagination?.page || page,
              limit: res.pagination?.limit || limit,
              total: totalCount,
              pages: Math.max(1, Math.ceil(totalCount / limit)),
            });
          }
        }
      } catch (e) {
        // Silent background sync
      }
    }, 15000);

    return () => clearInterval(autoSyncInterval);
  }, [page, limit, category, priority, showSavedOnly, minScore, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadJobs(true);
  };

  const handleToggleBookmark = async (job, e) => {
    e?.stopPropagation();
    const isCurrentlySaved = job.status === 'Saved' || job.is_saved === true;
    const newStatus = isCurrentlySaved ? 'New' : 'Saved';
    const id = job._id || job.job_id;

    try {
      await updateJobStatus(id, { status: newStatus, is_saved: !isCurrentlySaved });
      setJobs((prev) =>
        prev.map((j) =>
          (j._id === id || j.job_id === id)
            ? { ...j, status: newStatus, is_saved: !isCurrentlySaved }
            : j
        )
      );
      if (showSavedOnly && isCurrentlySaved) {
        setJobs((prev) => prev.filter((j) => j._id !== id && j.job_id !== id));
      }
    } catch (err) {
      console.error('Failed to update bookmark:', err);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setPriority('All');
    setMinScore('');
    setSortBy('match_score');
    setShowSavedOnly(false);
    setPage(1);
  };

  const hasActiveFilters = search || category !== 'All' || priority !== 'All' || minScore || showSavedOnly;

  return (
    <div className="space-y-6 pb-16">
      {/* Search & Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-xs space-y-3.5">
        {/* Row 1: Search Form with Modern Indigo Accent Button */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, company, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold shadow-xs hover:shadow-sm hover:shadow-indigo-500/25 transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Row 2: Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Row 3: Dropdowns, Saved Toggle, Refresh & Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            <select
              value={minScore}
              onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Any Score</option>
              <option value="8">Score 8+</option>
              <option value="6">Score 6+</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="match_score">Highest Match</option>
              <option value="posted_date">Latest Date</option>
              <option value="title">Job Title</option>
            </select>

            <button
              type="button"
              onClick={() => { setShowSavedOnly(!showSavedOnly); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${showSavedOnly
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${showSavedOnly ? 'fill-amber-500 text-amber-600' : 'text-slate-400'}`} />
              <span>Saved</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right: Page size selector, Manual Refresh Button & Live Count */}
          <div className="flex items-center gap-2.5">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
              <option value={500}>Show All ({pagination.total})</option>
            </select>

            <button
              type="button"
              onClick={() => loadJobs(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
              title="Click to check for new jobs added by the agent"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Refresh</span>
            </button>

            <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
              <strong className="text-slate-900 font-bold">{pagination.total}</strong> Jobs
            </div>
          </div>
        </div>
      </div>

      {/* 2 Cards in a Row Grid */}
      {loading && jobs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading opportunities...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <Briefcase className="h-8 w-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">
            {showSavedOnly ? 'No saved jobs' : 'No jobs found'}
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <JobCard
              key={job._id || job.job_id}
              job={job}
              onSelect={onSelectJob}
              onToggleBookmark={handleToggleBookmark}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-500 font-medium">
            Page <strong className="text-slate-900 font-bold">{pagination.page}</strong> of {pagination.pages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
            disabled={pagination.page >= pagination.pages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 transition cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
