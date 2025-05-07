import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import { ThemeProvider } from './components/ThemeContext';

// Pages
import WelcomePage from './pages/WelcomePage';
import HostLogin from './pages/HostLogin';
import HostRegistration from './pages/HostRegistration';
import GuestLogin from './pages/GuestLogin';
import GuestLanding from './pages/GuestLanding';
import DateGuessing from './pages/DateGuessing';
import TimeGuessing from './pages/TimeGuessing';
import NameGuessing from './pages/NameGuessing';
import MyGuesses from './pages/MyGuesses';
import HostDashboard from './pages/HostDashboard';
import EventSettings from './pages/EventSettings';
import GuestInfo from './pages/GuestInfo';
import EventCreation from './pages/EventCreation';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Protected route component
const ProtectedRoute = ({ children, requireHost }) => {
  const token = localStorage.getItem('token');
  const isHost = localStorage.getItem('isHost') === 'true';
  const savedUser = localStorage.getItem('currentUser');
  
  // Add debug logging
  console.log("ProtectedRoute check:", { 
    token: !!token, 
    isHost, 
    requireHost, 
    hasUser: !!savedUser,
    path: window.location.pathname
  });
  
  if (!token || !savedUser) {
    console.log("Not authenticated, redirecting to home");
    return <Navigate to="/" replace />;
  }
  
  if (requireHost && !isHost) {
    console.log("Host access required but user is not a host, redirecting to home");
    return <Navigate to="/" replace />;
  }
  
  console.log("Access granted to protected route");
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/host/login" element={<HostLogin />} />
                <Route path="/host/register" element={<HostRegistration />} />
                <Route path="/guest/login" element={<GuestLogin />} />
                
                {/* Protected guest routes */}
                <Route 
                  path="/guest/event/:eventId" 
                  element={
                    <ProtectedRoute>
                      <GuestLanding />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/guest/event/:eventId/date-guess" 
                  element={
                    <ProtectedRoute>
                      <DateGuessing />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/guest/event/:eventId/time-guess" 
                  element={
                    <ProtectedRoute>
                      <TimeGuessing />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/guest/event/:eventId/name-guess" 
                  element={
                    <ProtectedRoute>
                      <NameGuessing />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/guest/event/:eventId/my-guesses" 
                  element={
                    <ProtectedRoute>
                      <MyGuesses />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Protected host routes */}
                <Route 
                  path="/host/dashboard" 
                  element={
                    <ProtectedRoute requireHost={true}>
                      <HostDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/host/event/create" 
                  element={
                    <ProtectedRoute requireHost={true}>
                      <EventCreation />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/host/event/:eventId/settings" 
                  element={
                    <ProtectedRoute requireHost={true}>
                      <EventSettings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/host/event/:eventId/guest/:guestId" 
                  element={
                    <ProtectedRoute requireHost={true}>
                      <GuestInfo />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
