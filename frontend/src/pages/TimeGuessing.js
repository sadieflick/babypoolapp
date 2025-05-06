import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  getEvent, 
  getHourGuesses, 
  createHourGuess, 
  getMinuteGuesses, 
  createMinuteGuess, 
  deleteGuess 
} from '../utils/api';
import { 
  formatTimeDisplay, 
  formatMinuteDisplay, 
  generateHours, 
  generateMinutes 
} from '../utils/dateUtils';

const TimeGuessing = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [hourGuesses, setHourGuesses] = useState([]);
  const [minuteGuesses, setMinuteGuesses] = useState([]);
  const [hours, setHours] = useState([]);
  const [minutes, setMinutes] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedMinute, setSelectedMinute] = useState(null);
  const [activeTab, setActiveTab] = useState('hour'); // 'hour' or 'minute'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);
        
        await fetchTimeGuesses();
      } catch (err) {
        setError('Failed to load event details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId]);
  
  const fetchTimeGuesses = async () => {
    try {
      const [hourData, minuteData] = await Promise.all([
        getHourGuesses(eventId),
        getMinuteGuesses(eventId)
      ]);
      
      setHourGuesses(hourData);
      setMinuteGuesses(minuteData);
      
      // Generate the grid data
      setHours(generateHours(hourData));
      setMinutes(generateMinutes(minuteData));
    } catch (err) {
      setError('Failed to load time guesses');
      console.error(err);
    }
  };
  
  const handleSelectHour = (hour) => {
    if (!hour.isAvailable) return;
    setSelectedHour(hour);
    setSelectedMinute(null);
    setSuccessMessage('');
    setError('');
  };
  
  const handleSelectMinute = (minute) => {
    if (!minute.isAvailable) return;
    setSelectedMinute(minute);
    setSelectedHour(null);
    setSuccessMessage('');
    setError('');
  };
  
  const handleSubmitHourGuess = async () => {
    if (!selectedHour) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      await createHourGuess(eventId, selectedHour.hour, selectedHour.amPm);
      setSuccessMessage(`Your guess for ${selectedHour.display} has been saved!`);
      setSelectedHour(null);
      await fetchTimeGuesses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save your guess. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSubmitMinuteGuess = async () => {
    if (!selectedMinute) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      await createMinuteGuess(eventId, selectedMinute.minute);
      setSuccessMessage(`Your guess for ${selectedMinute.display} minutes has been saved!`);
      setSelectedMinute(null);
      await fetchTimeGuesses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save your guess. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteHourGuess = async (guessId) => {
    if (!window.confirm('Are you sure you want to remove this guess?')) return;
    
    try {
      await deleteGuess(eventId, 'hour', guessId);
      setSuccessMessage('Your hour guess has been removed');
      await fetchTimeGuesses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove your guess');
    }
  };
  
  const handleDeleteMinuteGuess = async (guessId) => {
    if (!window.confirm('Are you sure you want to remove this guess?')) return;
    
    try {
      await deleteGuess(eventId, 'minute', guessId);
      setSuccessMessage('Your minute guess has been removed');
      await fetchTimeGuesses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove your guess');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading time guessing game...</div>;
  }
  
  if (!event) {
    return <div className="error-container">Event not found</div>;
  }
  
  const renderHourGrid = () => {
    return (
      <div className="time-grid">
        {hours.map((hour, index) => {
          const hourClasses = [
            'time-cell',
            !hour.isAvailable ? 'taken' : '',
            !hour.isAvailable && hour.paymentStatus === 'paid' ? 'paid' : '',
            !hour.isAvailable && hour.paymentStatus === 'pending' ? 'pending' : '',
            !hour.isAvailable && hour.isCurrentUser ? 'current-user' : '',
            selectedHour?.hour === hour.hour && selectedHour?.amPm === hour.amPm ? 'selected' : ''
          ].filter(Boolean).join(' ');
          
          return (
            <div 
              key={index}
              className={hourClasses}
              onClick={() => hour.isAvailable && handleSelectHour(hour)}
              title={hour.isAvailable ? "Available" : `Taken by ${hour.user?.display_name}`}
            >
              <span className="time-value">{hour.display}</span>
              
              {!hour.isAvailable && hour.user && (
                <span className="time-user">
                  {hour.user.display_name}
                  {hour.isCurrentUser && (
                    <button 
                      className="guess-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Find the original guess object to get its ID
                        const guess = hourGuesses.find(
                          g => g.hour === hour.hour && g.am_pm === hour.amPm && g.is_current_user
                        );
                        if (guess) handleDeleteHourGuess(guess.id);
                      }}
                      title="Remove guess"
                    >
                      ×
                    </button>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderMinuteGrid = () => {
    return (
      <div className="time-grid">
        {minutes.map((minute, index) => {
          const minuteClasses = [
            'time-cell',
            !minute.isAvailable ? 'taken' : '',
            !minute.isAvailable && minute.paymentStatus === 'paid' ? 'paid' : '',
            !minute.isAvailable && minute.paymentStatus === 'pending' ? 'pending' : '',
            !minute.isAvailable && minute.isCurrentUser ? 'current-user' : '',
            selectedMinute?.minute === minute.minute ? 'selected' : ''
          ].filter(Boolean).join(' ');
          
          return (
            <div 
              key={index}
              className={minuteClasses}
              onClick={() => minute.isAvailable && handleSelectMinute(minute)}
              title={minute.isAvailable ? "Available" : `Taken by ${minute.user?.display_name}`}
            >
              <span className="time-value">{minute.display}</span>
              
              {!minute.isAvailable && minute.user && (
                <span className="time-user">
                  {minute.user.display_name}
                  {minute.isCurrentUser && (
                    <button 
                      className="guess-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Find the original guess object to get its ID
                        const guess = minuteGuesses.find(
                          g => g.minute === minute.minute && g.is_current_user
                        );
                        if (guess) handleDeleteMinuteGuess(guess.id);
                      }}
                      title="Remove guess"
                    >
                      ×
                    </button>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="time-guessing-container">
      <div className="page-header">
        <h1>Guess the Birth Time</h1>
        <Link to={`/guest/event/${eventId}`} className="btn btn-link">
          Back to Event
        </Link>
      </div>
      
      <div className="game-explanation">
        <p>What time of day do you think the baby will be born? Each guess costs ${event.guess_price.toFixed(2)}.</p>
        <p><strong>Hours</strong> and <strong>Minutes</strong> are separate pools. You can win either or both!</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="time-picker-container">
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'hour' ? 'active' : ''}`}
            onClick={() => setActiveTab('hour')}
          >
            Hours
          </button>
          <button 
            className={`tab-button ${activeTab === 'minute' ? 'active' : ''}`}
            onClick={() => setActiveTab('minute')}
          >
            Minutes
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'hour' ? (
            <>
              <h2 className="time-picker-title">Select an hour</h2>
              {renderHourGrid()}
              
              {selectedHour && (
                <div className="guess-confirmation">
                  <h3>Confirm your guess</h3>
                  <p>You are guessing that the baby will be born at: <strong>{selectedHour.display}</strong></p>
                  <p>This will cost: <strong>${event.guess_price.toFixed(2)}</strong></p>
                  
                  <div className="confirmation-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={handleSubmitHourGuess}
                      disabled={submitting}
                    >
                      {submitting ? 'Saving...' : 'Confirm Guess'}
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setSelectedHour(null)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="time-picker-title">Select a minute</h2>
              {renderMinuteGrid()}
              
              {selectedMinute && (
                <div className="guess-confirmation">
                  <h3>Confirm your guess</h3>
                  <p>You are guessing that the baby will be born at minute: <strong>{selectedMinute.display}</strong></p>
                  <p>This will cost: <strong>${event.guess_price.toFixed(2)}</strong></p>
                  
                  <div className="confirmation-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={handleSubmitMinuteGuess}
                      disabled={submitting}
                    >
                      {submitting ? 'Saving...' : 'Confirm Guess'}
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setSelectedMinute(null)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="time-legend">
        <div className="legend-item">
          <div className="legend-color taken paid"></div>
          <span>Taken (Paid)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color taken pending"></div>
          <span>Taken (Pending Payment)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color taken current-user"></div>
          <span>Your Guess</span>
        </div>
      </div>
    </div>
  );
};

export default TimeGuessing;
