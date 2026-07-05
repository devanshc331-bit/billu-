import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Mail,
  CheckSquare,
  Calendar,
  AlertOctagon,
  Percent,
  History,
  Activity,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCcw,
  ShieldCheck,
  Search,
  Hourglass,
  Clock
} from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { formatTimeAgo } from '../lib/utils.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [refetchCounter, setRefetchCounter] = useState(0);

  // Poll for inbox updates every 15 seconds automatically
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['dashboardStats', refetchCounter],
    queryFn: () => apiRequest('/dashboard/overview'),
    refetchInterval: 15000,
  });

  const { data: activity, refetch: refetchActivity } = useQuery({
    queryKey: ['dashboardActivity', refetchCounter],
    queryFn: () => apiRequest('/dashboard/activity'),
    refetchInterval: 15000,
  });

  const { data: runs, refetch: refetchRuns } = useQuery({
    queryKey: ['runHistory', refetchCounter],
    queryFn: () => apiRequest('/dashboard/run-history'),
  });

  // Listen to manual sync completion events
  useEffect(() => {
    const handleSyncComplete = () => {
      setRefetchCounter(prev => prev + 1);
    };
    window.addEventListener('email_sync_complete', handleSyncComplete);
    return () => window.removeEventListener('email_sync_complete', handleSyncComplete);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Smart Inbox Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time status updates and automatic triage actions.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Unread emails */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800/80 p-5 flex items-start justify-between shadow-lg hover:border-slate-700 transition-all duration-200">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">Unread Inbox</span>
            <h3 className="text-3xl font-bold text-white tracking-tight">{stats?.unreadEmailsCount ?? 0}</h3>
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
              <TrendingDown className="h-3 w-3" />
              <span>-12% since yesterday</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Mail className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div
          onClick={() => navigate('/review')}
          className="cursor-pointer rounded-2xl bg-slate-900 border border-slate-800/80 p-5 flex items-start justify-between shadow-lg hover:border-amber-500/40 hover:bg-slate-900/80 transition-all duration-200"
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">Pending Review</span>
            <h3 className="text-3xl font-bold text-white tracking-tight">{stats?.pendingApprovalsCount ?? 0}</h3>
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
              <Hourglass className="h-3.5 w-3.5 animate-pulse" />
              <span>Requires approval</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Tasks created */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800/80 p-5 flex items-start justify-between shadow-lg hover:border-slate-700 transition-all duration-200">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">Notion Tasks</span>
            <h3 className="text-3xl font-bold text-white tracking-tight">{stats?.tasksCreatedCount ?? 0}</h3>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <span>Synced with database</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Failed/Retrying */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800/80 p-5 flex items-start justify-between shadow-lg hover:border-slate-700 transition-all duration-200">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">Triage Failures</span>
            <h3 className="text-3xl font-bold text-white tracking-tight">{stats?.failedJobsCount ?? 0}</h3>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <span>Jobs in retry cycle</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertOctagon className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Content Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity Log */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800/80 p-6 shadow-lg flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white font-sans">Triage Activity</h2>
            </div>
            <button
              onClick={() => {
                refetchStats();
                refetchActivity();
                refetchRuns();
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {activity && activity.length > 0 ? (
              activity.map((act: any) => (
                <div key={act.id} className="flex gap-4 border-l-2 border-slate-800 pl-4 py-1.5 relative group">
                  <div className="absolute -left-1.5 top-2.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-slate-800 group-hover:bg-slate-400 group-hover:border-slate-400 transition-all"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-slate-200">{act.message}</p>
                    <p className="text-xs text-slate-500">{formatTimeAgo(act.timestamp)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <span>No recent classification activity.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Run History */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800/80 p-6 shadow-lg flex flex-col h-[500px]">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <History className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white font-sans">Run History</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {runs && runs.length > 0 ? (
              runs.map((run: any) => (
                <div key={run.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 capitalize">{run.runType}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border ${
                        run.status === 'completed' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                      <span>{run.emailsProcessed} emails</span>
                      <span>{run.duration}ms</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                    {formatTimeAgo(run.startedAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                <History className="h-8 w-8 mb-2 opacity-50" />
                <span>No run history.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
