import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import CreateMeeting from './pages/CreateMeeting';
import MeetingDetail from './pages/MeetingDetail';
import CreateGroupMeeting from './pages/CreateGroupMeeting';
import CreateLiveMeeting from './pages/CreateLiveMeeting';
import LiveMeeting from './pages/LiveMeeting';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import OwlSplash from './components/OwlSplash';
import { OrganizationProvider } from './contexts/OrganizationContext';


function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1600); // 1.6s splash
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <OwlSplash />;
  }

  return (
    <OrganizationProvider>
      <Router>
        <Routes>
          {/* Landing Route */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Routes */}
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-meeting"
            element={
              <ProtectedRoute>
                <CreateMeeting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-group-meeting"
            element={
              <ProtectedRoute>
                <CreateGroupMeeting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings/:id"
            element={
              <ProtectedRoute>
                <MeetingDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-live-meeting"
            element={
              <ProtectedRoute>
                <CreateLiveMeeting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live-meeting/:id"
            element={
              <ProtectedRoute>
                <LiveMeeting />
              </ProtectedRoute>
            }
          />

          {/* 404 Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </OrganizationProvider>
  );
}

export default App;
