import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import Generator from './pages/Generator';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CommunityPool from './pages/CommunityPool';
import Settings from './pages/Settings';
import AuthCallback from './pages/AuthCallback';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Music2, User, Settings as SettingsIcon, Crown, Users } from 'lucide-react';

function Navigation() {
  const location = useLocation();
  const { user, isAuthenticated, signOut, userTier } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Generate', icon: Music2 },
    { path: '/dashboard', label: 'Dashboard', icon: Music2 },
    { path: '/community-pool', label: 'Pool', icon: Users },
  ];

  const userItems = [
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav className="bg-carbón-dark border-b border-cian/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cian to-magenta flex items-center justify-center">
                <Music2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cian to-magenta bg-clip-text text-transparent">
                Son1k
              </span>
            </Link>

            {isAuthenticated && (
              <div className="flex gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${isActive(item.path)
                        ? 'bg-cian/20 text-cian'
                        : 'text-gray-400 hover:text-white hover:bg-carbón'
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {userTier?.tier && userTier.tier !== 'FREE' && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">{userTier.tier}</span>
                  </div>
                )}

                <div className="flex gap-1">
                  {userItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        p-2 rounded-lg transition-all
                        ${isActive(item.path)
                          ? 'bg-cian/20 text-cian'
                          : 'text-gray-400 hover:text-white hover:bg-carbón'
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5" />
                    </Link>
                  ))}
                </div>

                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/pricing"
                className="px-4 py-2 bg-gradient-to-r from-cian to-magenta text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-carbón flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-cian border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = '/pricing';
    return null;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-carbón">
        <Routes>
          <Route path="/" element={<Generator />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/community-pool" element={
            <ProtectedRoute>
              <CommunityPool />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="bottom-center" />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
