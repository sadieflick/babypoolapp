import React, { useState } from 'react';
import { selectEvent } from '../utils/api';
import { useAuth } from './AuthContext';

/**
 * Name-only form component for simplified guest login
 * This is a standalone component to avoid state issues in the parent component
 */
const NameOnlyForm = ({ eventId, eventTitle, onBack, onError }) => {
  const [nameOnly, setNameOnly] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  console.log("🔵 FRONTEND - NameOnlyForm mounted with:", { eventId, eventTitle });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!nameOnly.trim()) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }
    
    try {
      console.log("🔵 FRONTEND - NameOnlyForm: Submitting with:", { 
        event_id: eventId, 
        nickname: nameOnly 
      });
      
      const response = await selectEvent({
        event_id: eventId,
        nickname: nameOnly
      });
      
      console.log("🔵 FRONTEND - NameOnlyForm: Response:", response);
      
      if (response.status === 'need_name_only') {
        // Still in name-only mode, but need a different name
        setError(response.message || 'Please provide a more specific name');
      } else if (response.error) {
        setError(response.error);
        // Bubble up the error to parent if needed
        if (onError) onError(response.error);
      } else if (response.status === 'logged_in') {
        // Extract tokens from response
        const { access_token, refresh_token } = response;
        
        // Remove tokens from user data before passing it to AuthContext
        const userData = { ...response };
        delete userData.access_token;
        delete userData.refresh_token;
        
        // Ensure event_id is a number
        if (userData.event_id && typeof userData.event_id === 'string') {
          userData.event_id = parseInt(userData.event_id, 10);
        }
        
        // Pass both tokens to the login method - this will handle the redirect
        login(userData, access_token, refresh_token);
      } else if (response.status === 'need_user_info') {
        // Return the response to parent to handle the form change
        if (onError) onError(null, response);
      }
    } catch (err) {
      console.error("Name-only form error:", err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Who Are You?</h1>
      <p>For: {eventTitle || 'Baby Shower Event'}</p>
      <p>Just enter your name to get started</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="nameOnly">Your Name</label>
          <input
            type="text"
            id="nameOnly"
            value={nameOnly}
            onChange={(e) => setNameOnly(e.target.value)}
            placeholder="Enter your name"
            required
            autoFocus
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Joining...' : 'Continue'}
        </button>
        
        <button 
          type="button" 
          className="btn btn-link"
          onClick={onBack}
        >
          Back
        </button>
      </form>
    </>
  );
};

export default NameOnlyForm;