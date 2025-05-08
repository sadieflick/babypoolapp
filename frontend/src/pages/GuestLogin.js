import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginGuest, findEventByCode, searchEventByMother, selectEvent } from '../utils/api';
import { useAuth } from '../components/AuthContext';

const GuestLogin = () => {
  const [loginStep, setLoginStep] = useState('initial'); // 'initial', 'event-code', 'search-mother', 'name-only', 'user-info'
  const [email, setEmail] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [nameOnly, setNameOnly] = useState(''); // For name-only step
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('venmo');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // State for storing the login response
  const [loginResponse, setLoginResponse] = useState(null);

  // Use effect to respond to login response changes
  useEffect(() => {
    if (!loginResponse) return;
    
    console.log("🔵 FRONTEND - useEffect triggered with loginResponse", loginResponse);
    
    if (loginResponse.status === 'need_name_only') {
      console.log("🔵 FRONTEND - Setting login step to name-only from useEffect");
      setLoginStep('name-only');
      setSelectedEvent({ 
        id: loginResponse.event_id,
        title: loginResponse.event_title
      });
    } else if (loginResponse.status === 'need_user_info') {
      console.log("🔵 FRONTEND - Setting login step to user-info from useEffect");
      setLoginStep('user-info');
      setSelectedEvent({ 
        id: loginResponse.event_id,
        title: loginResponse.event_title
      });
    } else if (loginResponse.status === 'logged_in') {
      const { access_token, refresh_token } = loginResponse;
      
      // Remove tokens from user data before passing it to AuthContext
      const userData = { ...loginResponse };
      delete userData.access_token;
      delete userData.refresh_token;
      
      // Ensure event_id is a number
      if (userData.event_id && typeof userData.event_id === 'string') {
        userData.event_id = parseInt(userData.event_id, 10);
      }
      
      // Pass both tokens to the login method - this will handle the redirect
      login(userData, access_token, refresh_token);
    }
  }, [loginResponse, login]);

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log("🔵 FRONTEND - Guest Login: Initial form submitted with email:", email || "(none)");
    
    if (email) {
      try {
        console.log("Attempting email login with:", { login_type: 'email', email });
        const response = await loginGuest({ 
          login_type: 'email',
          email 
        });
        
        console.log("🔵 FRONTEND - Guest Login: Email login response:", response);
        
        // Special cases that we want to handle directly instead of through useEffect
        if (response.status === 'need_event') {
          console.log("🔵 FRONTEND - Email login requires event selection");
          setLoginStep('event-code');
        } else if (response.status === 'need_profile_info') {
          console.log("🔵 FRONTEND - Email login requires profile completion");
          // Handle profile completion
          setLoginStep('user-info');
          setSelectedEvent({ id: response.event_id });
        } else {
          // For other responses, use the loginResponse state to trigger useEffect
          setLoginResponse(response);
        }
      } catch (err) {
        console.error("Email login error:", err);
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      console.log("No email provided, proceeding to event code entry");
      setLoginStep('event-code');
      setLoading(false);
    }
  };

  const handleEventCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log("Event code submitted:", eventCode);
    
    try {
      // Skip the findEventByCode step and go directly to login with event code
      // This prevents the two-step process that was causing issues
      console.log("🔵 FRONTEND - Guest Login: Attempting login with event code:", eventCode);
      const response = await loginGuest({
        login_type: 'event_code',
        event_code: eventCode,
        email
      });
      
      console.log("🔵 FRONTEND - Guest Login: Event code login response:", response);
      console.log("🔵 FRONTEND - Guest Login: Response status:", response.status);
      console.log("🔵 FRONTEND - Guest Login: Response type:", typeof response.status);
      
      // Debug the response object in more detail
      for (const key in response) {
        console.log(`🔵 FRONTEND - Response key: ${key}, value:`, response[key]);
      }
      
      // Set the login response which will trigger the useEffect
      setLoginResponse(response);
      
      // We'll let the useEffect handle the state changes and redirects
    } catch (err) {
      console.error("Event code login error:", err);
      setError(err.response?.data?.error || 'Event not found. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleMotherSearchSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await searchEventByMother(searchTerm);
      
      if (response.status === 'events_found') {
        setEvents(response.events);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No events found with that name.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setLoginStep('user-info');
  };

  const handleNameOnlySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!nameOnly.trim()) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }
    
    try {
      console.log("🔵 FRONTEND - Guest Login: Submitting name-only form:", { 
        event_id: selectedEvent.id, 
        nickname: nameOnly 
      });
      
      const response = await selectEvent({
        event_id: selectedEvent.id,
        nickname: nameOnly
      });
      
      console.log("🔵 FRONTEND - Guest Login: Name-only response:", response);
      
      // Special case for need_name_only status - we want to show error immediately
      if (response.status === 'need_name_only') {
        // Still in name-only mode, but need a different name
        setError(response.message || 'Please provide a more specific name');
      } else if (response.error) {
        setError(response.error);
      } else {
        // For other responses like logged_in or need_user_info, use the loginResponse state
        setLoginResponse(response);
      }
    } catch (err) {
      console.error("Name-only form error:", err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserInfoSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!firstName || !lastName) {
      setError('Please enter your first and last name');
      setLoading(false);
      return;
    }
    
    if (!email && !phone) {
      setError('Please enter either your email or phone number');
      setLoading(false);
      return;
    }
    
    try {
      const response = await loginGuest({
        event_id: selectedEvent.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        nickname,
        payment_method: paymentMethod
      });
      
      console.log("🔵 FRONTEND - Guest Login: User info response:", response);
      
      if (response.error) {
        setError(response.error);
      } else {
        // Use the loginResponse state for all other responses
        setLoginResponse(response);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInitialForm = () => (
    <>
      <h1>Guest Login</h1>
      <p>Enter your email to find your events or continue to search by event code or mother's name.</p>
      
      <form onSubmit={handleInitialSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email (Optional)</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Continue'}
        </button>
        
        <div className="auth-divider">or</div>
        
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => setLoginStep('event-code')}
        >
          Enter Event Code
        </button>
        
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => setLoginStep('search-mother')}
        >
          Search by Mother's Name
        </button>
      </form>
    </>
  );

  const renderEventCodeForm = () => (
    <>
      <h1>Enter Event Code</h1>
      <p>Enter the 4-digit code provided by the event host.</p>
      
      <form onSubmit={handleEventCodeSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="eventCode">Event Code</label>
          <input
            type="text"
            id="eventCode"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value)}
            placeholder="4-digit code"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Continue'}
        </button>
        
        <button 
          type="button" 
          className="btn btn-link"
          onClick={() => setLoginStep('initial')}
        >
          Back
        </button>
      </form>
    </>
  );

  const renderMotherSearchForm = () => (
    <>
      <h1>Search by Mother's Name</h1>
      <p>Enter the first or last name of the mother-to-be.</p>
      
      <form onSubmit={handleMotherSearchSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="searchTerm">Mother's Name</label>
          <input
            type="text"
            id="searchTerm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter name"
            required
            minLength={2}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
        
        <button 
          type="button" 
          className="btn btn-link"
          onClick={() => setLoginStep('initial')}
        >
          Back
        </button>
      </form>
      
      {events.length > 0 && (
        <div className="search-results">
          <h2>Search Results</h2>
          <ul className="events-list">
            {events.map(event => (
              <li key={event.id} className="event-item">
                <div className="event-info">
                  <h3>Mother-to-be: {event.mother_name}</h3>
                  <p>Hosted by: {event.host_name}</p>
                </div>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleSelectEvent(event)}
                >
                  Select
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  const renderNameOnlyForm = () => (
    <>
      <h1>Who Are You?</h1>
      {selectedEvent && <p>For: {selectedEvent.title || 'Baby Shower Event'}</p>}
      <p>Just enter your name to get started</p>
      
      <form onSubmit={handleNameOnlySubmit} className="auth-form">
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
          onClick={() => setLoginStep('event-code')}
        >
          Back
        </button>
      </form>
    </>
  );

  const renderUserInfoForm = () => (
    <>
      <h1>Complete Your Information</h1>
      {selectedEvent && <p>For: {selectedEvent.title || 'Baby Shower Event'}</p>}
      
      <form onSubmit={handleUserInfoSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="firstName">First Name*</label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">Last Name*</label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="nickname">Nickname (Optional)</label>
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter a nickname"
          />
        </div>
        
        {!email && (
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="phone">Phone Number (Required if no email)</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            required={!email}
          />
        </div>
        
        <div className="form-group">
          <label>Payment Method Preference</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="paymentMethod"
                value="venmo"
                checked={paymentMethod === 'venmo'}
                onChange={() => setPaymentMethod('venmo')}
              />
              Venmo
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
              />
              Cash
            </label>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Joining...' : 'Join Event'}
        </button>
        
        <button 
          type="button" 
          className="btn btn-link"
          onClick={() => setLoginStep('initial')}
        >
          Cancel
        </button>
      </form>
    </>
  );

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        {error && <div className="error-message">{error}</div>}
        
        {loginStep === 'initial' && renderInitialForm()}
        {loginStep === 'event-code' && renderEventCodeForm()}
        {loginStep === 'search-mother' && renderMotherSearchForm()}
        {loginStep === 'name-only' && renderNameOnlyForm()}
        {loginStep === 'user-info' && renderUserInfoForm()}
        
        <div className="auth-links">
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default GuestLogin;
