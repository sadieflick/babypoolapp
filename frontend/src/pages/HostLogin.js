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
        // Generate a simple token based on timestamp for frontend auth
        const token = Date.now().toString();
        console.log("Login successful, token generated, calling login function");
        login(response, token);
        // Navigate is handled in AuthContext.login method
        
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
