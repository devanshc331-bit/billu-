import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  Mail,
  GitBranch,
  Plug,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/review', label: 'Review Queue', icon: Inbox },
  { to: '/emails', label: 'Email Archive', icon: Mail },
  { to: '/rules', label: 'Triage Rules', icon: GitBranch },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/logs', label: 'System Logs', icon: FileText },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-slate-800 bg-[#030712] transition-all duration-300 ease-in-out z-20",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Sidebar Header Brand */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent truncate">
              Antigravity Triage
            </span>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-slate-800 text-white font-semibold shadow-inner border border-slate-700/50"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/50"
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              
              {/* Tooltip for collapsed view */}
              {collapsed && (
                <div className="absolute left-full ml-4 hidden rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-100 group-hover:block whitespace-nowrap shadow-xl z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-800 bg-[#030712] text-slate-400 hover:text-white shadow-lg transition-transform"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Footer / User Profile Summary */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex-shrink-0 border border-slate-700 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=40&h=40&q=80" alt="avatar" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <p className="text-sm font-semibold text-slate-200">Demo User</p>
              <p className="text-xs text-slate-500 truncate">demo.user@gmail.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
