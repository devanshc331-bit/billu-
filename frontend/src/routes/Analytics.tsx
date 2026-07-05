import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, HelpCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import { apiRequest } from '../lib/api.js';

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];

export default function Analytics() {
  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ['analyticsCategories'],
    queryFn: () => apiRequest('/analytics/categories'),
  });

  const { data: confidence = [] } = useQuery({
    queryKey: ['analyticsConfidence'],
    queryFn: () => apiRequest('/analytics/confidence'),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['analyticsTasks'],
    queryFn: () => apiRequest('/analytics/tasks'),
  });

  const { data: reviews = { approvedCount: 0, pendingCount: 0, rejectedCount: 0 } } = useQuery({
    queryKey: ['analyticsReviews'],
    queryFn: () => apiRequest('/analytics/reviews'),
  });

  const reviewPieData = [
    { name: 'Approved', value: reviews.approvedCount },
    { name: 'Pending Review', value: reviews.pendingCount },
    { name: 'Rejected', value: reviews.rejectedCount },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-blue-400" />
          <span>Triage Analytics</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Inbox management diagnostics, classification distributions, and automation efficiency.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category distribution */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-lg space-y-4">
          <h3 className="font-bold text-white font-sans text-sm">Email Category Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No category classifications indexed.</p>
            )}
          </div>
        </div>

        {/* Action / Review approval rate */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-lg space-y-4">
          <h3 className="font-bold text-white font-sans text-sm">Triage Approval Rate</h3>
          <div className="h-64 flex items-center justify-center">
            {reviewPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reviewPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No triage actions performed.</p>
            )}
          </div>
        </div>

        {/* Confidence scores by category */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-lg space-y-4">
          <h3 className="font-bold text-white font-sans text-sm">Average Classifier Confidence (%)</h3>
          <div className="h-64">
            {confidence.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidence} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="category" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="avgConfidence" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {confidence.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 h-full flex items-center justify-center">No predictions score records.</p>
            )}
          </div>
        </div>

        {/* Task trend chart */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-lg space-y-4">
          <h3 className="font-bold text-white font-sans text-sm">Notion Tasks Created Trend (Last 7 Days)</h3>
          <div className="h-64">
            {tasks.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tasks} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="tasksCreated" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 h-full flex items-center justify-center">No tasks recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
