import React, { useState, useEffect, useReducer } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginGuest, selectEvent, searchEventByMother } from '../utils/api';
import { useAuth } from '../components/AuthContext';
import NameOnlyForm from '../components/NameOnlyForm';

// State reducer pattern for more consistent state updates
const initialState = {
  step: 'initial',                // 'initial', 'event-code', 'search-mother', 'name-only', 'user-info'
  email: '',
  eventCode: '',
  searchTerm: '',
  firstName: '',
  lastName: '',
  nickname: '',
  nameOnly: '',
  phone: '',
  paymentMethod: 'venmo',
  events: [],
  selectedEvent: null,
  error: '',
  loading: false,
  loginResponse: null
};

function reducer(state, action) {
  console.log("🔵 REDUCER - Action:", action.type, action.payload);
  
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SELECTED_EVENT':
      return { ...state, selectedEvent: action.payload };
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'SET_LOGIN_RESPONSE':
      return { ...state, loginResponse: action.payload };
    case 'HANDLE_NEED_NAME_ONLY':
      console.log("🔵 REDUCER - Handling need_name_only", action.payload);
      return { 
        ...state, 
        step: 'name-only',
        selectedEvent: {
          id: action.payload.event_id,
          title: action.payload.event_title
        },
        loading: false
      };
    case 'HANDLE_NEED_USER_INFO':
      return { 
        ...state, 
        step: 'user-info',
        selectedEvent: {
          id: action.payload.event_id,
          title: action.payload.event_title
        },
        loading: false
      };
    case 'RESET_FORM':
      return { ...initialState };
    default:
      return state;
  }
}

