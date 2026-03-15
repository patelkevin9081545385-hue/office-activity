import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmailVerificationPending from './pages/EmailVerificationPending';
import EmailVerified from './pages/EmailVerified';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/Overview';
import Team from './pages/Team';
import Settings from './pages/Settings';

function App() {
  // Simple auth check for MVP
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email-pending" element={<EmailVerificationPending />} />
        <Route path="/email-verified" element={<EmailVerified />} />

        {/* Protected dashboard routes */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />}
        >
          <Route index element={<Overview />} />
          <Route path="team" element={<Team />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;

