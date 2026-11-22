import React, { useState } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  Flame, 
  Bookmark, 
  TrendingUp, 
  Database, 
  HardDrive, 
  FileSpreadsheet, 
  ArrowRight, 
  Building2, 
  MapPin, 
  ChevronRight,
  Layers,
  Play,
  RefreshCw
} from 'lucide-react';
import { PriorityBadge, ScoreBadge } from '../components/ui/Badge';
import { triggerAgentRun } from '../api';

export function Dashboard({ stats, onNavigateJobs, onSelectJob, onAgentComplete }) {
  const [isRunning, setIsRunning] = useState(false);
  const [huntMsg, setHuntMsg] = useState('');

  const handleRunAgent = async () => {
    try {
      setIsRunning(true);
      setHuntMsg('Launching Agent...');
      const res = await triggerAgentRun({ limit: 10, dryRun: true });
      if (res && res.success) {
        if (res.newJobs && res.newJobs.length > 0) {
          try {
            const raw = localStorage.getItem('yourfindjob_cached_jobs');
            const prev = raw ? JSON.parse(raw) : [];
            const seen = new Set(prev.map((j) => String(j.job_id)));
            const combined = [...res.newJobs.filter((j) => !seen.has(String(j.job_id))), ...prev];
            localStorage.setItem('yourfindjob_cached_jobs', JSON.stringify(combined));
          } catch (e) {}
        }
        setHuntMsg(`Agent finished! Added ${res.newJobs?.length || 0} new jobs.`);
        if (onAgentComplete) onAgentComplete(res);
      }
      setTimeout(() => {
        setIsRunning(false);
        setHuntMsg('');
      }, 4000);
    } catch (err) {
      setHuntMsg('Agent run failed: ' + (err.message || 'Error'));
      setIsRunning(false);
      setTimeout(() => setHuntMsg(''), 4000);
    }
  };

  const totalJobs = stats?.totalJobs || 0;
  const newToday = stats?.newJobsToday ?? stats?.newToday ?? 0;
  const highPriority = stats?.highPriorityJobs ?? stats?.highPriority ?? 0;
  const mediumPriority = stats?.mediumPriority ?? 0;
  const lowPriority = stats?.lowPriority ?? 0;
  const savedJobs = stats?.savedJobs || 0;
  const priorityDist = stats?.priorityDistribution || {};
  const categoryDist = stats?.categoryDistribution || {};
  const recentJobs = stats?.recentJobs || [];
  const storageTiers = stats?.storageTiers || {};

  const highCount = priorityDist.High ?? priorityDist.high ?? highPriority;
  const medCount = priorityDist.Medium ?? priorityDist.medium ?? mediumPriority;
  const lowCount = priorityDist.Low ?? priorityDist.low ?? lowPriority;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform metrics and discovered tech jobs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {huntMsg && (
            <span className="text-xs font-medium text-indigo-700 animate-fade-in hidden sm:inline">
              {huntMsg}
            </span>
          )}

          <button
            onClick={handleRunAgent}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
            title="Crawl Bdjobs for new jobs and update MongoDB"
          >
            <Play className={`h-3.5 w-3.5 text-indigo-600 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Hunting...' : 'Run Agent'}</span>
          </button>

          <button
            onClick={() => onNavigateJobs()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
          >
            <span>Manage Jobs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Jobs */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Jobs</span>
            <Briefcase className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900">
              {totalJobs}
            </span>
          </div>
        </div>

        {/* New Today */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">New Today</span>
            <Sparkles className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900">
              {newToday}
            </span>
          </div>
        </div>

        {/* High Priority */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">High Priority</span>
            <Flame className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900">
              {highPriority}
            </span>
          </div>
        </div>

        {/* Saved Jobs */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Saved Jobs</span>
            <Bookmark className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900">
              {savedJobs}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Priority Breakdown (Col Span 2) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Priority Distribution</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">{totalJobs} total</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* High Priority */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  High Priority
                </span>
                <span className="font-semibold text-slate-900">{highCount}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${totalJobs ? Math.round((highCount / totalJobs) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Medium Priority */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Medium Priority
                </span>
                <span className="font-semibold text-slate-900">{medCount}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${totalJobs ? Math.round((medCount / totalJobs) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Low Priority */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  Low Priority
                </span>
                <span className="font-semibold text-slate-900">{lowCount}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-slate-400 rounded-full"
                  style={{ width: `${totalJobs ? Math.round((lowCount / totalJobs) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Storage Engine Status (Col Span 1) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Storage Status</h2>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Database className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-800">MongoDB</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <HardDrive className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-800">JSON Backup</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-800">Excel Export</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Ready
              </span>
            </div>
          </div>
        </div>

        {/* Top Categories (Col Span 1) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Categories</h2>
          </div>

          <div className="space-y-2 pt-1">
            {Object.entries(categoryDist).length > 0 ? (
              Object.entries(categoryDist).slice(0, 5).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-700 font-medium truncate max-w-[180px]" title={cat}>{cat}</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">No category data</div>
            )}
          </div>
        </div>

        {/* Recent Jobs (Col Span 2) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Recent Jobs</h2>
            </div>
            <button
              onClick={() => onNavigateJobs()}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {recentJobs.length > 0 ? (
              recentJobs.slice(0, 5).map((job) => {
                const titleText = job.title || job.job_title || 'Untitled Tech Position';
                const companyText = job.company || job.company_name || 'Confidential Employer';
                return (
                  <div
                    key={job._id || job.job_id}
                    onClick={() => onSelectJob(job)}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 cursor-pointer transition"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs md:text-sm text-slate-900 truncate">
                          {titleText}
                        </span>
                        <PriorityBadge priority={job.priority} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="font-medium text-slate-700 truncate">
                          {companyText}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>{job.location || 'Dhaka'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <ScoreBadge score={job.match_score} />
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center">
                No recent jobs recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
