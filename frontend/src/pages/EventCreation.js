import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createEvent, uploadEventImage } from '../utils/api';

const EventCreation = () => {
  const navigate = useNavigate();
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  // Form state
  const [title, setTitle] = useState('');
  const [motherName, setMotherName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showHostEmail, setShowHostEmail] = useState(false);
  const [showerLink, setShowerLink] = useState('');
  const [guessPrice, setGuessPrice] = useState(1);
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [theme, setTheme] = useState('default');
  const [themeMode, setThemeMode] = useState('light');
  
  const [guestEmails, setGuestEmails] = useState('');
  const [parsedEmails, setParsedEmails] = useState([]);
  
  const [venmoUsername, setVenmoUsername] = useState('');
  const [venmoConfirm, setVenmoConfirm] = useState('');
  const [venmoPhone, setVenmoPhone] = useState('');
  
  const [nameGameEnabled, setNameGameEnabled] = useState(false);
  const [babyNameChosen, setBabyNameChosen] = useState(false);
  const [babyName, setBabyName] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };
  
  const handleGuestEmailsChange = (e) => {
    const value = e.target.value;
    setGuestEmails(value);
    
    // Parse emails for preview
    if (value) {
      // Try to detect format (comma-separated, newline-separated, or both)
      let emails = [];
      
      if (value.includes(',')) {
        emails = value.split(',').map(email => email.trim()).filter(Boolean);
      } else {
        emails = value.split(/\n/).map(email => email.trim()).filter(Boolean);
      }
      
      setParsedEmails(emails);
    } else {
      setParsedEmails([]);
    }
  };
  
  const removeEmail = (emailToRemove) => {
    const updatedEmails = parsedEmails.filter(email => email !== emailToRemove);
    setParsedEmails(updatedEmails);
    
    // Update the textarea
    setGuestEmails(updatedEmails.join(', '));
  };
  
  const nextStep = () => {
    if (currentStep === 1) {
      // Validate basic info
      if (!motherName || !eventDate || !dueDate) {
        setError('Please fill in all required fields');
        return;
      }
      
      // If mother's name is provided but title is not, set a default title
      if (!title && motherName) {
        setTitle(`${motherName}'s Baby Shower`);
      }
    }
    
    if (currentStep === 5 && venmoUsername && venmoUsername !== venmoConfirm) {
      setError('Venmo usernames do not match');
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    setError('');
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Validate at least the mother's name and due date are provided
      if (!motherName.trim()) {
        setError("Mother's name is required");
        setLoading(false);
        return;
      }
      
      if (!dueDate) {
        setError("Baby's due date is required");
        setLoading(false);
        return;
      }
      
      // Check venmo validation
      if (venmoUsername && !venmoPhone) {
        setError("Please enter the last 4 digits of your phone number for Venmo");
        setLoading(false);
        return;
      }
      
      // Prepare event data
      const eventData = {
        title: title || `${motherName}'s Baby Shower`,
        mother_name: motherName,
        partner_name: partnerName,
        event_date: eventDate,
        due_date: dueDate,
        show_host_email: showHostEmail,
        shower_link: showerLink,
        guess_price: parseFloat(guessPrice) || 1.0,
        theme,
        theme_mode: themeMode,
        name_game_enabled: nameGameEnabled,
        baby_name: babyName,
        baby_name_revealed: babyNameChosen,
        guest_emails: parsedEmails,
        venmo_username: venmoUsername,
        venmo_phone_last4: venmoPhone
      };
      
      console.log("Creating event with data:", eventData);
      
      // Create event
      const response = await createEvent(eventData);
      
      if (!response || !response.id) {
        throw new Error("Failed to receive valid response when creating event");
      }
      
      console.log("Event created successfully:", response);
      
      // Upload image if provided
      if (imageFile && response.id) {
        console.log("Uploading image for event:", response.id);
        await uploadEventImage(response.id, imageFile);
      }
      
      // Navigate to dashboard
      navigate('/host/dashboard', { 
        state: { 
          successMessage: "Your event was created successfully!" 
        }
      });
      
    } catch (err) {
      console.error("Event creation error:", err);
      setError(err.response?.data?.error || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderStepIndicator = () => {
    return (
      <div className="step-indicator">
        {[...Array(totalSteps)].map((_, index) => (
          <div 
            key={index}
            className={`step-dot ${currentStep >= index + 1 ? 'active' : ''}`}
          />
        ))}
      </div>
    );
  };
  
  // Step 1: Basic Info
  const renderBasicInfoStep = () => {
    return (
      <div className="creation-step">
        <h2>Event Details</h2>
        
        <div className="form-group">
          <label htmlFor="motherName">Mother-to-be's Name*</label>
          <input
            type="text"
            id="motherName"
            value={motherName}
            onChange={(e) => setMotherName(e.target.value)}
            placeholder="Enter mother's name"
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
            placeholder="Enter partner's name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="title">Event Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={motherName ? `${motherName}'s Baby Shower` : "Enter event title"}
          />
          <small>If left blank, we'll use "[Mother's Name]'s Baby Shower"</small>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="eventDate">Event Date*</label>
            <input
              type="date"
              id="eventDate"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="dueDate">Baby Due Date*</label>
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
          <label htmlFor="guessPrice">How much will guests contribute for each guess? ($)*</label>
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
          <label htmlFor="showerLink">Link to Baby Shower Website (Optional)</label>
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
    );
  };
  
  // Step 2: Upload Image
  const renderImageStep = () => {
    return (
      <div className="creation-step">
        <h2>Choose a Picture</h2>
        <p>Upload a picture of the mother-to-be or the couple</p>
        
        <div className="form-group">
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
          
          <input
            type="file"
            id="eventImage"
            onChange={handleImageChange}
            accept="image/jpeg,image/png,image/gif"
          />
        </div>
      </div>
    );
  };
  
  // Step 3: Choose Theme
  const renderThemeStep = () => {
    const themes = [
      { id: 'default', name: 'Baby Shower (Default)', colors: ['#ff99cc', '#99ccff', '#ffffff'] },
      { id: 'baby-blue', name: 'Baby Blue', colors: ['#99ccff', '#66b3ff', '#cce6ff'] },
      { id: 'baby-pink', name: 'Baby Pink', colors: ['#ff99cc', '#ff66b3', '#ffcce6'] },
      { id: 'mint', name: 'Mint', colors: ['#66ccb8', '#4dbca6', '#a3e2d7'] },
      { id: 'lavender', name: 'Lavender', colors: ['#b39ddb', '#9575cd', '#d1c4e9'] }
    ];
    
    return (
      <div className="creation-step">
        <h2>Choose a Theme</h2>
        
        <div className="theme-preview">
          {themes.map(themeOption => (
            <div 
              key={themeOption.id}
              className={`theme-card ${theme === themeOption.id ? 'selected' : ''}`}
              onClick={() => setTheme(themeOption.id)}
            >
              <h3>{themeOption.name}</h3>
              <div className="theme-colors">
                {themeOption.colors.map((color, index) => (
                  <div 
                    key={index}
                    className="color-dot"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="form-group">
          <label htmlFor="themeMode">Default Display Mode</label>
          <select
            id="themeMode"
            value={themeMode}
            onChange={(e) => setThemeMode(e.target.value)}
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>
      </div>
    );
  };
  
  // Step 4: Enter Guests
  const renderGuestsStep = () => {
    return (
      <div className="creation-step">
        <h2>Enter Guests</h2>
        <p>Enter guest emails (optional)</p>
        
        <div className="form-group">
          <label htmlFor="guestEmails">Guest Emails</label>
          <textarea
            id="guestEmails"
            className="guest-emails-area"
            value={guestEmails}
            onChange={handleGuestEmailsChange}
            placeholder="Enter emails separated by commas or new lines"
          />
          <small>Note: Guests can also find your event and enter their own information</small>
        </div>
        
        {parsedEmails.length > 0 && (
          <div className="parsed-emails">
            <h3>Guest List Preview</h3>
            <ul className="guest-email-list">
              {parsedEmails.map((email, index) => (
                <li key={index} className="guest-email-item">
                  <span>{email}</span>
                  <button 
                    type="button"
                    className="email-remove-btn"
                    onClick={() => removeEmail(email)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  // Step 5: Venmo Details
  const renderVenmoStep = () => {
    return (
      <div className="creation-step">
        <h2>Have Guests Venmo You</h2>
        <p>Set up payment information (optional)</p>
        
        <div className="form-group">
          <label htmlFor="venmoUsername">Your Venmo Username</label>
          <input
            type="text"
            id="venmoUsername"
            value={venmoUsername}
            onChange={(e) => setVenmoUsername(e.target.value)}
            placeholder="Enter your Venmo username"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="venmoConfirm">Confirm Venmo Username</label>
          <input
            type="text"
            id="venmoConfirm"
            value={venmoConfirm}
            onChange={(e) => setVenmoConfirm(e.target.value)}
            placeholder="Confirm your Venmo username"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="venmoPhone">Last 4 Digits of Your Phone Number</label>
          <input
            type="text"
            id="venmoPhone"
            value={venmoPhone}
            onChange={(e) => setVenmoPhone(e.target.value)}
            placeholder="Enter last 4 digits"
            maxLength="4"
            pattern="\d{4}"
          />
          <small>Required if you entered a Venmo username</small>
        </div>
      </div>
    );
  };
  
  // Step 6: Baby Name Game
  const renderNameGameStep = () => {
    return (
      <div className="creation-step">
        <h2>Add Baby Name Game</h2>
        <p>
          Let guests suggest names for the baby or guess the chosen name that hasn't been revealed yet.
          If you don't know if the baby already has a chosen name, you can skip this for now.
        </p>
        
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
              <label>Do the parents already have a name for the baby?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="babyNameChosen"
                    checked={babyNameChosen}
                    onChange={() => setBabyNameChosen(true)}
                  />
                  Yes
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="babyNameChosen"
                    checked={!babyNameChosen}
                    onChange={() => setBabyNameChosen(false)}
                  />
                  No
                </label>
              </div>
            </div>
            
            {babyNameChosen && (
              <div className="form-group">
                <label htmlFor="babyName">Baby's Chosen Name</label>
                <input
                  type="text"
                  id="babyName"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="Enter baby's name"
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  
  return (
    <div className="event-creation-container">
      <div className="page-header">
        <h1>Create New Event</h1>
        <Link to="/host/dashboard" className="btn btn-link">
          Back to Dashboard
        </Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {renderStepIndicator()}
      
      {currentStep === 1 && renderBasicInfoStep()}
      {currentStep === 2 && renderImageStep()}
      {currentStep === 3 && renderThemeStep()}
      {currentStep === 4 && renderGuestsStep()}
      {currentStep === 5 && renderVenmoStep()}
      {currentStep === 6 && renderNameGameStep()}
      
      <div className="step-controls">
        {currentStep > 1 && (
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={prevStep}
          >
            Previous
          </button>
        )}
        
        {currentStep < totalSteps ? (
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={nextStep}
          >
            Next
          </button>
        ) : (
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creating Event...' : 'Create Event'}
          </button>
        )}
        
        {currentStep > 1 && currentStep < totalSteps && (
          <button 
            type="button" 
            className="btn btn-link"
            onClick={() => setCurrentStep(totalSteps)}
          >
            Skip to Finish
          </button>
        )}
      </div>
    </div>
  );
};

export default EventCreation;
