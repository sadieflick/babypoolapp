import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getEvent } from '../utils/api';
import { format, differenceInDays } from 'date-fns';

const GuestLanding = () => {
  const { eventId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        console.log("GuestLanding - Fetching event with ID:", eventId);
        const token = localStorage.getItem('token');
        console.log("GuestLanding - Token exists:", !!token);
        
        const data = await getEvent(eventId);
        console.log("GuestLanding - Event data loaded:", data);
        setEvent(data);
      } catch (err) {
        console.error("GuestLanding - Error loading event:", err);
        setError('Failed to load event details');
        
        // Check for auth errors
        if (err.response && err.response.status === 401) {
          console.error("Authentication failed when loading event - token may be invalid");
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId) {
      fetchEvent();
    } else {
      console.error("GuestLanding - No event ID found in URL params");
      setError('No event ID provided');
      setLoading(false);
    }
  }, [eventId]);
  
  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }
  
  if (error || !event) {
    return <div className="error-container">{error || 'Event not found'}</div>;
  }
  
  // Calculate days until the event and due date
  const today = new Date();
  const eventDate = new Date(event.event_date);
  const dueDate = new Date(event.due_date);
  
  const daysUntilEvent = differenceInDays(eventDate, today);
  const daysUntilDueDate = differenceInDays(dueDate, today);
  
  return (
    <div className="guest-landing">
      <div className="event-banner" style={{ backgroundImage: event.image_path ? `url(${event.image_path})` : 'none' }}>
        <div className="event-banner-content">
          <h1>{event.title}</h1>
          {event.image_path && <img src={event.image_path} alt="Event" className="event-image" />}
          
          <div className="event-dates">
            <div className="date-item">
              <span className="date-label">Baby Shower:</span>
              <span className="date-value">{format(eventDate, 'MMMM d, yyyy')}</span>
              {daysUntilEvent > 0 && <span className="date-countdown">{daysUntilEvent} days to go</span>}
            </div>
            
            <div className="date-item">
              <span className="date-label">Due Date:</span>
              <span className="date-value">{format(dueDate, 'MMMM d, yyyy')}</span>
              {daysUntilDueDate > 0 && <span className="date-countdown">{daysUntilDueDate} days to go</span>}
            </div>
          </div>
        </div>
      </div>
      
      <div className="game-options">
        <h2>When will the baby be born?</h2>
        <p className="game-description">
          Make your guesses for a chance to win! Each guess costs ${event.guess_price.toFixed(2)}.
        </p>
        
        <div className="game-buttons">
          <Link to={`/guest/event/${eventId}/date-guess`} className="game-button">
            <div className="button-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <span>Guess the Date</span>
          </Link>
          
          <Link to={`/guest/event/${eventId}/time-guess`} className="game-button">
            <div className="button-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <span>Guess the Time</span>
          </Link>
          
          <Link to={`/guest/event/${eventId}/my-guesses`} className="game-button">
            <div className="button-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <span>My Guesses</span>
          </Link>
        </div>
      </div>
      
      {event.name_game_enabled && (
        <div className="name-game">
          <h2>{event.baby_name_revealed ? 'Guess the Baby\'s Name' : 'Suggest a Baby Name'}</h2>
          <Link to={`/guest/event/${eventId}/name-guess`} className="btn btn-primary">
            {event.baby_name_revealed ? 'Make a Guess' : 'Suggest a Name'}
          </Link>
        </div>
      )}
      
      {event.shower_link && (
        <div className="event-links">
          <h3>Event Links</h3>
          <a href={event.shower_link} target="_blank" rel="noopener noreferrer" className="external-link">
            Baby Shower Website
          </a>
        </div>
      )}
      
      {event.host && event.show_host_email && (
        <div className="host-contact">
          <h3>Contact Host</h3>
          <a href={`mailto:${event.host.email}`} className="external-link">
            Email {event.host.name}
          </a>
        </div>
      )}
    </div>
  );
};

export default GuestLanding;
