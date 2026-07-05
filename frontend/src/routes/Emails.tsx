import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Mail,
  ChevronRight,
  User,
  Calendar,
  ExternalLink,
  Info,
  History,
  Tag,
  Paperclip,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { formatTimeAgo } from '../lib/utils.js';

export default function Emails() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Load emails
  const { data: emails = [], refetch } = useQuery({
    queryKey: ['emails', filterCategory, filterQuery],
    queryFn: () => apiRequest(`/emails?category=${filterCategory}&query=${filterQuery}`),
  });

  // Load selected email details
  const { data: detail = null, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['emailDetail', selectedId],
    queryFn: () => apiRequest(`/emails/${selectedId}`),
    enabled: !!selectedId,
  });

  // Re-run search if email_sync_complete fires
  useEffect(() => {
    const handleSyncComplete = () => refetch();
    window.addEventListener('email_sync_complete', handleSyncComplete);
    return () => window.removeEventListener('email_sync_complete', handleSyncComplete);
  }, [refetch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'failed':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'classified':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      default:
        return 'bg-slate-500/10 border-slate-700/50 text-slate-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
      {/* Left panel: Email List (5 cols) */}
      <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-lg flex flex-col overflow-hidden h-full">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/20 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search sender, subject..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-300 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Invoice">Invoice</option>
            <option value="Meeting">Meeting</option>
            <option value="Newsletter">Newsletter</option>
            <option value="Promotion">Promotion</option>
            <option value="Urgent">Urgent</option>
            <option value="Needs Reply">Needs Reply</option>
          </select>
        </div>

        {/* Email Cards List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
          {emails.length > 0 ? (
            emails.map((email: any) => (
              <div
                key={email.id}
                onClick={() => setSelectedId(email.id)}
                className={`p-3.5 rounded-xl flex items-start justify-between gap-3 cursor-pointer transition ${
                  selectedId === email.id
                    ? 'bg-slate-800 border border-slate-700'
                    : 'bg-transparent border border-transparent hover:bg-slate-900/40'
                }`}
              >
                <div className="space-y-1.5 truncate flex-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                    <span className="truncate max-w-28">{email.senderName || email.senderEmail}</span>
                    <span>{formatTimeAgo(email.receivedAt)}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 truncate">{email.subject}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{email.snippet}</p>
                  
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border border-blue-500/20 bg-blue-500/5 text-blue-400">
                      {email.category}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(email.status)}`}>
                      {email.status}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600 self-center flex-shrink-0" />
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-10">
              <Mail className="h-8 w-8 mb-2 opacity-50 text-indigo-400" />
              <span>No emails found.</span>
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Email detail (7 cols) */}
      <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-lg flex flex-col overflow-hidden h-full">
        {selectedId ? (
          isLoadingDetail ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
              <History className="h-8 w-8 animate-spin mb-2 opacity-50" />
              <span>Loading details...</span>
            </div>
          ) : detail ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header Panel */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/20 flex-shrink-0 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-white tracking-tight leading-tight">{detail.subject}</h3>
                    <p className="text-xs text-slate-400">
                      From: <span className="text-slate-300 font-semibold">{detail.senderName}</span> ({detail.senderEmail})
                    </p>
                  </div>
                  <a
                    href={`https://mail.google.com/mail/u/0/#inbox/${detail.threadId || detail.messageId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-950 hover:bg-slate-900 text-[10px] font-bold text-slate-400 hover:text-white"
                  >
                    <span>View Gmail</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Key metadata chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 border border-slate-800 bg-slate-950 px-2.5 py-1 rounded-lg text-[10px]">
                    <Tag className="h-3 w-3 text-blue-400" />
                    <span className="text-slate-400">Classified:</span>
                    <span className="font-bold text-slate-200">{detail.classifications?.[0]?.category || 'Unknown'} ({detail.classifications?.[0]?.confidenceScore || 0}%)</span>
                  </div>
                  
                  {detail.containsDeadline && (
                    <div className="flex items-center gap-1 border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 rounded-lg text-[10px] text-amber-400">
                      <Calendar className="h-3 w-3" />
                      <span>Has Deadline</span>
                    </div>
                  )}

                  {detail.notionTask && (
                    <div className="flex items-center gap-1.5 border border-purple-500/20 bg-purple-500/5 px-2.5 py-1 rounded-lg text-[10px] text-purple-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Task Synced</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Body Content Panel */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Email Body text content */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Text</h4>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-xs leading-relaxed text-slate-300 font-sans whitespace-pre-line select-text">
                    {detail.body || detail.snippet || '(No message content)'}
                  </div>
                </div>

                {/* Integration Details block */}
                {(detail.notionTask || detail.calendarEvent) && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Synced Abstractions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {detail.notionTask && (
                        <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-purple-400">Notion Page Task</p>
                            <p className="text-xs font-semibold text-slate-200 truncate max-w-44">{detail.notionTask.title}</p>
                            <p className="text-[9px] text-slate-400">Priority: {detail.notionTask.priority || 'Medium'}</p>
                          </div>
                          {detail.notionTask.notes && (
                            <a
                              href={detail.notionTask.notes}
                              target="_blank"
                              rel="noreferrer"
                              className="text-purple-400 hover:text-purple-300 self-center"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {detail.calendarEvent && (
                        <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-emerald-400">Calendar Event</p>
                            <p className="text-xs font-semibold text-slate-200 truncate max-w-44">{detail.calendarEvent.title}</p>
                            <p className="text-[9px] text-slate-400">Time: {new Date(detail.calendarEvent.reminderTime).toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audit trail / State Transitions */}
                <div className="space-y-3 border-t border-slate-800 pt-6">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    <span>Triage Audit Trail</span>
                  </h4>
                  <div className="relative border-l-2 border-slate-800 pl-4 space-y-4">
                    {detail.auditLogs?.map((log: any) => (
                      <div key={log.id} className="relative py-0.5 group">
                        <div className="absolute -left-5.5 top-2.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-slate-850"></div>
                        <div className="text-xs">
                          <p className="font-semibold text-slate-300">
                            State transition: <span className="text-blue-400 font-bold">{log.fromState || 'none'} → {log.toState || 'completed'}</span> ({log.action})
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {new Date(log.createdAt).toLocaleString()} • Actor: {log.actor}
                          </p>
                          {log.details && (
                            <pre className="text-[9px] text-slate-400 p-2 mt-1 rounded bg-slate-950 border border-slate-850 overflow-x-auto whitespace-pre-wrap leading-normal font-mono">
                              {JSON.stringify(JSON.parse(log.details), null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
            <Mail className="h-10 w-10 mb-2 opacity-50 text-indigo-400" />
            <p className="font-semibold text-slate-350">No Email Selected</p>
            <p className="text-[10px] text-slate-500">Select an email from the left list panel to inspect details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
