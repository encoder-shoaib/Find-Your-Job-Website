import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Activity, 
  Database, 
  HardDrive, 
  FileSpreadsheet, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Layers, 
  Terminal, 
  Search,
  Sparkles,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { fetchAgentStatus, fetchAgentLogs, fetchSearchHistory, triggerAgentRun } from '../api';
import { CardSpotlight } from '../components/ui/CardSpotlight';

export function AgentActivity({ onOpenAdminModal }) {
  const [statusData, setStatusData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);
  const [runParams, setRunParams] = useState({ limit: 5, dryRun: true });
  const pollingRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, logsRes, histRes] = await Promise.all([
        fetchAgentStatus(),
        fetchAgentLogs(40),
        fetchSearchHistory(20),
      ]);
      if (statusRes?.success) setStatusData(statusRes);
      if (logsRes?.success) setLogs(logsRes.logs || []);
      if (histRes?.success) setSearchHistory(histRes.history || []);
    } catch (err) {
      console.error('Failed to load agent activity data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000); // refresh every 20s
    return () => clearInterval(interval);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleRunAgent = async () => {
    if (triggering || statusData?.agent?.isRunning) return;

    try {
      setTriggering(true);
      setTriggerResult({
        success: true,
        message: `Agent hunt dispatched (${runParams.dryRun ? 'Dry-Run' : 'Live'}, Limit: ${runParams.limit} jobs). Crawling Bdjobs...`,
      });

      const res = await triggerAgentRun(runParams);
      if (res && res.success) {
        setTriggerResult(res);
      }

      // Active polling every 2 seconds while the agent executes in background
      let pollCount = 0;
      if (pollingRef.current) clearInterval(pollingRef.current);

      pollingRef.current = setInterval(async () => {
        pollCount++;
        try {
          const statusRes = await fetchAgentStatus();
          if (statusRes?.success) {
            setStatusData(statusRes);
            const isStillRunning = statusRes.agent?.isRunning;

            if (!isStillRunning || pollCount >= 35) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
              setTriggering(false);

              // Refresh logs and search history upon finish
              const [logsRes, histRes] = await Promise.all([
                fetchAgentLogs(40),
                fetchSearchHistory(20),
              ]);
              if (logsRes?.success) setLogs(logsRes.logs || []);
              if (histRes?.success) setSearchHistory(histRes.history || []);

              setTriggerResult({
                success: true,
                message: 'Autonomous hunt completed. Multi-tier storage & crawl history synchronized.',
                output: statusRes.agent?.currentRun?.lastLine || 'Finished crawl.',
              });
            }
          }
        } catch (e) {
          // silent poll catch
        }
      }, 2000);

    } catch (err) {
      setTriggering(false);
      const errMsg = err.response?.data?.message || err.message || 'Failed to start agent';
      setTriggerResult({
        success: false,
        error: errMsg,
        message: errMsg,
      });
    }
  };

  const isAgentActive = triggering || statusData?.agent?.isRunning;
  const tiers = statusData?.storageTiers || {};

  // Formatted counts
  const mongoCount = tiers.mongodb?.totalJobs ?? tiers.mongodb?.jobsCount ?? 0;
  const jsonCount = tiers.jsonBackup?.totalJobs ?? tiers.jsonBackup?.recordCount ?? 0;
  const jsonSize = tiers.jsonBackup?.fileSizeKB || 0;
  const excelCount = tiers.excel?.totalRows ?? tiers.excelReport?.totalRows ?? 0;
  const excelSize = tiers.excel?.fileSizeKB ?? tiers.excelReport?.fileSizeKB ?? 0;

  return (
    <div className="space-y-7 animate-fade-in pb-16">
      {/* Header & Main Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Agent & Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor crawler execution, multi-tier storage pipelines, and real-time logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAdminModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 transition cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Admin Access</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* 3-Tier Enterprise Storage Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier 1: MongoDB Database */}
        <CardSpotlight color="rgba(16, 185, 129, 0.08)">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Database className="h-4 w-4 text-emerald-600" />
              <span>MongoDB (Primary DB)</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tiers.mongodb?.isOnline ? 'Active' : 'Connected'}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Database:</span>
              <span className="font-mono text-slate-900 font-bold">{tiers.mongodb?.database || 'yourfiendjob_db'}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Jobs Stored:</span>
              <span className="font-mono text-emerald-700 font-extrabold">{mongoCount}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Host:</span>
              <span className="font-mono text-slate-700 text-[11px] truncate max-w-[170px]">
                {tiers.mongodb?.host || 'localhost:27017'}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Collections:</span>
              <span className="font-mono text-slate-700 text-[11px]">jobs, logs, history, users</span>
            </div>
          </div>
        </CardSpotlight>

        {/* Tier 2: Local JSON Storage */}
        <CardSpotlight color="rgba(37, 99, 235, 0.08)">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-blue-600" />
              <span>JSON (Zero-Fail Backup)</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              {tiers.jsonBackup?.exists ? 'Synced' : 'Ready'}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Backup File:</span>
              <span className="font-mono text-slate-900 font-bold">data/jobs.json</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Jobs Saved:</span>
              <span className="font-mono text-blue-700 font-extrabold">{jsonCount}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>File Size:</span>
              <span className="font-mono text-slate-700 font-semibold">{jsonSize} KB</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Sync Recovery:</span>
              <span className="text-slate-800 text-[11px] font-medium">Automatic on Restart</span>
            </div>
          </div>
        </CardSpotlight>

        {/* Tier 3: Excel Report */}
        <CardSpotlight color="rgba(20, 184, 166, 0.08)">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-teal-600" />
              <span>Excel (Report Exporter)</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
              {tiers.excel?.exists || tiers.excelReport?.exists ? 'Exported' : 'Active'}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Report File:</span>
              <span className="font-mono text-slate-900 font-bold">data/jobs.xlsx</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Sheet Rows:</span>
              <span className="font-mono text-teal-700 font-extrabold">{excelCount}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>File Size:</span>
              <span className="font-mono text-slate-700 font-semibold">{excelSize} KB</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Styling:</span>
              <span className="text-slate-800 text-[11px] font-medium">Formatted & Color-Coded</span>
            </div>
          </div>
        </CardSpotlight>
      </div>

      {/* Manual Trigger & Configuration Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600" />
              <span>Trigger Autonomous Agent Hunt</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Launch the OpenAI Agent to crawl Bdjobs, compute fit scores, and persist to all 3 storage tiers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <label>Limit:</label>
              <select
                value={runParams.limit}
                onChange={(e) => setRunParams({ ...runParams, limit: parseInt(e.target.value, 10) })}
                className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800"
              >
                <option value={3}>3 jobs</option>
                <option value={5}>5 jobs</option>
                <option value={10}>10 jobs</option>
                <option value={20}>20 jobs</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={runParams.dryRun}
                onChange={(e) => setRunParams({ ...runParams, dryRun: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-0"
              />
              <span>Dry Run (No Email)</span>
            </label>

            <button
              onClick={handleRunAgent}
              disabled={isAgentActive}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-xs font-bold shadow-xs transition cursor-pointer ${
                isAgentActive 
                  ? 'bg-amber-600 hover:bg-amber-700 cursor-not-allowed opacity-90' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
              }`}
            >
              {isAgentActive ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Agent Hunting in Progress...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Run Agent Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Trigger Output Notification */}
        {triggerResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-1.5 ${
              triggerResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {triggerResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{triggerResult.message || triggerResult.error || 'Execution status updated.'}</span>
            </div>
            {triggerResult.output && (
              <p className="mt-1 text-[11px] opacity-90 pl-6">
                Status: {triggerResult.output}
              </p>
            )}
          </div>
        )}

        {/* Real-time Streaming Agent Output Window */}
        {(isAgentActive || (statusData?.agent?.currentRun?.logs && statusData.agent.currentRun.logs.length > 0)) && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
              <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                <span className={`h-2 w-2 rounded-full ${isAgentActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                {isAgentActive ? 'LIVE: Autonomous AI Agent Executing...' : 'Recent Execution Stream'}
              </span>
              <span className="text-slate-400 text-[10px]">
                {statusData?.agent?.currentRun?.startedAt ? new Date(statusData.agent.currentRun.startedAt).toLocaleTimeString() : ''}
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] text-slate-300 scrollbar-thin">
              {statusData?.agent?.currentRun?.logs?.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-slate-600 select-none mr-2 font-mono">›</span>
                  <span className={
                    line.includes('ERROR') || line.includes('ERR') 
                      ? 'text-rose-400 font-bold' 
                      : line.includes('Success') || line.includes('saved') || line.includes('retrieved')
                      ? 'text-emerald-400' 
                      : 'text-slate-300'
                  }>
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search History & Audit Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Recent Crawl & Search History</h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">From MongoDB search_history</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-4">Date / Time</th>
                <th className="py-2.5 px-4">Query / Keywords</th>
                <th className="py-2.5 px-3 text-center">Found</th>
                <th className="py-2.5 px-3 text-center">New Added</th>
                <th className="py-2.5 px-3 text-center">Duplicates Skipped</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {searchHistory.length > 0 ? (
                searchHistory.map((item, idx) => {
                  let formattedKeywords = 'Tech Keywords';
                  if (Array.isArray(item.keywords)) {
                    formattedKeywords = item.keywords.length > 4 
                      ? `${item.keywords.slice(0, 3).join(', ')} +${item.keywords.length - 3} more`
                      : item.keywords.join(', ');
                  } else if (typeof item.keywords === 'string') {
                    formattedKeywords = item.keywords.length > 60 
                      ? item.keywords.slice(0, 60) + '...'
                      : item.keywords;
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {formattedKeywords}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                        {item.total_found ?? item.found_count ?? item.jobs_found ?? 0}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">
                        +{item.new_jobs ?? item.new_count ?? item.jobs_saved ?? 0}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-amber-600 font-semibold">
                        {item.duplicates_skipped ?? item.duplicates_count ?? 0}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {item.status || 'Success'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                    No search runs recorded yet. Run the agent to populate search history!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Agent Activity Logs */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Agent Execution Logs</h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">From MongoDB agent_logs</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log, idx) => (
              <div key={idx} className="p-3.5 hover:bg-slate-50 transition flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {log.action || log.event || 'AGENT_EVENT'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 break-words">
                    {log.message || log.details || JSON.stringify(log)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No recent logs recorded in MongoDB agent_logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
