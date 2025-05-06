import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEvent, updateEvent, uploadEventImage } from '../utils/api';
import { formatDateYMD } from '../utils/dateUtils';

const EventSettings = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Event form state
  const [title, setTitle] = useState('');
  const [motherName, setMotherName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babyNameRevealed, setBabyNameRevealed] = useState(false);
  const [nameGameEnabled, setNameGameEnabled] = useState(false);
  const [showHostEmail, setShowHostEmail] = useState(false);
  const [showerLink, setShowerLink] = useState('');
  const [guessPrice, setGuessPrice] = useState(1);
  const [theme, setTheme] = useState('default');
  const [themeMode, setThemeMode] = useState('light');
  const [imagePath, setImagePath] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventData = await getEvent(eventId);
        
        // Populate form with event data
        setTitle(eventData.title || '');
        setMotherName(eventData.mother_name || '');
        setPartnerName(eventData.partner_name || '');
        setEventDate(formatDateYMD(new Date(eventData.event_date)) || '');
        setDueDate(formatDateYMD(new Date(eventData.due_date)) || '');
        setBabyName(eventData.baby_name || '');
        setBabyNameRevealed(eventData.baby_name_revealed || false);
        setNameGameEnabled(eventData.name_game_enabled || false);
        setShowHostEmail(eventData.show_host_email || false);
        setShowerLink(eventData.shower_link || '');
        setGuessPrice(eventData.guess_price || 1);
        setTheme(eventData.theme || 'default');
        setThemeMode(eventData.theme_mode || 'light');
        setImagePath(eventData.image_path || '');
      } catch (err) {
        setError('Failed to load event details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId]);
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePath(previewUrl);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Update event details
      const eventData = {
        title,
        mother_name: motherName,
        partner_name: partnerName,
        event_date: eventDate,
        due_date: dueDate,
        baby_name: babyName,
        baby_name_revealed: babyNameRevealed,
        name_game_enabled: nameGameEnabled,
        show_host_email: showHostEmail,
        shower_link: showerLink,
        guess_price: parseFloat(guessPrice),
        theme,
        theme_mode: themeMode
      };
      
      await updateEvent(eventId, eventData);
      
      // Upload image if a new one was selected
      if (imageFile) {
        await uploadEventImage(eventId, imageFile);
      }
      
      setSuccessMessage('Event settings updated successfully');
      
      // Scroll to the top to show the success message
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update event settings');
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading event settings...</div>;
  }
  
  return (
    <div className="event-settings-container">
      <div className="page-header">
        <h1>Event Settings</h1>
        <Link to="/host/dashboard" className="btn btn-link">
          Back to Dashboard
        </Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit} className="event-settings-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="title">Event Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Baby Shower Title"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="motherName">Mother-to-be's Name</label>
              <input
                type="text"
                id="motherName"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="Mother's Name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="partnerName">Partner's Name (Optional)</label>
              <input
                type="text"
                id="partnerName"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Partner's Name"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="eventDate">Event Date</label>
              <input
                type="date"
                id="eventDate"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="dueDate">Baby Due Date</label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="guessPrice">Price per Guess ($)</label>
            <input
              type="number"
              id="guessPrice"
              value={guessPrice}
              onChange={(e) => setGuessPrice(e.target.value)}
              min="0.01"
              step="0.01"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="showerLink">Baby Shower Website Link (Optional)</label>
            <input
              type="url"
              id="showerLink"
              value={showerLink}
              onChange={(e) => setShowerLink(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          
          <div className="form-group toggle-switch">
            <label htmlFor="showHostEmail">Show your email to guests</label>
            <label className="switch">
              <input
                type="checkbox"
                id="showHostEmail"
                checked={showHostEmail}
                onChange={(e) => setShowHostEmail(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Baby Name Game</h2>
          
          <div className="form-group toggle-switch">
            <label htmlFor="nameGameEnabled">Enable Name Game</label>
            <label className="switch">
              <input
                type="checkbox"
                id="nameGameEnabled"
                checked={nameGameEnabled}
                onChange={(e) => setNameGameEnabled(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          
          {nameGameEnabled && (
            <>
              <div className="form-group">
                <label htmlFor="babyName">Baby's Name (if already chosen)</label>
                <input
                  type="text"
                  id="babyName"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="Baby's Name"
                />
              </div>
              
              <div className="form-group toggle-switch">
                <label htmlFor="babyNameRevealed">Has the name been revealed?</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    id="babyNameRevealed"
                    checked={babyNameRevealed}
                    onChange={(e) => setBabyNameRevealed(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </>
          )}
        </div>
        
        <div className="form-section">
          <h2>Appearance</h2>
          
          <div className="form-group">
            <label htmlFor="eventImage">Event Image</label>
            {imagePath && (
              <div className="image-preview">
                <img src={imagePath} alt="Event" />
              </div>
            )}
            <input
              type="file"
              id="eventImage"
              onChange={handleImageChange}
              accept="image/jpeg,image/png,image/gif"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="theme">Color Theme</label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="baby-blue">Baby Blue</option>
              <option value="baby-pink">Baby Pink</option>
              <option value="mint">Mint</option>
              <option value="lavender">Lavender</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="themeMode">Default Theme Mode</label>
            <select
              id="themeMode"
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link to="/host/dashboard" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EventSettings;
