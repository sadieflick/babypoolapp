import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, isSameDay } from 'date-fns';
import { fetchAllGuesses, createDateGuess, deleteDateGuess } from '../utils/api';
import '../styles/CustomCalendarGrid.css';

const CustomCalendarGrid = ({ eventId, dueDate, userGuesses, handleGuessCreated, handleGuessDeleted }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(dueDate));
  const [dayGuesses, setDayGuesses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingDate, setConfirmingDate] = useState(null);
  
  // Calculate date range: 1 month before and 1 month after due date
  const dueDateObj = new Date(dueDate);
  const rangeStart = subMonths(dueDateObj, 1);
  const rangeEnd = addMonths(dueDateObj, 1);
  
  // Fetch all guesses for this event
  useEffect(() => {
    const loadGuesses = async () => {
      try {
        setLoading(true);
        const allGuesses = await fetchAllGuesses(eventId);
        
        // Organize date guesses by date string for easy lookup
        const dateGuessMap = {};
        if (allGuesses && allGuesses.date_guesses) {
          allGuesses.date_guesses.forEach(guess => {
            const dateStr = guess.guess_date;
            if (!dateGuessMap[dateStr]) {
              dateGuessMap[dateStr] = [];
            }
            dateGuessMap[dateStr].push(guess);
          });
        }
        
        setDayGuesses(dateGuessMap);
        setLoading(false);
      } catch (err) {
        console.error("Error loading guesses:", err);
        setError("Failed to load guesses. Please try again.");
        setLoading(false);
      }
    };
    
    loadGuesses();
  }, [eventId]);
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Generate days for current month
  const daysInMonth = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return dateRange;
  };
  
  // Check if a date is within the allowed range
  const isDateInRange = (date) => {
    return isWithinInterval(date, { start: rangeStart, end: rangeEnd });
  };
  
  // Check if current user has already guessed this date
  const hasUserGuessedDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (!dayGuesses[dateStr]) return false;
    
    return dayGuesses[dateStr].some(guess => {
      // Check if the guess belongs to the current user by comparing with userGuesses
      return userGuesses && userGuesses.date_guesses && 
             userGuesses.date_guesses.some(userGuess => userGuess.id === guess.id);
    });
  };
  
  // Get user guess ID for a specific date
  const getUserGuessId = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (!dayGuesses[dateStr]) return null;
    
    const userGuess = dayGuesses[dateStr].find(guess => {
      return userGuesses && userGuesses.date_guesses && 
             userGuesses.date_guesses.some(userGuess => userGuess.id === guess.id);
    });
    
    return userGuess ? userGuess.id : null;
  };
  
  // Get display name for a date's guess
  const getGuessDisplayName = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (!dayGuesses[dateStr] || dayGuesses[dateStr].length === 0) return null;
    
    // For simplicity, just show the first user who guessed this date
    const guess = dayGuesses[dateStr][0];
    
    // Format the display name - first name and last initial or nickname
    if (guess.user) {
      if (guess.user.nickname) {
        return guess.user.nickname;
      } else {
        const firstName = guess.user.first_name || '';
        const lastInitial = guess.user.last_name ? guess.user.last_name.charAt(0) + '.' : '';
        return `${firstName} ${lastInitial}`;
      }
    }
    return 'Unknown';
  };
  
  // Handle date selection
  const handleDateSelect = async (date) => {
    // Can't select dates outside the allowed range
    if (!isDateInRange(date)) {
      return;
    }
    
    // If user has already guessed this date, ask if they want to delete the guess
    if (hasUserGuessedDate(date)) {
      setConfirmingDate({ date, action: 'delete' });
      return;
    }
    
    // Otherwise, ask if they want to confirm this date guess
    setConfirmingDate({ date, action: 'create' });
  };
  
  // Confirm a date guess
  const confirmDateGuess = async () => {
    if (!confirmingDate) return;
    
    try {
      if (confirmingDate.action === 'create') {
        // Create new guess
        const formattedDate = format(confirmingDate.date, 'yyyy-MM-dd');
        await createDateGuess(eventId, formattedDate);
        
        // Update UI
        if (handleGuessCreated) {
          handleGuessCreated('date', formattedDate);
        }
      } else if (confirmingDate.action === 'delete') {
        // Delete existing guess
        const guessId = getUserGuessId(confirmingDate.date);
        if (guessId) {
          await deleteDateGuess(eventId, guessId);
          
          // Update UI
          if (handleGuessDeleted) {
            handleGuessDeleted('date', guessId);
          }
        }
      }
      
      // Reload the guesses
      const allGuesses = await fetchAllGuesses(eventId);
      const dateGuessMap = {};
      if (allGuesses && allGuesses.date_guesses) {
        allGuesses.date_guesses.forEach(guess => {
          const dateStr = guess.guess_date;
          if (!dateGuessMap[dateStr]) {
            dateGuessMap[dateStr] = [];
          }
          dateGuessMap[dateStr].push(guess);
        });
      }
      
      setDayGuesses(dateGuessMap);
      
      // Clear confirmation state
      setConfirmingDate(null);
    } catch (err) {
      console.error("Error with date guess:", err);
      setError("Failed to process your guess. Please try again.");
    }
  };
  
  // Cancel confirmation
  const cancelDateGuess = () => {
    setConfirmingDate(null);
  };
  
  // Render days of the week header
  const renderDaysOfWeek = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="days-header">
        {days.map(day => (
          <div key={day} className="day-name">{day}</div>
        ))}
      </div>
    );
  };
  
  // Render the grid of days
  const renderDays = () => {
    const days = daysInMonth();
    const monthStart = startOfMonth(currentMonth);
    
    // Calculate empty cells at the beginning
    const startDayOfWeek = monthStart.getDay();
    const emptyCells = Array(startDayOfWeek).fill(null);
    
    return (
      <div className="days-grid">
        {/* Empty cells at the beginning */}
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="day empty"></div>
        ))}
        
        {/* Actual days */}
        {days.map(day => {
          const isInRange = isDateInRange(day);
          const isDueDate = isSameDay(day, dueDateObj);
          const isGuessedByUser = hasUserGuessedDate(day);
          const isGuessedByOthers = dayGuesses[format(day, 'yyyy-MM-dd')] && 
                                  !isGuessedByUser;
          
          let className = "day";
          if (!isInRange) className += " out-of-range";
          if (isDueDate) className += " due-date";
          if (isGuessedByUser) className += " user-guessed";
          if (isGuessedByOthers) className += " other-guessed";
          
          return (
            <div 
              key={day.toISOString()} 
              className={className}
              onClick={() => handleDateSelect(day)}
            >
              <div className="day-number">{format(day, 'd')}</div>
              {(isGuessedByUser || isGuessedByOthers) && (
                <div className="guess-name">
                  {getGuessDisplayName(day)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Render confirmation modal
  const renderConfirmation = () => {
    if (!confirmingDate) return null;
    
    const dateStr = format(confirmingDate.date, 'MMMM d, yyyy');
    const isCreating = confirmingDate.action === 'create';
    
    return (
      <div className="confirmation-overlay">
        <div className="confirmation-modal">
          <h3>{isCreating ? 'Confirm Your Guess' : 'Remove Your Guess?'}</h3>
          {isCreating ? (
            <p>Are you sure you want to guess that the baby will be born on {dateStr}?</p>
          ) : (
            <p>Do you want to remove your guess for {dateStr}?</p>
          )}
          <div className="confirmation-buttons">
            <button 
              className="btn btn-secondary" 
              onClick={cancelDateGuess}
            >
              Cancel
            </button>
            <button 
              className={`btn ${isCreating ? 'btn-primary' : 'btn-danger'}`} 
              onClick={confirmDateGuess}
            >
              {isCreating ? 'Confirm Guess' : 'Remove Guess'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return <div className="loading">Loading calendar...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div className="custom-calendar">
      {/* Calendar header with navigation */}
      <div className="calendar-header">
        <button 
          className="month-nav" 
          onClick={prevMonth}
          disabled={subMonths(currentMonth, 1) < subMonths(dueDateObj, 2)}
        >
          &lt;
        </button>
        <h2 className="current-month">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button 
          className="month-nav" 
          onClick={nextMonth}
          disabled={addMonths(currentMonth, 1) > addMonths(dueDateObj, 2)}
        >
          &gt;
        </button>
      </div>
      
      {/* Days of week header */}
      {renderDaysOfWeek()}
      
      {/* Calendar days */}
      {renderDays()}
      
      {/* Info about the calendar */}
      <div className="calendar-info">
        <div className="due-date-info">
          <span className="due-date-marker"></span> Due Date: {format(dueDateObj, 'MMMM d, yyyy')}
        </div>
        <div className="range-info">
          Valid guessing range: {format(rangeStart, 'MMM d')} - {format(rangeEnd, 'MMM d, yyyy')}
        </div>
      </div>
      
      {/* Confirmation modal */}
      {renderConfirmation()}
    </div>
  );
};

export default CustomCalendarGrid;