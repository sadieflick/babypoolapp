import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getEvents, getEvent, getEventGuests, getDateGuesses, getHourGuesses, getMinuteGuesses, getNameGuesses, updateGuestPayment, removeGuest, addGuest } from '../utils/api';
import { formatDateDisplay } from '../utils/dateUtils';

const HostDashboard = () => {
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [guests, setGuests] = useState([]);
  const [dateGuesses, setDateGuesses] = useState([]);
  const [hourGuesses, setHourGuesses] = useState([]);
  const [minuteGuesses, setMinuteGuesses] = useState([]);
  const [nameGuesses, setNameGuesses] = useState([]);
  const [activeTab, setActiveTab] = useState('dates');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await getEvents();
        setEvents(eventsData);
        
        // If there's at least one event, select the first one by default
        if (eventsData.length > 0) {
          setSelectedEvent(eventsData[0].id);
        }
      } catch (err) {
        setError('Failed to load events');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);
  
  useEffect(() => {
    if (selectedEvent) {
      fetchEventData(selectedEvent);
    }
  }, [selectedEvent]);
  
  const fetchEventData = async (eventId) => {
    setLoading(true);
    setError('');
    
    try {
      const [eventData, guestsData, dateGuessesData, hourGuessesData, minuteGuessesData] = await Promise.all([
        getEvent(eventId),
        getEventGuests(eventId),
        getDateGuesses(eventId),
        getHourGuesses(eventId),
        getMinuteGuesses(eventId)
      ]);
      
      setEventDetails(eventData);
      setGuests(guestsData);
      setDateGuesses(dateGuessesData);
      setHourGuesses(hourGuessesData);
      setMinuteGuesses(minuteGuessesData);
      
      // Only fetch name guesses if the name game is enabled
      if (eventData.name_game_enabled) {
        const nameGuessesData = await getNameGuesses(eventId);
        setNameGuesses(nameGuessesData);
      } else {
        setNameGuesses([]);
      }
    } catch (err) {
      setError('Failed to load event data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddGuest = async (e) => {
    e.preventDefault();
    
    if (!newGuestEmail.trim()) {
      setError('Please enter a valid email');
      return;
    }
    
    try {
      await addGuest(selectedEvent, newGuestEmail);
      setSuccessMessage(`Guest ${newGuestEmail} added successfully`);
      setNewGuestEmail('');
      
      // Refresh the guest list
      const guestsData = await getEventGuests(selectedEvent);
      setGuests(guestsData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add guest');
    }
  };
  
  const handleRemoveGuest = async (guestId) => {
    if (!window.confirm('Are you sure you want to remove this guest?')) return;
    
    try {
      await removeGuest(selectedEvent, guestId);
      setSuccessMessage('Guest removed successfully');
      
      // Refresh the guest list
      const guestsData = await getEventGuests(selectedEvent);
      setGuests(guestsData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove guest');
    }
  };
  
  const handleUpdatePayment = async (guestId, action, amount = null) => {
    try {
      const paymentData = { action };
      if (action === 'add_payment' && amount) {
        paymentData.amount = parseFloat(amount);
      }
      
      await updateGuestPayment(selectedEvent, guestId, paymentData);
      setSuccessMessage('Payment updated successfully');
      
      // Refresh the guest list
      const guestsData = await getEventGuests(selectedEvent);
      setGuests(guestsData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update payment');
    }
  };
  
  if (loading && !eventDetails) {
    return <div className="loading">Loading dashboard...</div>;
  }
  
  if (!events || events.length === 0) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Host Dashboard</h1>
        </div>
        
        <div className="no-events-message">
          <p>You haven't created any events yet.</p>
          <Link to="/host/event/create" className="btn btn-primary">
            Create Your First Event
          </Link>
        </div>
      </div>
    );
  }
  
  // Calculate stats for the event
  const totalGuests = guests.length;
  const paidGuests = guests.filter(g => g.payment_status === 'paid').length;
  const pendingGuests = guests.filter(g => g.payment_status === 'pending' || g.payment_status === 'partial').length;
  const totalDateGuesses = dateGuesses.length;
  const totalHourGuesses = hourGuesses.length;
  const totalMinuteGuesses = minuteGuesses.length;
  const totalNameGuesses = nameGuesses.length;
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Host Dashboard</h1>
        <div className="dashboard-actions">
          <Link to="/host/event/create" className="btn btn-primary">
            Create New Event
          </Link>
          {eventDetails && (
            <Link to={`/host/event/${selectedEvent}/settings`} className="btn btn-secondary">
              Event Settings
            </Link>
          )}
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {events.length > 1 && (
        <div className="event-selector">
          <label htmlFor="eventSelect">Select Event:</label>
          <select 
            id="eventSelect" 
            value={selectedEvent || ''} 
            onChange={(e) => setSelectedEvent(parseInt(e.target.value))}
          >
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {eventDetails && (
        <>
          <div className="event-code-display">
            <h3>Event Code</h3>
            <div className="event-code">{eventDetails.event_code}</div>
            <p>Share this code with your guests so they can join your event</p>
          </div>
          
          <div className="stats-banner">
            <div className="stat-card">
              <div className="stat-value">{totalGuests}</div>
              <div className="stat-label">Total Guests</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{paidGuests}</div>
              <div className="stat-label">Paid Guests</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{pendingGuests}</div>
              <div className="stat-label">Pending Payments</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalDateGuesses}</div>
              <div className="stat-label">Date Guesses</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalHourGuesses + totalMinuteGuesses}</div>
              <div className="stat-label">Time Guesses</div>
            </div>
            {eventDetails.name_game_enabled && (
              <div className="stat-card">
                <div className="stat-value">{totalNameGuesses}</div>
                <div className="stat-label">Name Guesses</div>
              </div>
            )}
          </div>
          
          <div className="event-tabs">
            <div className="tab-navigation">
              <button 
                className={`tab-button ${activeTab === 'dates' ? 'active' : ''}`}
                onClick={() => setActiveTab('dates')}
              >
                Date Guesses
              </button>
              <button 
                className={`tab-button ${activeTab === 'hours' ? 'active' : ''}`}
                onClick={() => setActiveTab('hours')}
              >
                Hour Guesses
              </button>
              <button 
                className={`tab-button ${activeTab === 'minutes' ? 'active' : ''}`}
                onClick={() => setActiveTab('minutes')}
              >
                Minute Guesses
              </button>
              {eventDetails.name_game_enabled && (
                <button 
                  className={`tab-button ${activeTab === 'names' ? 'active' : ''}`}
                  onClick={() => setActiveTab('names')}
                >
                  Name Guesses
                </button>
              )}
              <button 
                className={`tab-button ${activeTab === 'guests' ? 'active' : ''}`}
                onClick={() => setActiveTab('guests')}
              >
                Guest List
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'dates' && (
                <div className="date-guesses-tab">
                  <h2>Date Guesses</h2>
                  
                  {totalDateGuesses === 0 ? (
                    <p>No date guesses yet.</p>
                  ) : (
                    <div className="guess-table-container">
                      <table className="guess-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Guest</th>
                            <th>Payment Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dateGuesses.map(guess => (
                            <tr key={guess.id}>
                              <td>{formatDateDisplay(guess.date)}</td>
                              <td>
                                <Link to={`/host/event/${selectedEvent}/guest/${guess.user.id}`}>
                                  {guess.user.display_name}
                                </Link>
                              </td>
                              <td>
                                <span className={`payment-status status-${guess.payment_status}`}>
                                  {guess.payment_status === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'hours' && (
                <div className="hour-guesses-tab">
                  <h2>Hour Guesses</h2>
                  
                  {totalHourGuesses === 0 ? (
                    <p>No hour guesses yet.</p>
                  ) : (
                    <div className="guess-table-container">
                      <table className="guess-table">
                        <thead>
                          <tr>
                            <th>Hour</th>
                            <th>Guest</th>
                            <th>Payment Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hourGuesses.map(guess => (
                            <tr key={guess.id}>
                              <td>{guess.hour} {guess.am_pm}</td>
                              <td>
                                <Link to={`/host/event/${selectedEvent}/guest/${guess.user.id}`}>
                                  {guess.user.display_name}
                                </Link>
                              </td>
                              <td>
                                <span className={`payment-status status-${guess.payment_status}`}>
                                  {guess.payment_status === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'minutes' && (
                <div className="minute-guesses-tab">
                  <h2>Minute Guesses</h2>
                  
                  {totalMinuteGuesses === 0 ? (
                    <p>No minute guesses yet.</p>
                  ) : (
                    <div className="guess-table-container">
                      <table className="guess-table">
                        <thead>
                          <tr>
                            <th>Minute</th>
                            <th>Guest</th>
                            <th>Payment Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {minuteGuesses.map(guess => (
                            <tr key={guess.id}>
                              <td>{guess.minute < 10 ? `0${guess.minute}` : guess.minute}</td>
                              <td>
                                <Link to={`/host/event/${selectedEvent}/guest/${guess.user.id}`}>
                                  {guess.user.display_name}
                                </Link>
                              </td>
                              <td>
                                <span className={`payment-status status-${guess.payment_status}`}>
                                  {guess.payment_status === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'names' && eventDetails.name_game_enabled && (
                <div className="name-guesses-tab">
                  <h2>{eventDetails.baby_name_revealed ? 'Name Guesses' : 'Name Suggestions'}</h2>
                  
                  {totalNameGuesses === 0 ? (
                    <p>No name guesses yet.</p>
                  ) : (
                    <div className="guess-table-container">
                      <table className="guess-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Guest</th>
                            <th>Payment Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nameGuesses.map(guess => (
                            <tr key={guess.id}>
                              <td>{guess.name}</td>
                              <td>
                                <Link to={`/host/event/${selectedEvent}/guest/${guess.user.id}`}>
                                  {guess.user.display_name}
                                </Link>
                              </td>
                              <td>
                                <span className={`payment-status status-${guess.payment_status}`}>
                                  {guess.payment_status === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'guests' && (
                <div className="guests-tab">
                  <h2>Guest List</h2>
                  
                  <form onSubmit={handleAddGuest} className="add-guest-form">
                    <input
                      type="email"
                      placeholder="Guest email"
                      value={newGuestEmail}
                      onChange={(e) => setNewGuestEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-primary">Add Guest</button>
                  </form>
                  
                  {totalGuests === 0 ? (
                    <p>No guests yet. Add some guests to get started!</p>
                  ) : (
                    <table className="guest-list">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Guesses</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guests.map(guest => (
                          <tr key={guest.id}>
                            <td>
                              <Link 
                                to={`/host/event/${selectedEvent}/guest/${guest.id}`}
                                className="guest-name-link"
                              >
                                {guest.first_name && guest.last_name 
                                  ? `${guest.first_name} ${guest.last_name}` 
                                  : (guest.nickname || guest.email)}
                              </Link>
                            </td>
                            <td>{guest.email}</td>
                            <td>{guest.total_guesses}</td>
                            <td>${guest.amount_owed.toFixed(2)}</td>
                            <td>
                              <span className={`payment-status status-${guest.payment_status}`}>
                                {guest.payment_status === 'paid' ? 'Paid' : 
                                 guest.payment_status === 'partial' ? 'Partial' : 'Pending'}
                              </span>
                            </td>
                            <td>
                              <div className="guest-actions">
                                {guest.payment_status !== 'paid' && (
                                  <button 
                                    className="btn btn-small btn-success"
                                    onClick={() => handleUpdatePayment(guest.id, 'mark_paid')}
                                    title="Mark as paid"
                                  >
                                    Pay
                                  </button>
                                )}
                                
                                {guest.payment_status !== 'pending' && (
                                  <button 
                                    className="btn btn-small btn-warning"
                                    onClick={() => handleUpdatePayment(guest.id, 'mark_unpaid')}
                                    title="Mark as unpaid"
                                  >
                                    Unpaid
                                  </button>
                                )}
                                
                                {guest.total_guesses === 0 && (
                                  <button 
                                    className="btn btn-small btn-danger"
                                    onClick={() => handleRemoveGuest(guest.id)}
                                    title="Remove guest"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HostDashboard;
