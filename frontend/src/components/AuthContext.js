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

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const userData = await getCurrentUser();
          setCurrentUser(userData);
        } catch (err) {
          console.error("Auth check failed:", err);
          localStorage.removeItem('token');
          localStorage.removeItem('isHost');
          setCurrentUser(null);
          setError("Your session has expired. Please log in again.");
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('isHost', userData.is_host);
    setCurrentUser(userData);
    setError(null);
    
    // Redirect based on user type
    if (userData.is_host) {
      navigate('/host/dashboard');
    } else if (userData.event_id) {
      navigate(`/guest/event/${userData.event_id}`);
    } else {
      navigate('/');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isHost');
    setCurrentUser(null);
    navigate('/');
  };

  const updateUser = (updatedUserData) => {
    setCurrentUser(prev => ({
      ...prev,
      ...updatedUserData
    }));
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
