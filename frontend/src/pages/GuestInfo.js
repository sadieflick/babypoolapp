import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGuestDetails, updateGuestPayment, deleteGuess } from '../utils/api';
import { formatDateDisplay, formatTimeDisplay, formatMinuteDisplay } from '../utils/dateUtils';

const GuestInfo = () => {
  const { eventId, guestId } = useParams();
  const navigate = useNavigate();
  
  const [guestDetails, setGuestDetails] = useState(null);
  const [customPayment, setCustomPayment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    const fetchGuestDetails = async () => {
      try {
        const data = await getGuestDetails(eventId, guestId);
        setGuestDetails(data);
      } catch (err) {
        setError('Failed to load guest details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGuestDetails();
  }, [eventId, guestId]);
  
  const handlePaymentUpdate = async (action) => {
    try {
      let data = { action };
      
      if (action === 'add_payment') {
        if (!customPayment || isNaN(parseFloat(customPayment)) || parseFloat(customPayment) <= 0) {
          setError('Please enter a valid payment amount');
          return;
        }
        data.amount = parseFloat(customPayment);
      }
      
      await updateGuestPayment(eventId, guestId, data);
      const updatedGuest = await getGuestDetails(eventId, guestId);
      setGuestDetails(updatedGuest);
      setSuccessMessage('Payment updated successfully');
      setCustomPayment('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update payment');
    }
  };
  
  const handleDeleteGuess = async (guessType, guessId) => {
    if (!window.confirm('Are you sure you want to delete this guess?')) return;
    
    try {
      await deleteGuess(eventId, guessType, guessId);
      const updatedGuest = await getGuestDetails(eventId, guestId);
      setGuestDetails(updatedGuest);
      setSuccessMessage('Guess deleted successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete guess');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading guest details...</div>;
  }
  
  if (!guestDetails) {
    return <div className="error-container">Guest not found</div>;
  }
  
  const hasDateGuesses = guestDetails.date_guesses && guestDetails.date_guesses.length > 0;
  const hasHourGuesses = guestDetails.hour_guesses && guestDetails.hour_guesses.length > 0;
  const hasMinuteGuesses = guestDetails.minute_guesses && guestDetails.minute_guesses.length > 0;
  const hasNameGuesses = guestDetails.name_guesses && guestDetails.name_guesses.length > 0;
  
  return (
    <div className="guest-info-container">
      <div className="guest-info-header">
        <h1 className="guest-info-title">
          {guestDetails.nickname || `${guestDetails.first_name || ''} ${guestDetails.last_name || ''}`.trim() || guestDetails.email}
        </h1>
        <Link to="/host/dashboard" className="btn btn-link">
          Back to Dashboard
        </Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="guest-profile">
        <div className="profile-item">
          <span className="profile-label">Full Name</span>
          <span className="profile-value">
            {`${guestDetails.first_name || ''} ${guestDetails.last_name || ''}`.trim() || 'Not provided'}
          </span>
        </div>
        
        <div className="profile-item">
          <span className="profile-label">Nickname</span>
          <span className="profile-value">
            {guestDetails.nickname || 'Not provided'}
          </span>
        </div>
        
        <div className="profile-item">
          <span className="profile-label">Email</span>
          <span className="profile-value">
            {guestDetails.email || 'Not provided'}
          </span>
        </div>
        
        <div className="profile-item">
          <span className="profile-label">Phone</span>
          <span className="profile-value">
            {guestDetails.phone || 'Not provided'}
          </span>
        </div>
        
        <div className="profile-item">
          <span className="profile-label">Payment Method</span>
          <span className="profile-value">
            {guestDetails.payment_method 
              ? (guestDetails.payment_method === 'venmo' ? 'Venmo' : 'Cash')
              : 'Not specified'}
          </span>
        </div>
      </div>
      
      <div className="guest-payment">
        <h2>Payment Information</h2>
        
        <div className="payment-summary-row">
          <span>Total Guesses:</span>
          <span>{guestDetails.total_guesses}</span>
        </div>
        
        <div className="payment-summary-row">
          <span>Amount Owed:</span>
          <span>${guestDetails.amount_owed.toFixed(2)}</span>
        </div>
        
        <div className="payment-summary-row">
          <span>Total Paid:</span>
          <span>${guestDetails.total_paid.toFixed(2)}</span>
        </div>
        
        <div className="payment-summary-row">
          <span>Payment Status:</span>
          <span className={`payment-status status-${guestDetails.payment_status}`}>
            {guestDetails.payment_status === 'paid' ? 'Paid' : 
             guestDetails.payment_status === 'partial' ? 'Partially Paid' : 'Pending'}
          </span>
        </div>
        
        <div className="payment-actions">
          <button 
            className="btn btn-success"
            onClick={() => handlePaymentUpdate('mark_paid')}
          >
            Mark as Paid
          </button>
          
          <button 
            className="btn btn-warning"
            onClick={() => handlePaymentUpdate('mark_unpaid')}
          >
            Mark as Unpaid
          </button>
        </div>
        
        <div className="custom-payment">
          <input
            type="number"
            placeholder="Enter amount"
            value={customPayment}
            onChange={(e) => setCustomPayment(e.target.value)}
            step="0.01"
            min="0.01"
          />
          <button 
            className="btn btn-primary"
            onClick={() => handlePaymentUpdate('add_payment')}
            disabled={!customPayment || isNaN(parseFloat(customPayment)) || parseFloat(customPayment) <= 0}
          >
            Add Payment
          </button>
        </div>
      </div>
      
      <div className="guest-guesses">
        <h2>Guesses</h2>
        
        {guestDetails.total_guesses === 0 ? (
          <p>This guest hasn't made any guesses yet.</p>
        ) : (
          <>
            {hasDateGuesses && (
              <div className="guess-category">
                <h3>Date Guesses</h3>
                <div className="guess-items">
                  {guestDetails.date_guesses.map(guess => (
                    <div key={guess.id} className="guess-item">
                      <span className="guess-value">{formatDateDisplay(guess.date)}</span>
                      <button
                        className="guess-remove"
                        onClick={() => handleDeleteGuess('date', guess.id)}
                        title="Delete guess"
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
                  {guestDetails.hour_guesses.map(guess => (
                    <div key={guess.id} className="guess-item">
                      <span className="guess-value">{guess.hour} {guess.am_pm}</span>
                      <button
                        className="guess-remove"
                        onClick={() => handleDeleteGuess('hour', guess.id)}
                        title="Delete guess"
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
                  {guestDetails.minute_guesses.map(guess => (
                    <div key={guess.id} className="guess-item">
                      <span className="guess-value">{formatMinuteDisplay(guess.minute)}</span>
                      <button
                        className="guess-remove"
                        onClick={() => handleDeleteGuess('minute', guess.id)}
                        title="Delete guess"
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
                <h3>Name Guesses</h3>
                <div className="guess-items">
                  {guestDetails.name_guesses.map(guess => (
                    <div key={guess.id} className="guess-item">
                      <span className="guess-value">{guess.name}</span>
                      <button
                        className="guess-remove"
                        onClick={() => handleDeleteGuess('name', guess.id)}
                        title="Delete guess"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GuestInfo;
