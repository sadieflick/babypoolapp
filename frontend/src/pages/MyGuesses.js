import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserGuesses, getEvent, deleteGuess } from '../utils/api';
import { formatDateDisplay, formatTimeDisplay, formatMinuteDisplay } from '../utils/dateUtils';

const MyGuesses = () => {
  const { eventId } = useParams();
  
  const [event, setEvent] = useState(null);
  const [guesses, setGuesses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventData, guessesData] = await Promise.all([
          getEvent(eventId),
          getUserGuesses(eventId)
        ]);
        
        setEvent(eventData);
        setGuesses(guessesData);
      } catch (err) {
        setError('Failed to load your guesses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId]);
  
  const handleDeleteGuess = async (guessType, guessId) => {
    if (!window.confirm('Are you sure you want to remove this guess?')) return;
    
    try {
      await deleteGuess(eventId, guessType, guessId);
      
      // Update local state to remove the deleted guess
      const updatedGuesses = { ...guesses };
      
      if (guessType === 'date') {
        updatedGuesses.date_guesses = updatedGuesses.date_guesses.filter(g => g.id !== guessId);
      } else if (guessType === 'hour') {
        updatedGuesses.hour_guesses = updatedGuesses.hour_guesses.filter(g => g.id !== guessId);
      } else if (guessType === 'minute') {
        updatedGuesses.minute_guesses = updatedGuesses.minute_guesses.filter(g => g.id !== guessId);
      } else if (guessType === 'name') {
        updatedGuesses.name_guesses = updatedGuesses.name_guesses.filter(g => g.id !== guessId);
      }
      
      // Recalculate totals
      updatedGuesses.total_guesses = (
        updatedGuesses.date_guesses.length + 
        updatedGuesses.hour_guesses.length + 
        updatedGuesses.minute_guesses.length + 
        updatedGuesses.name_guesses.length
      );
      
      updatedGuesses.amount_owed = updatedGuesses.total_guesses * (event?.guess_price || 1);
      
      setGuesses(updatedGuesses);
      setSuccessMessage('Guess removed successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove your guess');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading your guesses...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  if (!guesses) {
    return <div className="error-container">No guesses found</div>;
  }
  
  const hasDateGuesses = guesses.date_guesses && guesses.date_guesses.length > 0;
  const hasHourGuesses = guesses.hour_guesses && guesses.hour_guesses.length > 0;
  const hasMinuteGuesses = guesses.minute_guesses && guesses.minute_guesses.length > 0;
  const hasNameGuesses = guesses.name_guesses && guesses.name_guesses.length > 0;
  const hasAnyGuesses = hasDateGuesses || hasHourGuesses || hasMinuteGuesses || hasNameGuesses;
  
  return (
    <div className="my-guesses-container">
      <div className="page-header">
        <h1>My Guesses</h1>
        <Link to={`/guest/event/${eventId}`} className="btn btn-link">
          Back to Event
        </Link>
      </div>
      
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {!hasAnyGuesses && (
        <div className="no-guesses-message">
          <p>You haven't made any guesses yet.</p>
          <div className="make-guess-links">
            <Link to={`/guest/event/${eventId}/date-guess`} className="btn btn-primary">
              Guess the Date
            </Link>
            <Link to={`/guest/event/${eventId}/time-guess`} className="btn btn-primary">
              Guess the Time
            </Link>
            {event && event.name_game_enabled && (
              <Link to={`/guest/event/${eventId}/name-guess`} className="btn btn-primary">
                {event.baby_name_revealed ? 'Guess the Name' : 'Suggest a Name'}
              </Link>
            )}
          </div>
        </div>
      )}
      
      {hasAnyGuesses && (
        <div className="guess-list">
          {hasDateGuesses && (
            <div className="guess-category">
              <h3>Date Guesses</h3>
              <div className="guess-items">
                {guesses.date_guesses.map(guess => (
                  <div key={guess.id} className="guess-item">
                    <span className="guess-value">{formatDateDisplay(guess.date)}</span>
                    <button
                      className="guess-remove"
                      onClick={() => handleDeleteGuess('date', guess.id)}
                      title="Remove guess"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {hasHourGuesses && (
            <div className="guess-category">
              <h3>Hour Guesses</h3>
              <div className="guess-items">
                {guesses.hour_guesses.map(guess => (
                  <div key={guess.id} className="guess-item">
                    <span className="guess-value">{formatTimeDisplay(guess.hour, guess.am_pm)}</span>
                    <button
                      className="guess-remove"
                      onClick={() => handleDeleteGuess('hour', guess.id)}
                      title="Remove guess"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {hasMinuteGuesses && (
            <div className="guess-category">
              <h3>Minute Guesses</h3>
              <div className="guess-items">
                {guesses.minute_guesses.map(guess => (
                  <div key={guess.id} className="guess-item">
                    <span className="guess-value">{formatMinuteDisplay(guess.minute)}</span>
                    <button
                      className="guess-remove"
                      onClick={() => handleDeleteGuess('minute', guess.id)}
                      title="Remove guess"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {hasNameGuesses && (
            <div className="guess-category">
              <h3>{event && event.baby_name_revealed ? 'Name Guesses' : 'Name Suggestions'}</h3>
              <div className="guess-items">
                {guesses.name_guesses.map(guess => (
                  <div key={guess.id} className="guess-item">
                    <span className="guess-value">{guess.name}</span>
                    <button
                      className="guess-remove"
                      onClick={() => handleDeleteGuess('name', guess.id)}
                      title="Remove guess"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="payment-summary">
            <h3>Payment Summary</h3>
            <div className="payment-summary-row">
              <span>Total Guesses:</span>
              <span>{guesses.total_guesses}</span>
            </div>
            <div className="payment-summary-row">
              <span>Price per Guess:</span>
              <span>${event?.guess_price?.toFixed(2) || '1.00'}</span>
            </div>
            <div className="payment-summary-row">
              <span>Total Owed:</span>
              <span>${guesses.amount_owed?.toFixed(2)}</span>
            </div>
            <div className="payment-summary-row">
              <span>Total Paid:</span>
              <span>${guesses.total_paid?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="payment-summary-row">
              <span>Payment Status:</span>
              <span className={`payment-status status-${guesses.payment_status}`}>
                {guesses.payment_status === 'paid' ? 'Paid' : 
                 guesses.payment_status === 'partial' ? 'Partially Paid' : 'Pending'}
              </span>
            </div>
          </div>
          
          {guesses.payment_status !== 'paid' && (
            <div className="payment-instructions">
              <h4>How to Pay</h4>
              <p>Please pay the host, {event?.host?.name}, directly via your preferred payment method.</p>
              {event?.host?.email && (
                <p>You can contact the host at: <a href={`mailto:${event.host.email}`}>{event.host.email}</a></p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyGuesses;