const GuestLogin = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Destructure state for easier access
  const { 
    step, email, eventCode, searchTerm, firstName, lastName, 
    nickname, nameOnly, phone, paymentMethod, events, 
    selectedEvent, error, loading, loginResponse 
  } = state;

  // Component lifecycle tracking
  useEffect(() => {
    console.log("🔵 FRONTEND - GuestLogin component mounted");
    return () => {
      console.log("🔵 FRONTEND - GuestLogin component unmounting");
    };
  }, []);

  // Handle login response changes
  useEffect(() => {
    if (!loginResponse) return;
    
    console.log("🔵 FRONTEND - Login response effect triggered:", loginResponse);
    
    if (loginResponse.status === 'logged_in') {
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
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_LOADING', payload: true });
    
    console.log("🔵 FRONTEND - Initial form submitted with email:", email || "(none)");
    
    if (email) {
      try {
        console.log("Attempting email login with:", { login_type: 'email', email });
        const response = await loginGuest({ 
          login_type: 'email',
          email 
        });
        
        console.log("🔵 FRONTEND - Email login response:", response);
        
        if (response.status === 'need_event') {
          dispatch({ type: 'SET_STEP', payload: 'event-code' });
        } else if (response.status === 'need_profile_info') {
          dispatch({ 
            type: 'HANDLE_NEED_USER_INFO', 
            payload: { 
              event_id: response.event_id,
              event_title: response.event_title || 'Event'
            } 
          });
        } else {
          dispatch({ type: 'SET_LOGIN_RESPONSE', payload: response });
        }
      } catch (err) {
        console.error("Email login error:", err);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: err.response?.data?.error || 'Login failed. Please try again.' 
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      console.log("No email provided, proceeding to event code entry");
      dispatch({ type: 'SET_STEP', payload: 'event-code' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleEventCodeSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_LOADING', payload: true });
    
    console.log("🔵 FRONTEND - Event code submitted:", eventCode);
    
    try {
      console.log("🔵 FRONTEND - Attempting login with event code:", eventCode);
      const response = await loginGuest({
        login_type: 'event_code',
        event_code: eventCode,
        email
      });
      
      console.log("🔵 FRONTEND - Event code login response:", response);
      
      // Process the response based on status
      if (response.status === 'need_name_only') {
        console.log("🔵 FRONTEND - Got need_name_only status, dispatching action");
        
        dispatch({
          type: 'HANDLE_NEED_NAME_ONLY',
          payload: {
            event_id: response.event_id,
            event_title: response.event_title
          }
        });
        
        console.log("🔵 FRONTEND - State after dispatch:", state);
      } else {
        dispatch({ type: 'SET_LOGIN_RESPONSE', payload: response });
      }
    } catch (err) {
      console.error("Event code login error:", err);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err.response?.data?.error || 'Event not found. Please check the code.' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleMotherSearchSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await searchEventByMother(searchTerm);
      
      if (response.status === 'events_found') {
        dispatch({ type: 'SET_EVENTS', payload: response.events });
      } else if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      }
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err.response?.data?.error || 'No events found with that name.' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleSelectEvent = (event) => {
    dispatch({ type: 'SET_SELECTED_EVENT', payload: event });
    dispatch({ type: 'SET_STEP', payload: 'user-info' });
  };

  const handleNameOnlySubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_LOADING', payload: true });
    
    if (!nameOnly.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter your name' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    try {
      console.log("🔵 FRONTEND - Submitting name-only form:", { 
        event_id: selectedEvent.id, 
        nickname: nameOnly 
      });
      
      const response = await selectEvent({
        event_id: selectedEvent.id,
        nickname: nameOnly
      });
      
      console.log("🔵 FRONTEND - Name-only response:", response);
      
      if (response.status === 'need_name_only') {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: response.message || 'Please provide a more specific name' 
        });
      } else if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      } else {
        dispatch({ type: 'SET_LOGIN_RESPONSE', payload: response });
      }
    } catch (err) {
      console.error("Name-only form error:", err);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err.response?.data?.error || 'Login failed. Please try again.' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleUserInfoSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_LOADING', payload: true });
    
    if (!firstName || !lastName) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter your first and last name' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    if (!email && !phone) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Please enter either your email or phone number' 
      });
      dispatch({ type: 'SET_LOADING', payload: false });
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
      
      console.log("🔵 FRONTEND - User info response:", response);
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      } else {
        dispatch({ type: 'SET_LOGIN_RESPONSE', payload: response });
      }
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err.response?.data?.error || 'Login failed. Please try again.' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
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
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', payload: e.target.value })}
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
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'event-code' })}
        >
          Enter Event Code
        </button>
        
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'search-mother' })}
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
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'eventCode', payload: e.target.value })}
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
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'initial' })}
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
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'searchTerm', payload: e.target.value })}
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
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'initial' })}
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

  const renderNameOnlyForm = () => {
    console.log("🔵 FRONTEND - Rendering NameOnlyForm with selectedEvent:", selectedEvent);
    
    if (selectedEvent) {
      return (
        <NameOnlyForm 
          eventId={selectedEvent.id} 
          eventTitle={selectedEvent.title}
          onBack={() => dispatch({ type: 'SET_STEP', payload: 'event-code' })}
          onError={(error, response) => {
            if (error) {
              dispatch({ type: 'SET_ERROR', payload: error });
            } else if (response && response.status === 'need_user_info') {
              dispatch({ 
                type: 'HANDLE_NEED_USER_INFO', 
                payload: {
                  event_id: response.event_id,
                  event_title: response.event_title
                } 
              });
            }
          }}
        />
      );
    }
    
    return (
      <>
        <h1>Who Are You?</h1>
        <p>Just enter your name to get started</p>
        
        <form onSubmit={handleNameOnlySubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nameOnly">Your Name</label>
            <input
              type="text"
              id="nameOnly"
              value={nameOnly}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'nameOnly', payload: e.target.value })}
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
            onClick={() => dispatch({ type: 'SET_STEP', payload: 'event-code' })}
          >
            Back
          </button>
        </form>
      </>
    );
  };

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
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'firstName', payload: e.target.value })}
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
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'lastName', payload: e.target.value })}
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
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'nickname', payload: e.target.value })}
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
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', payload: e.target.value })}
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
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'phone', payload: e.target.value })}
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
                onChange={() => dispatch({ type: 'SET_FIELD', field: 'paymentMethod', payload: 'venmo' })}
              />
              Venmo
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => dispatch({ type: 'SET_FIELD', field: 'paymentMethod', payload: 'cash' })}
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
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'initial' })}
        >
          Cancel
        </button>
      </form>
    </>
  );

  // Debug indicator
  const debugCurrentStep = () => (
    <div className="debug-info" style={{fontSize: '10px', color: '#666', marginTop: '10px', textAlign: 'center'}}>
      Current step: {step} 
      {selectedEvent && ` | Event ID: ${selectedEvent.id}`}
      {loginResponse && ` | Response status: ${loginResponse.status}`}
    </div>
  );

  // Render current form based on step
  const renderCurrentForm = () => {
    console.log("🔵 FRONTEND - Rendering current form for step:", step);
    
    switch(step) {
      case 'initial':
        return renderInitialForm();
      case 'event-code':
        return renderEventCodeForm();
      case 'search-mother':
        return renderMotherSearchForm();
      case 'name-only':
        return renderNameOnlyForm();
      case 'user-info':
        return renderUserInfoForm();
      default:
        return renderInitialForm();
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        {error && <div className="error-message">{error}</div>}
        
        {renderCurrentForm()}
        
        <div className="auth-links">
          <Link to="/">Back to Home</Link>
        </div>
        
        {debugCurrentStep()}
      </div>
    </div>
  );
};

export default GuestLogin;