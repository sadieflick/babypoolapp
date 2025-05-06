import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEvent, getDateGuesses, createDateGuess, deleteGuess } from '../utils/api';
import { 
  formatDateDisplay, 
  getDateRange, 
  generateCalendarDays 
} from '../utils/dateUtils';
import { format, addMonths, subMonths, startOfMonth, isSameMonth } from 'date-fns';

const DateGuessing = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [dateGuesses, setDateGuesses] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);
        
        // Set current month to due date
        if (eventData.due_date) {
          const dueDate = new Date(eventData.due_date);
          setCurrentMonth(startOfMonth(dueDate));
        }
        
        await fetchDateGuesses();
      } catch (err) {
        setError('Failed to load event details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId]);
  
  const fetchDateGuesses = async () => {
    try {
      const guesses = await getDateGuesses(eventId);
      setDateGuesses(guesses);
    } catch (err) {
      setError('Failed to load date guesses');
      console.error(err);
    }
  };
  
  useEffect(() => {
    if (event?.due_date && dateGuesses) {
      const dueDate = new Date(event.due_date);
      
      // Generate calendar days
      const days = generateCalendarDays(currentMonth, dueDate, dateGuesses);
      setCalendarDays(days);
    }
  }, [event, dateGuesses, currentMonth]);
  
  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };
  
  const handleDateSelect = (day) => {
    if (!day.isAvailable) return;
    setSelectedDate(day.date);
    setSuccessMessage('');
    setError('');
  };
  
  const handleSubmitGuess = async () => {
    if (!selectedDate) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      await createDateGuess(eventId, formattedDate);
      setSuccessMessage(`Your guess for ${formatDateDisplay(selectedDate)} has been saved!`);
      setSelectedDate(null);
      await fetchDateGuesses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save your guess. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteGuess = async (guessId) => {
    if (!window.confirm('Are you sure you want to remove this guess?')) return;
    
    try {
      await deleteGuess(eventId, 'date', guessId);
      setSuccessMessage('Your guess has been removed');
      await fetchDateGuesses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove your guess');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading date guessing game...</div>;
  }
  
  if (!event) {
    return <div className="error-container">Event not found</div>;
  }
  
  const { dueDateObj } = getDateRange(new Date(event.due_date));
  const isWithinDateRange = (date) => {
    const startDate = subMonths(dueDateObj, 1);
    const endDate = addMonths(dueDateObj, 1);
    return date >= startDate && date <= endDate;
  };
  
  const renderCalendarGrid = () => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="calendar-grid">
        {weekdays.map(day => (
          <div key={day} className="calendar-header-cell">{day}</div>
        ))}
        
        {calendarDays.map((day, index) => {
          const dayClasses = [
            'calendar-day',
            day.isDueDate ? 'due-date' : '',
            !day.isAvailable ? 'taken' : '',
            !day.isAvailable && day.paymentStatus === 'paid' ? 'paid' : '',
            !day.isAvailable && day.paymentStatus === 'pending' ? 'pending' : '',
            !day.isAvailable && day.isCurrentUser ? 'current-user' : ''
          ].filter(Boolean).join(' ');
          
          return (
            <div 
              key={index}
              className={dayClasses}
              onClick={() => day.isAvailable && isWithinDateRange(day.date) && handleDateSelect(day)}
              title={day.isDueDate ? "Due Date" : (day.isAvailable ? "Available" : `Taken by ${day.user?.display_name}`)}
            >
              <span className="calendar-day-number">
                {format(day.date, 'd')}
              </span>
              
              {!day.isAvailable && day.user && (
                <span className="calendar-day-user">
                  {day.user.display_name}
                  {day.isCurrentUser && (
                    <button 
                      className="guess-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGuess(day.id);
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
    <div className="date-guessing-container">
      <div className="page-header">
        <h1>Guess the Birth Date</h1>
        <Link to={`/guest/event/${eventId}`} className="btn btn-link">
          Back to Event
        </Link>
      </div>
      
      <div className="game-explanation">
        <p>When do you think the baby will be born? Each guess costs ${event.guess_price.toFixed(2)}.</p>
        <p>Due Date: <strong>{formatDateDisplay(event.due_date)}</strong></p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="calendar-container">
        <div className="calendar-header">
          <div className="calendar-month-selector">
            <button onClick={handlePrevMonth}>&lt;</button>
            <span className="calendar-month-name">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button onClick={handleNextMonth}>&gt;</button>
          </div>
        </div>
        
        {renderCalendarGrid()}
      </div>
      
      {selectedDate && (
        <div className="guess-confirmation">
          <h3>Confirm your guess</h3>
          <p>You are guessing that the baby will be born on: <strong>{formatDateDisplay(selectedDate)}</strong></p>
          <p>This will cost: <strong>${event.guess_price.toFixed(2)}</strong></p>
          
          <div className="confirmation-actions">
            <button 
              className="btn btn-primary"
              onClick={handleSubmitGuess}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Confirm Guess'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setSelectedDate(null)}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color due-date"></div>
          <span>Due Date</span>
        </div>
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

export default DateGuessing;
