import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCurrentUser } from '../utils/api';

// Create the context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Restore user from localStorage on initial load and set as temporary state
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
    setLoading(false);
  }, []);

  useEffect(() => {
    // Check if user is already logged in and verify token with backend
    const checkAuth = async () => {
      if (loading) return; // Wait until initial load is complete
      
      const token = localStorage.getItem('token');
      
      if (token && currentUser) {
        try {
          // First verify if token is valid
          const verifyResponse = await axios.get('/auth/verify-token', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            withCredentials: true
          });
          
          if (verifyResponse.data.valid) {
            // If token is valid, get the latest user data
            const userData = await getCurrentUser();
            setCurrentUser(userData);
            // Save updated user data to localStorage
            localStorage.setItem('currentUser', JSON.stringify(userData));
          } else {
            // If token is invalid but we have a refresh token, try to refresh
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              try {
                const refreshResponse = await axios.post('/auth/token/refresh', {}, {
                  headers: {
                    'Authorization': `Bearer ${refreshToken}`
                  },
                  withCredentials: true
                });
                
                // Store the new access token
                localStorage.setItem('token', refreshResponse.data.access_token);
                
                // Fetch user data with new token
                const userData = await getCurrentUser();
                setCurrentUser(userData);
                localStorage.setItem('currentUser', JSON.stringify(userData));
              } catch (refreshErr) {
                throw new Error('Token refresh failed');
              }
            } else {
              throw new Error('No refresh token available');
            }
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          // Clear all auth data
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('isHost');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
          setError("Your session has expired. Please log in again.");
        }
      }
    };
    
    checkAuth();
  }, [currentUser, loading]);

  const login = (userData, accessToken, refreshToken = null) => {
    console.log("Login called with userData:", userData);
    
    if (!accessToken) {
      console.error("No access token provided during login");
      setError("Authentication failed. Please try again.");
      return;
    }
    
    // Store tokens
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    
    // Store user data
    localStorage.setItem('isHost', userData.is_host || false);
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

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      // Call the logout API endpoint to invalidate server-side tokens
      await axios.post('/auth/logout', {}, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        withCredentials: true
      });
    } catch (err) {
      console.error('Logout error:', err);
      // Continue with local logout even if server-side logout fails
    } finally {
      // Clean up all local storage items
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token'); 
      localStorage.removeItem('isHost');
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      navigate('/');
    }
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
