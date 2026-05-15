import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Lazy-loaded pages
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ProjectView = React.lazy(() => import('./pages/ProjectView'));
const SettingsPage = React.lazy(() => import('./pages/Settings'));

// Auth wrapper: redirects to /login if not authenticated
function AuthRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// Guest wrapper: redirects to /dashboard if already authenticated
function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Root redirect
function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
            <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />

          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <AuthRoute>
                <Dashboard />
              </AuthRoute>
            }
          />

          <Route
            path="/project/:id"
            element={
              <AuthRoute>
                <ProjectView />
              </AuthRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <AuthRoute>
                <SettingsPage />
              </AuthRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}
