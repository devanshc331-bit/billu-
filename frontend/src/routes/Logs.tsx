import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, RefreshCcw, Search, AlertCircle, Info, Flame } from 'lucide-react';
import { apiRequest } from '../lib/api.js';

export default function Logs() {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['systemLogs'],
    queryFn: () => apiRequest('/logs'),
    refetchInterval: 10000, // Poll every 10 seconds for real-time logs feel
  });

  const getLogLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
      case 'fatal':
        return 'text-rose-400 font-bold';
      case 'warn':
        return 'text-amber-400 font-bold';
      case 'audit':
        return 'text-purple-400 font-bold';
      default:
        return 'text-slate-400';
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
      case 'fatal':
        return <Flame className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />;
      case 'warn':
        return <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />;
      default:
        return <Info className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />;
    }
  };

  const filteredLogs = logs.filter((log: any) => {
    const matchesLevel = filterLevel === 'all' || log.level.toLowerCase() === filterLevel.toLowerCase();
    const textStr = JSON.stringify(log).toLowerCase();
    const matchesSearch = textStr.includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-400" />
            <span>System Logs Console</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-sans">Structured JSON outputs for job history, API calls, and classification details.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          title="Refresh Logs"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900 border border-slate-800/80 p-4 rounded-2xl shadow-lg flex-shrink-0">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search log messages, job IDs, error properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
          />
        </div>

        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="w-full sm:w-40 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">All Levels</option>
          <option value="info">INFO</option>
          <option value="warn">WARN</option>
          <option value="error">ERROR</option>
          <option value="audit">AUDIT</option>
        </select>
      </div>

      {/* Terminal View Container */}
      <div className="flex-1 rounded-2xl border border-slate-800/80 bg-slate-950 font-mono text-[11px] p-5 shadow-2xl overflow-y-auto space-y-2 select-text selection:bg-slate-800">
        {isLoading ? (
          <div className="text-center py-20 text-slate-500">Retrieving system console logs...</div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log: any, index: number) => (
            <div key={index} className="py-1 px-2 rounded hover:bg-slate-900/50 flex items-start gap-3 transition">
              <span className="text-slate-600 flex-shrink-0 selection:text-slate-600">{new Date(log.timestamp).toLocaleString()}</span>
              {getLogLevelIcon(log.level)}
              <span className={`uppercase text-[9px] px-1.5 py-0.2 rounded border w-12 text-center flex-shrink-0 ${
                log.level === 'error' 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                  : log.level === 'warn'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : log.level === 'audit'
                      ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                      : 'bg-slate-850 border-slate-800 text-slate-400'
              }`}>
                {log.level}
              </span>
              <div className="flex-1 space-y-1">
                <span className="text-slate-200 font-semibold">{log.message}</span>
                {/* Print payload data if exists */}
                {Object.keys(log).some(k => !['timestamp', 'level', 'message'].includes(k)) && (
                  <pre className="text-[10px] text-slate-400 leading-relaxed font-mono mt-1 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(
                      Object.keys(log).reduce((acc: any, key) => {
                        if (!['timestamp', 'level', 'message'].includes(key)) {
                          acc[key] = log[key];
                        }
                        return acc;
                      }, {}),
                      null,
                      2
                    )}
                  </pre>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-slate-500">No logs found matching filter criteria.</div>
        )}
      </div>
    </div>
  );
}
