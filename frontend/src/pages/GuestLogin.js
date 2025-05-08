import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginGuest, findEventByCode, searchEventByMother } from '../utils/api';
import { useAuth } from '../components/AuthContext';

const GuestLogin = () => {
  const [loginStep, setLoginStep] = useState('initial'); // 'initial', 'event-code', 'search-mother', 'user-info'
  const [email, setEmail] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('venmo');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

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
        
        if (response.status === 'logged_in') {
          console.log("🔵 FRONTEND - Guest Login: Successfully logged in, proceeding to redirect");
          // Extract tokens from response
          const { access_token, refresh_token } = response;
          
          console.log("Email login successful:", { 
            status: response.status, 
            user_id: response.user_id,
            has_access_token: !!access_token,
            has_refresh_token: !!refresh_token
          });
          
          // Remove tokens from user data before passing it to AuthContext
          const userData = { ...response };
          delete userData.access_token;
          delete userData.refresh_token;
          
          console.log("Processing user data before login:", {
            id: userData.user_id,
            is_host: userData.is_host,
            event_id: userData.event_id,
            events_length: userData.events ? userData.events.length : 0
          });
          
          // Ensure event_id is a number
          if (userData.event_id && typeof userData.event_id === 'string') {
            userData.event_id = parseInt(userData.event_id, 10);
          }
          
          // Pass both tokens to the login method - this will handle the redirect inside login
          login(userData, access_token, refresh_token);
          
          // Login method will handle the redirect, so we don't need to navigate here
          // The duplicate navigation was causing race conditions
        } else if (response.status === 'need_event') {
          console.log("Email login requires event selection");
          setLoginStep('event-code');
        } else if (response.status === 'need_profile_info') {
          console.log("Email login requires profile completion");
          // Handle profile completion
          setLoginStep('user-info');
          setSelectedEvent({ id: response.event_id });
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
      console.log("🔵 FRONTEND - Guest Login: Finding event by code:", eventCode);
      const eventResponse = await findEventByCode(eventCode);
      
      console.log("🔵 FRONTEND - Guest Login: Event search response:", eventResponse);
      
      if (eventResponse.error) {
        console.error("Event code error:", eventResponse.error);
        setError(eventResponse.error);
      } else {
        console.log("Event found, attempting login with event code");
        const response = await loginGuest({
          login_type: 'event_code',
          event_code: eventCode,
          email
        });
        
        console.log("Event code login response:", response);
        
        if (response.status === 'logged_in') {
          // Extract tokens from response
          const { access_token, refresh_token } = response;
          
          console.log("Event code login successful:", { 
            status: response.status, 
            event_id: response.event_id,
            has_access_token: !!access_token,
            has_refresh_token: !!refresh_token
          });
          
          // Remove tokens from user data before passing it to AuthContext
          const userData = { ...response };
          delete userData.access_token;
          delete userData.refresh_token;
          
          console.log("Processing user data before login:", {
            id: userData.user_id,
            is_host: userData.is_host,
            event_id: userData.event_id,
            events_length: userData.events ? userData.events.length : 0
          });
          
          // Ensure event_id is a number
          if (userData.event_id && typeof userData.event_id === 'string') {
            userData.event_id = parseInt(userData.event_id, 10);
          }
          
          // Pass both tokens to the login method - this will handle the redirect
          login(userData, access_token, refresh_token);
          
          // Login method will handle the redirect, so we don't need to navigate here
        } else if (response.status === 'need_user_info') {
          console.log("Event code login requires user info");
          setLoginStep('user-info');
          setSelectedEvent({ 
            id: response.event_id,
            title: response.event_title
          });
        }
      }
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
      
      if (response.status === 'logged_in') {
        // Extract tokens from response
        const { access_token, refresh_token } = response;
        
        console.log("Guest login successful:", { 
          status: response.status, 
          event_id: response.event_id,
          has_access_token: !!access_token,
          has_refresh_token: !!refresh_token
        });
        
        // Remove tokens from user data before passing it to AuthContext
        const userData = { ...response };
        delete userData.access_token;
        delete userData.refresh_token;
        
        console.log("Processing user data before login:", {
          id: userData.user_id,
          is_host: userData.is_host,
          event_id: userData.event_id,
          events_length: userData.events ? userData.events.length : 0
        });
        
        // Ensure event_id is a number
        if (userData.event_id && typeof userData.event_id === 'string') {
          userData.event_id = parseInt(userData.event_id, 10);
        }
        
        // Pass both tokens to the login method - this will handle the redirect
        login(userData, access_token, refresh_token);
      } else if (response.error) {
        setError(response.error);
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
        {loginStep === 'user-info' && renderUserInfoForm()}
        
        <div className="auth-links">
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default GuestLogin;
