import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEvent, getNameGuesses, createNameGuess, deleteGuess } from '../utils/api';

const NameGuessing = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [nameGuesses, setNameGuesses] = useState([]);
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);
        
        if (!eventData.name_game_enabled) {
          navigate(`/guest/event/${eventId}`);
          return;
        }
        
        await fetchNameGuesses();
      } catch (err) {
        setError('Failed to load event details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId, navigate]);
  
  const fetchNameGuesses = async () => {
    try {
      const guesses = await getNameGuesses(eventId);
      setNameGuesses(guesses);
    } catch (err) {
      setError('Failed to load name guesses');
      console.error(err);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nameInput.trim()) {
      setError('Please enter a name');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      await createNameGuess(eventId, nameInput.trim());
      setSuccessMessage(`Your name guess "${nameInput}" has been saved!`);
      setNameInput('');
      await fetchNameGuesses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save your guess. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteGuess = async (guessId) => {
    if (!window.confirm('Are you sure you want to remove this name guess?')) return;
    
    try {
      await deleteGuess(eventId, 'name', guessId);
      setSuccessMessage('Your name guess has been removed');
      await fetchNameGuesses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove your guess');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading name guessing game...</div>;
  }
  
  if (!event || !event.name_game_enabled) {
    return <div className="error-container">Name game is not enabled for this event</div>;
  }
  
  // Filter current user's guesses
  const myGuesses = nameGuesses.filter(guess => guess.is_current_user);
  // Filter other users' guesses
  const otherGuesses = nameGuesses.filter(guess => !guess.is_current_user);
  
  return (
    <div className="name-guessing-container">
      <div className="page-header">
        <h1>
          {event.baby_name_revealed 
            ? 'Guess the Baby\'s Name' 
            : 'Suggest a Baby Name'}
        </h1>
        <Link to={`/guest/event/${eventId}`} className="btn btn-link">
          Back to Event
        </Link>
      </div>
      
      <div className="game-explanation">
        {event.baby_name_revealed ? (
          <p>The parents have already chosen a name for their baby! Can you guess what it is? Each guess costs ${event.guess_price.toFixed(2)}.</p>
        ) : (
          <p>Suggest a name for the baby! Each suggestion costs ${event.guess_price.toFixed(2)}. If the parents choose your name, you win!</p>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="name-form-container">
        <form onSubmit={handleSubmit} className="name-form">
          <div className="form-group">
            <label htmlFor="nameInput">
              {event.baby_name_revealed ? 'Your name guess:' : 'Suggest a name:'}
            </label>
            <div className="name-input-group">
              <input
                type="text"
                id="nameInput"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={event.baby_name_revealed ? "Enter your guess" : "Enter a name suggestion"}
                required
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting || !nameInput.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div className="name-guesses-section">
        {myGuesses.length > 0 && (
          <div className="my-guesses">
            <h3>My {event.baby_name_revealed ? 'Guesses' : 'Suggestions'}</h3>
            <div className="name-guesses-list">
              {myGuesses.map(guess => (
                <div key={guess.id} className="name-guess-item">
                  <span className="guess-name">{guess.name}</span>
                  <button 
                    className="guess-remove"
                    onClick={() => handleDeleteGuess(guess.id)}
                    title="Remove guess"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {otherGuesses.length > 0 && (
          <div className="other-guesses">
            <h3>Other {event.baby_name_revealed ? 'Guesses' : 'Suggestions'}</h3>
            <div className="name-guesses-list">
              {otherGuesses.map(guess => (
                <div key={guess.id} className="name-guess-item">
                  <span className="guess-name">{guess.name}</span>
                  <span className="guess-user">{guess.user.display_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {nameGuesses.length === 0 && (
          <div className="no-guesses">
            <p>No {event.baby_name_revealed ? 'guesses' : 'suggestions'} yet. Be the first!</p>
          </div>
        )}
      </div>
      
      <div className="name-game-cost">
        <p>Cost per {event.baby_name_revealed ? 'guess' : 'suggestion'}: ${event.guess_price.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default NameGuessing;
