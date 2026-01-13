import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Role, User } from './types';
import Home from './pages/Home';
import MasterLogin from './pages/auth/MasterLogin';
import AdminLogin from './pages/auth/AdminLogin';
import VoterLogin from './pages/auth/VoterLogin';
import VoterRegister from './pages/auth/VoterRegister';
import MasterDashboard from './pages/master/MasterDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ElectionControl from './pages/admin/ElectionControl';
import VoterDashboard from './pages/voter/VoterDashboard';
import ElectionView from './pages/voter/ElectionView';

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}
const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('univote_session');
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('univote_session', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('univote_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Protected Route ---
const ProtectedRoute = ({ children, roles }: React.PropsWithChildren<{ roles: Role[] }>) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Initializing Secure Session...</p>
        </div>
      </div>
    );
  }

  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// --- Main App ---
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/master-login" element={<MasterLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/voter-login" element={<VoterLogin />} />
          <Route path="/voter/register" element={<VoterRegister />} />

          {/* Master */}
          <Route path="/master/dashboard" element={
            <ProtectedRoute roles={[Role.MASTER]}><MasterDashboard /></ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={[Role.ADMIN]}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/election/:electionId" element={
            <ProtectedRoute roles={[Role.ADMIN]}><ElectionControl /></ProtectedRoute>
          } />

          {/* Voter */}
          <Route path="/voter/dashboard" element={
            <ProtectedRoute roles={[Role.VOTER]}><VoterDashboard /></ProtectedRoute>
          } />
          <Route path="/voter/election/:electionId" element={
            <ProtectedRoute roles={[Role.VOTER]}><ElectionView /></ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" toastOptions={{
          className: 'bg-white text-gray-800 shadow-lg rounded-lg border border-slate-100',
          duration: 3000,
          style: {
            padding: '16px',
            color: '#1e293b',
          },
        }}/>
      </HashRouter>
    </AuthProvider>
  );
}