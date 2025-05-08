import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getEvent, getUserGuesses } from '../utils/api';
import CustomCalendarGrid from '../components/CustomCalendarGrid';
import '../styles/GuestDateGuessPage.css';

const GuestDateGuessPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [userGuesses, setUserGuesses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchEventAndGuesses = async () => {
      try {
        setLoading(true);
        
        // Fetch event details
        const eventData = await getEvent(eventId);
        setEvent(eventData);
        
        // Fetch user's current guesses
        const guessesData = await getUserGuesses(eventId);
        setUserGuesses(guessesData);
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchEventAndGuesses();
  }, [eventId]);
  
  const handleGuessCreated = async (guessType, guessValue) => {
    try {
      // Refresh user guesses after creating a new guess
      const guessesData = await getUserGuesses(eventId);
      setUserGuesses(guessesData);
    } catch (err) {
      console.error("Error refreshing guesses:", err);
      setError("Your guess was saved, but we had trouble refreshing the display.");
    }
  };
  
  const handleGuessDeleted = async (guessType, guessId) => {
    try {
      // Refresh user guesses after deleting a guess
      const guessesData = await getUserGuesses(eventId);
      setUserGuesses(guessesData);
    } catch (err) {
      console.error("Error refreshing guesses:", err);
      setError("Your guess was removed, but we had trouble refreshing the display.");
    }
  };
  
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  if (!event) {
    return <div className="error-container">Event not found</div>;
  }
  
  return (
    <div className="guest-date-guess-page">
      <div className="page-header">
        <Link to={`/guest/event/${eventId}`} className="back-button">
          &larr; Back to Dashboard
        </Link>
        <h1>Date Guess</h1>
      </div>
      
      <div className="date-guess-instructions">
        <h2>What date do you think the baby will be born?</h2>
        <p>
          The baby's due date is <strong>{new Date(event.due_date).toLocaleDateString()}</strong>.
          Each date guess costs ${event.guess_price.toFixed(2)}.
        </p>
      </div>
      
      <div className="calendar-container">
        <CustomCalendarGrid 
          eventId={eventId}
          dueDate={event.due_date}
          userGuesses={userGuesses}
          handleGuessCreated={handleGuessCreated}
          handleGuessDeleted={handleGuessDeleted}
        />
      </div>
      
      <div className="guess-info">
        {userGuesses && userGuesses.date_guesses && userGuesses.date_guesses.length > 0 ? (
          <div className="current-guesses">
            <h3>Your current date guesses:</h3>
            <ul>
              {userGuesses.date_guesses.map(guess => (
                <li key={guess.id}>
                  {new Date(guess.guess_date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="no-guesses">You haven't made any date guesses yet.</p>
        )}
      </div>
    </div>
  );
};

export default GuestDateGuessPage;