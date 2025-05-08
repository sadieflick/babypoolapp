import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

const WelcomePage = () => {
  const { isAuthenticated, isHost, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if logged in
    if (isAuthenticated) {
      if (isHost) {
        navigate('/host/dashboard');
      } else if (currentUser?.events?.length === 1) {
        navigate(`/guest/event/${currentUser.events[0].id}`);
      }
      // If they have multiple events, they can stay on this page to choose
    }
  }, [isAuthenticated, isHost, currentUser, navigate]);

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 className="welcome-title">Welcome to Baby Pool</h1>
        <p className="welcome-description">
          A fun way to guess when the baby will arrive and win prizes!
        </p>
        
        {isAuthenticated ? (
          isHost ? (
            <div className="welcome-buttons">
              <Link to="/host/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="welcome-events">
              <h2>Your Events</h2>
              {currentUser?.events?.length > 0 ? (
                <ul className="events-list">
                  {currentUser.events.map(event => (
                    <li key={event.id}>
                      <Link to={`/guest/event/${event.id}`} className="event-link">
                        {event.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>You haven't joined any events yet.</p>
              )}
              <Link to="/guest/login" className="btn btn-secondary">
                Join Another Event
              </Link>
            </div>
          )
        ) : (
          <div className="welcome-buttons">
            <Link to="/guest/login" className="btn btn-primary">
              Join as Guest
            </Link>
            <Link to="/host/login" className="btn btn-secondary">
              Login as Host
            </Link>
            <a href="/google_auth/google_login" className="btn btn-light google-btn">
              <img src="/static/images/googleicon.png" alt="Google Logo" className="google-icon" />
              Sign in with Google
            </a>
          </div>
        )}
        
        <div className="welcome-info">
          <h2>What is a Baby Pool?</h2>
          <p>
            A baby pool is a fun game where friends and family guess when a baby will be born.
            Each guess costs a small amount to enter, and the winners get the prize pool!
          </p>
          <h3>How to Play:</h3>
          <ul>
            <li>Choose a date you think the baby will arrive</li>
            <li>Guess the hour and minute of birth</li>
            <li>Pay the host for each guess</li>
            <li>Win if your guess is correct!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
