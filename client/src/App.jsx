import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import MyShelf from './pages/MyShelf';
import SearchBooks from './pages/SearchBooks';
import RateReview from './pages/RateReview';
import Onboarding from './pages/Onboarding';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  // Force new users through onboarding before accessing the app
  if (user.onboardingComplete === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function OnboardingRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  // Already completed — don't let them re-enter the wizard
  if (user.onboardingComplete) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/home" /> : <Login />} />
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/home" />} />
        <Route path="home" element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="my-shelf" element={<MyShelf />} />
        <Route path="search" element={<SearchBooks />} />
        <Route path="book/:id" element={<RateReview />} />
      </Route>
    </Routes>
  );
}
