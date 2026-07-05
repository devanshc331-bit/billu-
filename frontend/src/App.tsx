import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell.js';
import Dashboard from './routes/Dashboard.js';
import ReviewQueue from './routes/ReviewQueue.js';
import Emails from './routes/Emails.js';
import Rules from './routes/Rules.js';
import Integrations from './routes/Integrations.js';
import Logs from './routes/Logs.js';
import Analytics from './routes/Analytics.js';
import Settings from './routes/Settings.js';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/review" element={<ReviewQueue />} />
          <Route path="/emails" element={<Emails />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
