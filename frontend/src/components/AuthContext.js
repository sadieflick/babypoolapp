import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/api';

// Create the context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Restore user from localStorage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing saved user:", e);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const userData = await getCurrentUser();
          setCurrentUser(userData);
          // Save user data to localStorage
          localStorage.setItem('currentUser', JSON.stringify(userData));
        } catch (err) {
          console.error("Auth check failed:", err);
          localStorage.removeItem('token');
          localStorage.removeItem('isHost');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
          setError("Your session has expired. Please log in again.");
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = (userData, token) => {
    console.log("Login called with userData:", userData);
    localStorage.setItem('token', token);
    localStorage.setItem('isHost', userData.is_host);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setCurrentUser(userData);
    setError(null);
    
    // Redirect based on user type
    if (userData.is_host) {
      console.log("Redirecting to host dashboard");
      navigate('/host/dashboard');
    } else if (userData.event_id) {
      console.log("Redirecting to guest event");
      navigate(`/guest/event/${userData.event_id}`);
    } else if (userData.events && userData.events.length > 0) {
      // If guest has multiple events, let them choose which one to view
      console.log("Redirecting to select event");
      navigate('/guest/select-event');
    } else {
      console.log("Redirecting to home");
      navigate('/');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isHost');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    navigate('/');
  };

  const updateUser = (updatedUserData) => {
    const updated = {...currentUser, ...updatedUserData};
    setCurrentUser(updated);
    localStorage.setItem('currentUser', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        loading, 
        error,
        isAuthenticated: !!currentUser,
        isHost: currentUser?.is_host || false,
        login, 
        logout,
        updateUser,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
