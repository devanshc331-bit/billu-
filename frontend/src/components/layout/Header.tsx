import { useState, useEffect } from 'react';
import { RefreshCw, Bell, AlertTriangle, CheckCircle, Wifi } from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { toast } from 'sonner';

export default function Header() {
  const [syncing, setSyncing] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ connected: boolean; email?: string } | null>(null);

  const fetchAuthStatus = async () => {
    try {
      const data = await apiRequest('/auth/status');
      setAuthStatus(data);
    } catch (_) {
      setAuthStatus({ connected: false });
    }
  };

  useEffect(() => {
    fetchAuthStatus();
    // Refresh auth state check every 30 seconds
    const id = setInterval(fetchAuthStatus, 30000);
    return () => clearInterval(id);
  }, []);

  const triggerSync = async () => {
    if (syncing) return;
    setSyncing(true);
    const toastId = toast.loading('Syncing with Gmail...');

    try {
      const res = await apiRequest('/sync/trigger', { method: 'POST' });
      if (res.success) {
        toast.success(`Sync Complete! Synced ${res.emailsProcessed} new emails.`, { id: toastId });
        // Force refresh components
        window.dispatchEvent(new Event('email_sync_complete'));
      } else {
        toast.error(res.error || 'Failed to complete synchronization.', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while triggering sync.', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#030712] px-6 z-10">
      <div className="flex items-center gap-4">
        {/* Account Sync status indicator dot */}
        <div className="flex items-center gap-2">
          <div className="relative flex h-3.5 w-3.5">
            {authStatus?.connected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </>
            ) : (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {authStatus?.connected ? `${authStatus.email} (Connected)` : 'Disconnected / Sandbox Mode'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Sync trigger button */}
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Inbox'}
        </button>

        {/* Notifications drawer trigger */}
        <button className="relative p-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
        </button>
      </div>
    </header>
  );
}
