import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./lib/auth";
import AppShell from "./components/AppShell";
import WorldNews from './pages/WorldNews';
import NewsFeed from './pages/NewsFeed';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Verify from "./pages/Verify";
import Result from "./pages/Result";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSources from "./pages/admin/AdminSources";
import AdminReports from "./pages/admin/AdminReports";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import Chat from "./pages/Chat";

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Loading…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminProtected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Loading…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin" && user.role !== "superadmin")
    return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/news" element={<NewsFeed />} />
            <Route path="/login" element={<Login />} />

            {/* User App */}
            <Route path="/app" element={<Protected><AppShell /></Protected>}>
              <Route index element={<Dashboard />} />
              <Route path="verify" element={<Verify />} />
              <Route path="world-news" element={<WorldNews />} />
              <Route path="result/:id" element={<Result />} />
              <Route path="history" element={<History />} />
              <Route path="world" element={<WorldNews />} />
              <Route path="chat" element={<Chat />} />
              <Route path="chat/:id" element={<Chat />} />
            </Route>

            {/* Admin App */}
            <Route
              path="/admin"
              element={
                <AdminProtected>
                  <AdminLayout />
                </AdminProtected>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="verifications" element={<AdminLogs />} />
              <Route path="sources" element={<AdminSources />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
