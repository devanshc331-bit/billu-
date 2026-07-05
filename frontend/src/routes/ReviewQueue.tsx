import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Inbox,
  Check,
  X,
  Edit2,
  EyeOff,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  FolderOpen,
  RefreshCcw
} from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { queryClient } from '../lib/query-client.js';
import { formatTimeAgo } from '../lib/utils.js';
import { toast } from 'sonner';

export default function ReviewQueue() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingEmail, setEditingEmail] = useState<any | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Load reviews list
  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => apiRequest('/review'),
  });

  // Action mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/review/${id}/approve`, { method: 'POST' }),
    onSuccess: (_, id) => {
      toast.success('Triage action approved!');
      setSelectedIds(prev => prev.filter(x => x !== id));
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/review/${id}/reject`, { method: 'POST' }),
    onSuccess: (_, id) => {
      toast.success('Recommendation dismissed.');
      setSelectedIds(prev => prev.filter(x => x !== id));
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const editApproveMutation = useMutation({
    mutationFn: ({ id, category, recommendedAction }: { id: string; category: string; recommendedAction: string }) => 
      apiRequest(`/review/${id}/edit`, {
        method: 'POST',
        body: JSON.stringify({ category, recommendedAction }),
      }),
    onSuccess: () => {
      toast.success('Triage action updated and approved!');
      setEditingEmail(null);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: string[]) => 
      apiRequest('/review/bulk-approve', {
        method: 'POST',
        body: JSON.stringify({ emailIds: ids }),
      }),
    onSuccess: (data) => {
      toast.success(`Successfully approved ${data.count} items.`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: (ids: string[]) => 
      apiRequest('/review/bulk-reject', {
        method: 'POST',
        body: JSON.stringify({ emailIds: ids }),
      }),
    onSuccess: (data) => {
      toast.success(`Dismissed ${data.count} items.`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredReviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReviews.map((r: any) => r.id));
    }
  };

  // Filter & Sort reviews
  const filteredReviews = reviews
    .filter((r: any) => {
      const matchesCategory = filterCategory === 'All' || r.category === filterCategory;
      const matchesQuery = 
        r.subject.toLowerCase().includes(filterQuery.toLowerCase()) ||
        r.senderName.toLowerCase().includes(filterQuery.toLowerCase()) ||
        r.senderEmail.toLowerCase().includes(filterQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    })
    .sort((a: any, b: any) => {
      const diff = b.confidenceScore - a.confidenceScore;
      return sortOrder === 'desc' ? diff : -diff;
    });

  // Prediction badge color helper
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Invoice':
      case 'Receipt':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'Meeting':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'Urgent':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'Newsletter':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      default:
        return 'bg-slate-500/10 border-slate-700/50 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Pending Review</h1>
          <p className="text-slate-400 text-sm mt-1">Review classifier predictions before triggering external actions.</p>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl animate-fade-in shadow-xl">
            <span className="text-xs text-slate-400 font-semibold px-2">{selectedIds.length} Selected</span>
            <button
              onClick={() => bulkApproveMutation.mutate(selectedIds)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              onClick={() => bulkRejectMutation.mutate(selectedIds)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700"
            >
              <X className="h-3.5 w-3.5" />
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Filter and Query Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900 border border-slate-800/80 p-4 rounded-2xl shadow-lg">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search sender, subject..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700 transition"
          />
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-slate-700"
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

        {/* Sort controls */}
        <button
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white transition"
        >
          <span>Sort Confidence</span>
          {sortOrder === 'desc' ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Main Review Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900 shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center text-slate-500 text-sm">
            <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-2 opacity-50" />
            <span>Loading reviews...</span>
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-white">
                      {selectedIds.length === filteredReviews.length ? (
                        <CheckSquare className="h-4.5 w-4.5 text-blue-500" />
                      ) : (
                        <Square className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4">Sender</th>
                  <th className="px-6 py-4">Email Details</th>
                  <th className="px-6 py-4">Prediction</th>
                  <th className="px-6 py-4">Confidence</th>
                  <th className="px-6 py-4">Triage Action</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredReviews.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-950/20 group transition duration-150">
                    {/* Checkbox */}
                    <td className="px-6 py-4">
                      <button onClick={() => handleSelectRow(row.id)} className="text-slate-400 hover:text-white">
                        {selectedIds.includes(row.id) ? (
                          <CheckSquare className="h-4.5 w-4.5 text-blue-500" />
                        ) : (
                          <Square className="h-4.5 w-4.5" />
                        )}
                      </button>
                    </td>

                    {/* Sender */}
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      <div className="truncate w-36">
                        <p>{row.senderName}</p>
                        <p className="text-[10px] text-slate-500 font-normal truncate">{row.senderEmail}</p>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="px-6 py-4 max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-100 truncate group-hover:text-blue-400 cursor-pointer transition">
                          {row.subject}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{row.snippet}</p>
                      </div>
                    </td>

                    {/* Prediction */}
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getCategoryColor(row.category)}`}>
                        {row.category}
                      </span>
                    </td>

                    {/* Confidence bar */}
                    <td className="px-6 py-4">
                      <div className="w-24 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold">
                          <span className={row.confidenceScore >= 90 ? 'text-emerald-400' : row.confidenceScore >= 70 ? 'text-amber-400' : 'text-rose-400'}>
                            {row.confidenceScore}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              row.confidenceScore >= 90 
                                ? 'bg-emerald-500' 
                                : row.confidenceScore >= 70 
                                  ? 'bg-amber-500' 
                                  : 'bg-rose-500'
                            }`}
                            style={{ width: `${row.confidenceScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Recommended action */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-300">
                      {row.recommendedAction?.replace(/_/g, ' ') || 'None'}
                    </td>

                    {/* Received Date */}
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatTimeAgo(row.receivedAt)}
                    </td>

                    {/* Control Buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => approveMutation.mutate(row.id)}
                          className="p-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20"
                          title="Approve Triage"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(row.id)}
                          className="p-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20"
                          title="Reject"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingEmail(row)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
                          title="Edit recommendation"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center text-slate-500 text-sm">
            <Inbox className="h-10 w-10 mx-auto mb-2 opacity-50 text-indigo-400" />
            <p className="font-semibold text-slate-300">Inbox is Triaged</p>
            <p className="text-xs text-slate-500">No emails currently pending approval.</p>
          </div>
        )}
      </div>

      {/* Edit recommendation modal overlay */}
      {editingEmail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white font-sans">Modify Triage Decision</h3>
              <button onClick={() => setEditingEmail(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Category Classification</label>
                <select
                  defaultValue={editingEmail.category}
                  id="modal-category"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-sm text-slate-100 focus:outline-none focus:border-slate-700"
                >
                  <option value="Invoice">Invoice</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Newsletter">Newsletter</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Needs Reply">Needs Reply</option>
                  <option value="Travel">Travel</option>
                  <option value="Work">Work</option>
                  <option value="Read Later">Read Later</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Recommended Integration Action</label>
                <select
                  defaultValue={editingEmail.recommendedAction || 'APPLY_GMAIL_LABEL'}
                  id="modal-action"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-sm text-slate-100 focus:outline-none focus:border-slate-700"
                >
                  <option value="CREATE_NOTION_TASK">Create Notion Task</option>
                  <option value="CREATE_CALENDAR_REMINDER">Create Google Calendar Event</option>
                  <option value="APPLY_GMAIL_LABEL">Apply Gmail Label</option>
                  <option value="MARK_READ">Mark Email Read</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setEditingEmail(null)}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const cat = (document.getElementById('modal-category') as HTMLSelectElement).value;
                  const act = (document.getElementById('modal-action') as HTMLSelectElement).value;
                  editApproveMutation.mutate({
                    id: editingEmail.id,
                    category: cat,
                    recommendedAction: act,
                  });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white shadow-lg"
              >
                Approve & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
