import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './Sidebar.js';
import Header from './Header.js';

export default function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030712] text-slate-100 font-sans">
      {/* Collapsible sidebar */}
      <Sidebar />

      {/* Main app body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto bg-[#070b19] p-6">
          <Outlet />
        </main>
      </div>

      {/* Toast notifications drawer */}
      <Toaster position="bottom-right" theme="dark" closeButton />
    </div>
  );
}
