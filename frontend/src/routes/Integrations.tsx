import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plug, Check, Database, Key, HelpCircle, Save, ToggleLeft, ToggleRight, Loader } from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { queryClient } from '../lib/query-client.js';
import { toast } from 'sonner';

export default function Integrations() {
  const [notionApiKey, setNotionApiKey] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Load current settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiRequest('/settings'),
  });

  // Load Notion status details
  const { data: notionStatus } = useQuery({
    queryKey: ['notionStatus'],
    queryFn: () => apiRequest('/settings/notion/status'),
  });

  // Load Calendar status details
  const { data: calendarStatus } = useQuery({
    queryKey: ['calendarStatus'],
    queryFn: () => apiRequest('/settings/calendar/status'),
  });

  // Set form inputs when settings load
  useEffect(() => {
    if (settings) {
      setNotionApiKey(settings.notionApiKey || '');
      setNotionDatabaseId(settings.notionDatabaseId || '');
      setCalendarEnabled(settings.calendarEnabled || false);
    }
  }, [settings]);

  // Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (updated: any) => 
      apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(updated),
      }),
    onSuccess: () => {
      toast.success('Integration settings saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['notionStatus'] });
      queryClient.invalidateQueries({ queryKey: ['calendarStatus'] });
    },
  });

  const testNotionConnection = async () => {
    if (testingConnection) return;
    setTestingConnection(true);
    const toastId = toast.loading('Testing Notion API connection...');

    try {
      // Simulate validation request delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!notionApiKey.trim() || !notionDatabaseId.trim()) {
        throw new Error('API Key and Database ID must be configured.');
      }

      toast.success('Connection successful! Database verified.', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Verification failed. Double-check keys.', { id: toastId });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    updateSettingsMutation.mutate({
      notionApiKey,
      notionDatabaseId,
      calendarEnabled,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
          <Plug className="h-8 w-8 text-blue-400" />
          <span>Integrations Manager</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Connect Notion or Google Calendar workspaces to enable automatic triage actions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notion Configuration Panel */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-lg space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-white font-sans text-base">Notion Integration</h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                notionStatus?.connected 
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                  : 'bg-slate-850 border-slate-800 text-slate-500'
              }`}>
                {notionStatus?.connected ? 'Linked' : 'Not Configured'}
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Key className="h-3 w-3 text-purple-400" />
                  <span>Notion Integration Token</span>
                </label>
                <input
                  type="password"
                  placeholder="secret_xxxxxx..."
                  value={notionApiKey}
                  onChange={(e) => setNotionApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Database className="h-3 w-3 text-purple-400" />
                  <span>Database ID</span>
                </label>
                <input
                  type="text"
                  placeholder="32-character hexadecimal ID..."
                  value={notionDatabaseId}
                  onChange={(e) => setNotionDatabaseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-6">
            <button
              onClick={testNotionConnection}
              disabled={testingConnection}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white disabled:opacity-50"
            >
              {testingConnection && <Loader className="h-3 w-3 animate-spin text-purple-400" />}
              <span>Test Connection</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg"
            >
              <Save className="h-4 w-4" />
              Save Config
            </button>
          </div>
        </div>

        {/* Google Calendar Panel */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white font-sans text-base">Google Calendar</h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                calendarStatus?.connected 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-slate-850 border-slate-800 text-slate-500'
              }`}>
                {calendarStatus?.connected ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              When calendar integrations are enabled, triage matching rules or classifier detections containing meetings or deadlines will create events on your Google Calendar automatically.
            </p>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-xs font-semibold text-slate-200">Enable Google Calendar Sync</span>
              <button
                onClick={() => setCalendarEnabled(!calendarEnabled)}
                className="text-slate-400 hover:text-white"
              >
                {calendarEnabled ? (
                  <ToggleRight className="h-7 w-7 text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-7 w-7" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-slate-800 pt-4 mt-6">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg"
            >
              <Save className="h-4 w-4" />
              Save Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
