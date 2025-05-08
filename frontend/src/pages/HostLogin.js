import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { loginHost } from '../utils/api';

const HostLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log("Host login form submitted");
    
    if (!email || !password) {
      setError('Please enter email and password');
      setLoading(false);
      return;
    }
    
    try {
      console.log("Attempting to login with email:", email);
      const response = await loginHost(email, password);
      
      console.log("Login response:", response);
      
      if (response.error) {
        setError(response.error);
      } else {
        // Extract tokens from response and store them
        const { access_token, refresh_token } = response;
        
        // Delete tokens from user object before storing in AuthContext to avoid duplication
        const userData = { ...response };
        delete userData.access_token;
        delete userData.refresh_token;
        
        // Store tokens in localStorage
        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        
        console.log("Login successful, tokens received, calling login function");
        // Pass user data to auth context
        login(userData, access_token);
        
        // Force navigation to dashboard as a backup
        setTimeout(() => {
          console.log("Backup navigation to dashboard");
          if (window.location.pathname !== '/host/dashboard') {
            navigate('/host/dashboard');
          }
        }, 500);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h1>Host Login</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="auth-links">
          <Link to="/host/register">Don't have an account? Register</Link>
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default HostLogin;
