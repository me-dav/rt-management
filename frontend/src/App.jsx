import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Residents  from './pages/Resident';
import Houses     from './pages/Houses';
import History    from './pages/History';
import Payments   from './pages/Payments';
import Expenses   from './pages/Expenses';
import PaymentForm from './pages/PaymentForm';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className="text-sm text-gray-500">Memuat...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/payment'} replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/dashboard' : '/payment'} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />

      <Route path="/dashboard" element={<PrivateRoute roles={['admin']}><Dashboard /></PrivateRoute>} />
      <Route path="/residents" element={<PrivateRoute roles={['admin']}><Residents /></PrivateRoute>} />
      <Route path="/houses"    element={<PrivateRoute roles={['admin']}><Houses /></PrivateRoute>} />
      <Route path="/history"   element={<PrivateRoute roles={['admin']}><History /></PrivateRoute>} />
      <Route path="/payments"  element={<PrivateRoute roles={['admin']}><Payments /></PrivateRoute>} />
      <Route path="/expenses"  element={<PrivateRoute roles={['admin']}><Expenses /></PrivateRoute>} />

      <Route path="/payment"   element={<PrivateRoute roles={['resident']}><PaymentForm /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', fontSize: '14px' },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}