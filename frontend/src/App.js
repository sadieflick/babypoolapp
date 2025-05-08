import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ThemeProvider } from "./components/ThemeContext";

// Pages
import WelcomePage from "./pages/WelcomePage";
import HostLogin from "./pages/HostLogin";
import HostRegistration from "./pages/HostRegistration";
import GuestLogin from "./pages/GuestLogin";
import GuestLanding from "./pages/GuestLanding";
import DateGuessing from "./pages/DateGuessing";
import TimeGuessing from "./pages/TimeGuessing";
import NameGuessing from "./pages/NameGuessing";
import MyGuesses from "./pages/MyGuesses";
import HostDashboard from "./pages/HostDashboard";
import EventSettings from "./pages/EventSettings";
import GuestInfo from "./pages/GuestInfo";
import EventCreation from "./pages/EventCreation";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Protected route component
const ProtectedRoute = ({ children, requireHost }) => {
  // Use useEffect to ensure this check happens after any redirects
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Use null for initial state
  const [isChecking, setIsChecking] = useState(true);
  const [isHostUser, setIsHostUser] = useState(false);

  // Use useAuth for consistent authentication state
  const {
    currentUser,
    isAuthenticated: contextIsAuthenticated,
    loading: authLoading,
  } = useAuth();

  useEffect(() => {
    const checkAuth = () => {
      // Don't make decisions until AuthContext has finished loading
      if (authLoading) {
        console.log("AuthContext still loading, waiting...");
        return;
      }

      const token = localStorage.getItem("token");
      const isHost = localStorage.getItem("isHost") === "true";
      const savedUser = localStorage.getItem("currentUser");

      // Add debug logging
      console.log("ProtectedRoute check:", {
        token: !!token,
        isHost,
        requireHost,
        hasUser: !!savedUser,
        contextUser: !!currentUser,
        contextAuth: contextIsAuthenticated,
        path: window.location.pathname,
        authLoading,
      });

      // Priority order: AuthContext state > localStorage
      if (contextIsAuthenticated && currentUser) {
        console.log("Authentication confirmed from context");
        setIsAuthenticated(true);
        setIsHostUser(currentUser.is_host);
        setIsChecking(false);
      } else if (token && savedUser) {
        console.log("Authentication confirmed from localStorage");
        setIsAuthenticated(true);
        setIsHostUser(isHost);
        setIsChecking(false);
      } else {
        console.log("Not authenticated");
        setIsAuthenticated(false);
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [currentUser, contextIsAuthenticated, requireHost, authLoading]);

  if (isChecking || authLoading || isAuthenticated === null) {
    return <div className="loading">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to home");
    return <Navigate to="/" replace />;
  }

  if (requireHost && !isHostUser) {
    console.log(
      "Host access required but user is not a host, redirecting to home",
    );
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
                <Route path="/auth/guest_login" element={<GuestLogin />} />

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