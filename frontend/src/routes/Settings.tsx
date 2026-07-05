import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings as SettingsIcon, ShieldAlert, Link2, Unlink, Save, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { queryClient } from '../lib/query-client.js';
import { toast } from 'sonner';

export default function Settings() {
  const [syncInterval, setSyncInterval] = useState(15);
  const [retryInterval, setRetryInterval] = useState(5);
  const [confidenceThresholdAuto, setConfidenceThresholdAuto] = useState(90);
  const [confidenceThresholdReview, setConfidenceThresholdReview] = useState(70);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load Settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiRequest('/settings'),
  });

  // Load Auth Status
  const { data: auth, refetch: refetchAuth } = useQuery({
    queryKey: ['authStatus'],
    queryFn: () => apiRequest('/auth/status'),
  });

  useEffect(() => {
    if (settings) {
      setSyncInterval(settings.syncInterval);
      setRetryInterval(settings.retryInterval);
      setConfidenceThresholdAuto(settings.confidenceThresholdAuto);
      setConfidenceThresholdReview(settings.confidenceThresholdReview);
      setTheme(settings.theme as 'light' | 'dark');
    }
  }, [settings]);

  // Mutations
  const saveSettingsMutation = useMutation({
    mutationFn: (updated: any) => 
      apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(updated),
      }),
    onSuccess: () => {
      toast.success('Configuration saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('/auth/disconnect', { method: 'POST' }),
    onSuccess: () => {
      toast.success('Google account disconnected.');
      refetchAuth();
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate({
      syncInterval,
      retryInterval,
      confidenceThresholdAuto,
      confidenceThresholdReview,
      theme,
    });
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-blue-400" />
          <span>System Settings</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure automation frequency thresholds, dark themes, and sync accounts.</p>
      </div>

      {/* OAuth Connection Status Box */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-lg space-y-4">
        <h3 className="font-bold text-white font-sans text-base flex items-center gap-1.5">
          <Link2 className="h-5 w-5 text-blue-400" />
          <span>Google Accounts Connection</span>
        </h3>

        {auth?.connected ? (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">Connected Account</p>
                <p className="text-sm font-bold text-white">{auth.email}</p>
                {auth.isExpired ? (
                  <p className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 mt-1">
                    <ShieldAlert className="h-3 w-3" />
                    <span>Credentials expired. Re-auth required.</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                    ✓ Credentials active and verified
                  </p>
                )}
              </div>
              <button
                onClick={() => disconnectMutation.mutate()}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300"
              >
                <Unlink className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-400">No account linked.</p>
              <p className="text-[11px] text-slate-500">
                Running in Sandbox Mode. Simulated synchronization will produce mock emails.
              </p>
            </div>
            <button
              onClick={handleConnect}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition"
            >
              <Link2 className="h-4 w-4" />
              Connect Gmail
            </button>
          </div>
        )}
      </div>

      {/* Scheduler Intervals configurations */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-lg space-y-6">
        <h3 className="font-bold text-white font-sans text-base flex items-center gap-2">
          <RefreshCw className="h-4.5 w-4.5 text-blue-400" />
          <span>Automation Schedules</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold block">Inbox Sync Interval (minutes)</label>
            <input
              type="number"
              value={syncInterval}
              onChange={(e) => setSyncInterval(parseInt(e.target.value) || 15)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold block">Failure Retry Interval (minutes)</label>
            <input
              type="number"
              value={retryInterval}
              onChange={(e) => setRetryInterval(parseInt(e.target.value) || 5)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Threshold limits configurations */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-lg space-y-6">
        <h3 className="font-bold text-white font-sans text-base flex items-center gap-1.5">
          <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
          <span>Confidence Scoring Thresholds</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold block">Auto-Execute Minimum Score (%)</label>
            <input
              type="number"
              value={confidenceThresholdAuto}
              onChange={(e) => setConfidenceThresholdAuto(parseInt(e.target.value) || 90)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold block">Triage Recommendation Minimum Score (%)</label>
            <input
              type="number"
              value={confidenceThresholdReview}
              onChange={(e) => setConfidenceThresholdReview(parseInt(e.target.value) || 70)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Save Button Row */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/10 transition"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
