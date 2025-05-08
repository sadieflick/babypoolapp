
// Improved React app bundle
// This implementation includes event creation functionality

// Authentication helper
const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
};

const isHost = () => {
    return localStorage.getItem('isHost') === 'true';
};

const getUserData = () => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }
    return null;
};

// API utility functions
const api = {
    // Create an event
    createEvent: async (eventData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(eventData),
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create event');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },
    
    // Upload an event image
    uploadEventImage: async (eventId, imageFile) => {
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('image', imageFile);
            
            const response = await fetch(`/api/events/${eventId}/image`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: formData,
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload image');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },
    
    // Get events for current user
    getEvents: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/events', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }
};

// Page rendering functions
const renderHomePage = () => {
    document.getElementById('root').innerHTML = `
        <div style="font-family: 'Poppins', sans-serif; padding: 2rem; text-align: center;">
            <h1 style="color: #ff66b3; margin-bottom: 1rem;">Baby Pool App</h1>
            <p style="margin-bottom: 2rem;">Create and join baby shower prediction games!</p>
            
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #ff66b3; margin-bottom: 1rem;">Welcome!</h2>
                
                <div style="display: flex; flex-direction: column; gap: 1rem; margin: 2rem 0;">
                    <a href="/auth/host_login" style="text-decoration: none; background-color: #ff99cc; color: white; padding: 0.75rem 1.5rem; border-radius: 30px; font-weight: 500; box-shadow: 0 4px 8px rgba(255, 153, 204, 0.3); transition: all 0.3s ease;">Login as Host</a>
                    <a href="/auth/guest_login" style="text-decoration: none; background-color: #99ccff; color: #333; padding: 0.75rem 1.5rem; border-radius: 30px; font-weight: 500; box-shadow: 0 4px 8px rgba(153, 204, 255, 0.3); transition: all 0.3s ease;">Join as Guest</a>
                    <div style="margin: 1rem 0; position: relative; text-align: center;">
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 0; position: absolute; top: 50%; width: 100%;">
                        <span style="background: white; padding: 0 10px; position: relative; color: #888;">or</span>
                    </div>
                    <a href="/google_auth/google_login" style="text-decoration: none; display: flex; align-items: center; justify-content: center; background-color: white; border: 1px solid #ddd; color: #444; padding: 0.75rem 1.5rem; border-radius: 30px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                        <img src="/static/images/googleicon.png" alt="Google Logo" style="height: 20px; margin-right: 10px;">
                        Sign in with Google
                    </a>
                </div>
                
                <div style="margin-top: 2rem;">
                    <h3 style="font-size: 1.2rem; color: #ff66b3; margin-bottom: 1rem;">Features</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; text-align: center;">
                        <div style="padding: 1rem; border-radius: 8px; background-color: #f8f9fa;">
                            <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">Date & Time Guessing</h4>
                            <p style="font-size: 0.9rem; color: #666;">Predict when the baby will arrive!</p>
                        </div>
                        <div style="padding: 1rem; border-radius: 8px; background-color: #f8f9fa;">
                            <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">Name Suggestions</h4>
                            <p style="font-size: 0.9rem; color: #666;">Guess the baby's name!</p>
                        </div>
                    </div>
                </div>
            </div>

            <footer style="margin-top: 3rem; font-size: 0.9rem; color: #666;">
                <div style="text-align: center;">
                    &copy; 2025 Baby Pool App
                </div>
                <div class="buy-coffee-footer">
                    <img src="/static/images/coffee-icon.svg" alt="Coffee" class="buy-coffee-qr">
                    <p class="buy-coffee-text">Like this app?</p>
                    <a class="buy-coffee-link" onclick="window.showBuyCoffeeModal()">Buy me a coffee</a>
                </div>
            </footer>
        </div>
    `;

    // Add event listeners
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('mouseenter', (e) => {
            e.target.style.transform = 'translateY(-2px)';
            if (e.target.textContent.includes('Host')) {
                e.target.style.backgroundColor = '#ff66b3';
            } else if (e.target.textContent.includes('Guest')) {
                e.target.style.backgroundColor = '#66b3ff';
            } else if (e.target.textContent.includes('Google')) {
                e.target.style.backgroundColor = '#f8f8f8';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            }
        });
        
        link.addEventListener('mouseleave', (e) => {
            e.target.style.transform = 'translateY(0)';
            if (e.target.textContent.includes('Host')) {
                e.target.style.backgroundColor = '#ff99cc';
            } else if (e.target.textContent.includes('Guest')) {
                e.target.style.backgroundColor = '#99ccff';
            } else if (e.target.textContent.includes('Google')) {
                e.target.style.backgroundColor = 'white';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }
        });
    });
};

const renderDashboard = async () => {
    const userData = getUserData();
    const userName = userData?.first_name || 'User';
    
    // Default dashboard HTML with loading state
    document.getElementById('root').innerHTML = `
        <div style="font-family: 'Poppins', sans-serif; min-height: 100vh; display: flex; flex-direction: column;">
            <!-- Navigation Bar -->
            <nav style="background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <h1 style="color: #ff66b3; margin: 0; font-size: 1.5rem;">Baby Pool</h1>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="color: #555;">Hello, ${userName}</span>
                    <button id="logout-btn" style="background: none; border: none; color: #888; cursor: pointer;">Logout</button>
                </div>
            </nav>
            
            <!-- Main Content -->
            <main style="flex: 1; padding: 2rem; background-color: #f8f9fa;">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h2 style="color: #333; margin: 0;">Host Dashboard</h2>
                        <a href="/host/event/create" id="create-event-btn" style="text-decoration: none; background-color: #ff66b3; color: white; padding: 0.5rem 1rem; border-radius: 30px; font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem;">
                            <span>Create Event</span>
                        </a>
                    </div>
                    
                    <div id="events-container" style="background: white; border-radius: 10px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <h3 style="color: #333; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee;">Your Events</h3>
                        <p>Loading your events...</p>
                    </div>
                </div>
            </main>
            
            <!-- Footer -->
            <footer style="background-color: white; padding: 1.5rem; text-align: center; box-shadow: 0 -2px 4px rgba(0,0,0,0.05);">
                <p style="color: #888; margin: 0 0 10px 0;">&copy; 2025 Baby Pool App</p>
                <div class="buy-coffee-footer">
                    <img src="/static/images/coffee-icon.svg" alt="Coffee" class="buy-coffee-qr">
                    <p class="buy-coffee-text">Like this app?</p>
                    <a class="buy-coffee-link" onclick="window.showBuyCoffeeModal()">Buy me a coffee</a>
                </div>
            </footer>
        </div>
    `;

    // Add logout functionality
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('isHost');
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    });
    
    // Add click handler for create event button
    document.getElementById('create-event-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/host/event/create';
    });
    
    // Try to load events
    try {
        const events = await api.getEvents();
        const eventsContainer = document.getElementById('events-container');
        
        if (events.length === 0) {
            eventsContainer.innerHTML = `
                <h3 style="color: #333; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee;">Your Events (0)</h3>
                <div style="text-align: center; padding: 2rem 0;">
                    <img src="https://img.icons8.com/pastel-glyph/64/ff66b3/confetti.png" alt="Celebration" style="width: 64px; height: 64px; margin-bottom: 1rem;">
                    <h3 style="color: #333; margin-bottom: 1rem;">Welcome to Baby Pool!</h3>
                    <p style="color: #666; margin-bottom: 2rem;">You haven't created any baby shower events yet. Create your first event to get started!</p>
                    <a href="/host/event/create" style="text-decoration: none; background-color: #ff66b3; color: white; padding: 0.75rem 1.5rem; border-radius: 30px; font-weight: 500; box-shadow: 0 4px 8px rgba(255, 102, 179, 0.3); transition: all 0.3s ease;">Create Your First Event</a>
                </div>
            `;
        } else {
            let eventsHTML = `
                <h3 style="color: #333; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee;">Your Events (${events.length})</h3>
                <div class="events-list" style="display: grid; gap: 1rem;">
            `;
            
            events.forEach(event => {
                eventsHTML += `
                    <div class="event-card" style="padding: 1rem; border-radius: 8px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0; color: #333;">${event.title}</h4>
                            <p style="margin: 0; color: #666; font-size: 0.9rem;">Event code: ${event.event_code}</p>
                            <p style="margin: 0; color: #666; font-size: 0.9rem;">Date: ${event.event_date}</p>
                        </div>
                        <a href="/host/event/${event.id}/settings" style="text-decoration: none; background-color: #eee; color: #333; padding: 0.5rem 1rem; border-radius: 30px; font-size: 0.9rem;">Manage</a>
                    </div>
                `;
            });
            
            eventsHTML += '</div>';
            eventsContainer.innerHTML = eventsHTML;
        }
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('events-container').innerHTML = `
            <h3 style="color: #333; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee;">Your Events</h3>
            <div style="text-align: center; padding: 1rem 0; color: #cc0000;">
                <p>Error loading events. Please try again later.</p>
            </div>
        `;
    }
};

// Event Creation Form Implementation
const renderEventCreation = () => {
    // Set up the initial state
    let currentStep = 1;
    const totalSteps = 6;
    
    // Form state
    const formData = {
        title: '',
        mother_name: '',
        partner_name: '',
        event_date: '',
        due_date: '',
        show_host_email: false,
        shower_link: '',
        guess_price: 1,
        image_file: null,
        image_preview: '',
        theme: 'default',
        theme_mode: 'light',
        guest_emails: '',
        parsed_emails: [],
        venmo_username: '',
        venmo_confirm: '',
        venmo_phone_last4: '',
        name_game_enabled: false,
        baby_name_chosen: false,
        baby_name: ''
    };
    
    let loading = false;
    let error = '';
    
    // Render the initial step
    renderCurrentStep();
    
    function renderCurrentStep() {
        // Prepare the base layout
        document.getElementById('root').innerHTML = `
            <div style="font-family: 'Poppins', sans-serif; min-height: 100vh; display: flex; flex-direction: column;">
                <!-- Navigation Bar -->
                <nav style="background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <a href="/host/dashboard" style="color: #ff66b3; text-decoration: none; font-size: 1.5rem; font-weight: bold;">Baby Pool</a>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <button id="logout-btn" style="background: none; border: none; color: #888; cursor: pointer;">Logout</button>
                    </div>
                </nav>
                
                <!-- Main Content -->
                <main style="flex: 1; padding: 2rem; background-color: #f8f9fa;">
                    <div style="max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <h1 style="color: #ff66b3; margin-bottom: 2rem; text-align: center;">Create New Event</h1>
                        
                        <!-- Step Indicator -->
                        <div id="step-indicator" style="display: flex; justify-content: center; margin-bottom: 2rem;">
                            ${[...Array(totalSteps)].map((_, index) => `
                                <div style="width: 15px; height: 15px; border-radius: 50%; background-color: ${currentStep >= index + 1 ? '#ff66b3' : '#eee'}; margin: 0 5px;"></div>
                            `).join('')}
                        </div>
                        
                        <!-- Error Message -->
                        ${error ? `<div style="background-color: #ffe0e0; color: #cc0000; padding: 1rem; border-radius: 5px; margin-bottom: 1rem;">${error}</div>` : ''}
                        
                        <!-- Step Content -->
                        <div id="step-content"></div>
                        
                        <!-- Navigation Buttons -->
                        <div style="display: flex; justify-content: space-between; margin-top: 2rem;">
                            ${currentStep > 1 ? 
                                `<button id="prev-btn" style="background-color: #eee; border: none; padding: 0.75rem 1.5rem; border-radius: 30px; cursor: pointer;">Previous</button>` : 
                                `<div></div>`
                            }
                            
                            ${currentStep < totalSteps ? 
                                `<button id="next-btn" style="background-color: #ff66b3; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 30px; cursor: pointer;">Next</button>` : 
                                `<button id="submit-btn" style="background-color: #ff66b3; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 30px; cursor: pointer; ${loading ? 'opacity: 0.7;' : ''}" ${loading ? 'disabled' : ''}>${loading ? 'Creating Event...' : 'Create Event'}</button>`
                            }
                        </div>
                    </div>
                </main>
                
                <!-- Footer -->
                <footer style="background-color: white; padding: 1.5rem; text-align: center; box-shadow: 0 -2px 4px rgba(0,0,0,0.05);">
                    <p style="color: #888; margin: 0 0 10px 0;">&copy; 2025 Baby Pool App</p>
                    <div class="buy-coffee-footer">
                        <img src="/static/images/coffee-icon.svg" alt="Coffee" class="buy-coffee-qr">
                        <p class="buy-coffee-text">Like this app?</p>
                        <a class="buy-coffee-link" onclick="window.showBuyCoffeeModal()">Buy me a coffee</a>
                    </div>
                </footer>
            </div>
        `;
        
        // Add logout functionality
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('isHost');
            localStorage.removeItem('currentUser');
            window.location.href = '/';
        });
        
        // Add navigation button handlers
        document.getElementById('prev-btn')?.addEventListener('click', () => {
            currentStep = Math.max(currentStep - 1, 1);
            error = '';
            renderCurrentStep();
        });
        
        document.getElementById('next-btn')?.addEventListener('click', () => {
            // Validation for step 1
            if (currentStep === 1) {
                if (!formData.mother_name || !formData.event_date || !formData.due_date) {
                    error = 'Please fill in all required fields';
                    renderCurrentStep();
                    return;
                }
                
                // If mother's name is provided but title is not, set a default title
                if (!formData.title && formData.mother_name) {
                    formData.title = `${formData.mother_name}'s Baby Shower`;
                }
            }
            
            // Validation for step 5 (Venmo)
            if (currentStep === 5 && formData.venmo_username && formData.venmo_username !== formData.venmo_confirm) {
                error = 'Venmo usernames do not match';
                renderCurrentStep();
                return;
            }
            
            currentStep = Math.min(currentStep + 1, totalSteps);
            error = '';
            renderCurrentStep();
        });
        
        document.getElementById('submit-btn')?.addEventListener('click', handleSubmit);
        
        // Render the appropriate step content
        const stepContent = document.getElementById('step-content');
        switch (currentStep) {
            case 1:
                renderBasicInfoStep(stepContent);
                break;
            case 2:
                renderImageStep(stepContent);
                break;
            case 3:
                renderThemeStep(stepContent);
                break;
            case 4:
                renderGuestsStep(stepContent);
                break;
            case 5:
                renderVenmoStep(stepContent);
                break;
            case 6:
                renderNameGameStep(stepContent);
                break;
        }
    }
    
    // Step 1: Basic Info
    function renderBasicInfoStep(container) {
        container.innerHTML = `
            <h2 style="color: #333; margin-bottom: 1.5rem;">Event Details</h2>
            
            <div style="margin-bottom: 1.5rem;">
                <label for="motherName" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Mother-to-be's Name*</label>
                <input 
                    type="text" 
                    id="motherName" 
                    value="${formData.mother_name}" 
                    placeholder="Enter mother's name" 
                    style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;" 
                    required
                />
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <label for="partnerName" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Partner's Name (Optional)</label>
                <input 
                    type="text" 
                    id="partnerName" 
                    value="${formData.partner_name}" 
                    placeholder="Enter partner's name" 
                    style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;"
                />
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <label for="title" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Event Title</label>
                <input 
                    type="text" 
                    id="title" 
                    value="${formData.title}" 
                    placeholder="${formData.mother_name ? `${formData.mother_name}'s Baby Shower` : 'Enter event title'}" 
                    style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;"
                />
                <small style="color: #888; font-size: 0.8rem;">If left blank, we'll use "[Mother's Name]'s Baby Shower"</small>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <label for="eventDate" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Event Date*</label>
                    <input 
                        type="date" 
                        id="eventDate" 
                        value="${formData.event_date}" 
                        style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;" 
                        required
                    />
                </div>
                
                <div>
                    <label for="dueDate" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Baby Due Date*</label>
                    <input 
                        type="date" 
                        id="dueDate" 
                        value="${formData.due_date}" 
                        style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;" 
                        required
                    />
                </div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <label for="guessPrice" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">How much will guests contribute for each guess? ($)*</label>
                <input 
                    type="number" 
                    id="guessPrice" 
                    value="${formData.guess_price}" 
                    min="0.01" 
                    step="0.01" 
                    style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;" 
                    required
                />
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <label for="showerLink" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Link to Baby Shower Website (Optional)</label>
                <input 
                    type="url" 
                    id="showerLink" 
                    value="${formData.shower_link}" 
                    placeholder="https://example.com" 
                    style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;"
                />
            </div>
            
            <div style="margin-bottom: 1.5rem; display: flex; align-items: center;">
                <label for="showHostEmail" style="margin-right: 1rem; color: #555; font-weight: 500;">Show your email to guests</label>
                <label style="position: relative; display: inline-block; width: 60px; height: 30px;">
                    <input 
                        type="checkbox" 
                        id="showHostEmail" 
                        ${formData.show_host_email ? 'checked' : ''} 
                        style="opacity: 0; width: 0; height: 0;"
                    />
                    <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${formData.show_host_email ? '#ff66b3' : '#ccc'}; transition: .4s; border-radius: 34px;">
                        <span style="position: absolute; content: ''; height: 22px; width: 22px; left: ${formData.show_host_email ? '34px' : '4px'}; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                    </span>
                </label>
            </div>
        `;
        
        // Add event listeners for inputs
        document.getElementById('motherName').addEventListener('input', (e) => {
            formData.mother_name = e.target.value;
        });
        
        document.getElementById('partnerName').addEventListener('input', (e) => {
            formData.partner_name = e.target.value;
        });
        
        document.getElementById('title').addEventListener('input', (e) => {
            formData.title = e.target.value;
        });
        
        document.getElementById('eventDate').addEventListener('input', (e) => {
            formData.event_date = e.target.value;
        });
        
        document.getElementById('dueDate').addEventListener('input', (e) => {
            formData.due_date = e.target.value;
        });
        
        document.getElementById('guessPrice').addEventListener('input', (e) => {
            formData.guess_price = parseFloat(e.target.value) || 1;
        });
        
        document.getElementById('showerLink').addEventListener('input', (e) => {
            formData.shower_link = e.target.value;
        });
        
        document.getElementById('showHostEmail').addEventListener('change', (e) => {
            formData.show_host_email = e.target.checked;
            // Update the toggle appearance
            const toggleSpan = e.target.nextElementSibling;
            toggleSpan.style.backgroundColor = e.target.checked ? '#ff66b3' : '#ccc';
            toggleSpan.querySelector('span').style.left = e.target.checked ? '34px' : '4px';
        });
    }
    
    // Step 2: Upload Image
    function renderImageStep(container) {
        container.innerHTML = `
            <h2 style="color: #333; margin-bottom: 1.5rem;">Choose a Picture</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">Upload a picture of the mother-to-be or the couple</p>
            
            ${formData.image_preview ? `
                <div style="margin-bottom: 1.5rem; text-align: center;">
                    <img src="${formData.image_preview}" alt="Preview" style="max-width: 100%; max-height: 300px; border-radius: 8px;" />
                </div>
            ` : ''}
            
            <div style="margin-bottom: 1.5rem;">
                <label for="eventImage" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Choose an image</label>
                <input 
                    type="file" 
                    id="eventImage" 
                    accept="image/jpeg,image/png,image/gif" 
                    style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;"
                />
            </div>
        `;
        
        // Add event listener for file input
        document.getElementById('eventImage').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                formData.image_file = file;
                // Create a preview URL
                const previewUrl = URL.createObjectURL(file);
                formData.image_preview = previewUrl;
                renderCurrentStep();
            }
        });
    }
    
    // Step 3: Choose Theme
    function renderThemeStep(container) {
        const themes = [
            { id: 'default', name: 'Baby Shower (Default)', colors: ['#ff99cc', '#99ccff', '#ffffff'] },
            { id: 'baby-blue', name: 'Baby Blue', colors: ['#99ccff', '#66b3ff', '#cce6ff'] },
            { id: 'baby-pink', name: 'Baby Pink', colors: ['#ff99cc', '#ff66b3', '#ffcce6'] },
            { id: 'mint', name: 'Mint', colors: ['#66ccb8', '#4dbca6', '#a3e2d7'] },
            { id: 'lavender', name: 'Lavender', colors: ['#b39ddb', '#9575cd', '#d1c4e9'] }
        ];
        
        container.innerHTML = `
            <h2 style="color: #333; margin-bottom: 1.5rem;">Choose a Theme</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                ${themes.map(theme => `
                    <div 
                        class="theme-card" 
                        data-theme="${theme.id}" 
                        style="padding: 1rem; border-radius: 8px; border: 2px solid ${formData.theme === theme.id ? '#ff66b3' : '#eee'}; cursor: pointer; text-align: center; transition: all 0.3s ease;"
                    >
                        <h3 style="margin-top: 0; margin-bottom: 1rem; color: #333;">${theme.name}</h3>
                        <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            ${theme.colors.map(color => `
                                <div style="width: 25px; height: 25px; border-radius: 50%; background-color: ${color};"></div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <label for="themeMode" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Default Display Mode</label>
                <select 
                    id="themeMode" 
                    style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;"
                >
                    <option value="light" ${formData.theme_mode === 'light' ? 'selected' : ''}>Light Mode</option>
                    <option value="dark" ${formData.theme_mode === 'dark' ? 'selected' : ''}>Dark Mode</option>
                </select>
            </div>
        `;
        
        // Add event listeners for theme selection
        document.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                formData.theme = card.dataset.theme;
                // Update UI to show selection
                document.querySelectorAll('.theme-card').forEach(c => {
                    c.style.border = `2px solid ${c === card ? '#ff66b3' : '#eee'}`;
                });
            });
        });
        
        // Add event listener for theme mode selection
        document.getElementById('themeMode').addEventListener('change', (e) => {
            formData.theme_mode = e.target.value;
        });
    }
    
    // Step 4: Enter Guests
    function renderGuestsStep(container) {
        container.innerHTML = `
            <h2 style="color: #333; margin-bottom: 1.5rem;">Enter Guests</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">Enter guest emails (optional)</p>
            
            <div style="margin-bottom: 1.5rem;">
                <label for="guestEmails" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Guest Emails</label>
                <textarea 
                    id="guestEmails" 
                    placeholder="Enter emails separated by commas or new lines" 
                    style="width: 100%; height: 120px; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px; resize: vertical;"
                >${formData.guest_emails}</textarea>
                <small style="color: #888; font-size: 0.8rem;">Note: Guests can also find your event and enter their own information</small>
            </div>
            
            ${formData.parsed_emails.length > 0 ? `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: #333; margin-bottom: 1rem; font-size: 1.1rem;">Guest List Preview</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${formData.parsed_emails.map((email, index) => `
                            <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; margin-bottom: 0.5rem; background-color: #f8f9fa; border-radius: 5px;">
                                <span>${email}</span>
                                <button 
                                    class="remove-email" 
                                    data-email="${email}" 
                                    style="background: none; border: none; color: #ff6666; cursor: pointer; font-size: 1.2rem;"
                                >×</button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        
        // Add event listener for guest emails textarea
        document.getElementById('guestEmails').addEventListener('input', (e) => {
            const value = e.target.value;
            formData.guest_emails = value;
            
            // Parse emails for preview
            if (value) {
                // Try to detect format (comma-separated, newline-separated, or both)
                let emails = [];
                
                if (value.includes(',')) {
                    emails = value.split(',').map(email => email.trim()).filter(Boolean);
                } else {
                    emails = value.split(/\n/).map(email => email.trim()).filter(Boolean);
                }
                
                formData.parsed_emails = emails;
                renderCurrentStep();
            } else {
                formData.parsed_emails = [];
            }
        });
        
        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-email').forEach(button => {
            button.addEventListener('click', () => {
                const emailToRemove = button.dataset.email;
                formData.parsed_emails = formData.parsed_emails.filter(email => email !== emailToRemove);
                
                // Update the textarea
                formData.guest_emails = formData.parsed_emails.join(', ');
                renderCurrentStep();
            });
        });
    }
    
    // Step 5: Venmo Details
    function renderVenmoStep(container) {
        container.innerHTML = `
            <h2 style="color: #333; margin-bottom: 1.5rem;">Have Guests Venmo You</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">Set up payment information (optional)</p>
            
            <div style="margin-bottom: 1.5rem;">
                <label for="venmoUsername" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Your Venmo Username</label>
                <input 
                    type="text" 
                    id="venmoUsername" 
                    value="${formData.venmo_username}" 
                    placeholder="Enter your Venmo username" 
                    style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;"
                />
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <label for="venmoConfirm" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Confirm Venmo Username</label>
                <input 
                    type="text" 
                    id="venmoConfirm" 
                    value="${formData.venmo_confirm}" 
                    placeholder="Confirm your Venmo username" 
                    style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;"
                />
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <label for="venmoPhone" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Last 4 Digits of Your Phone Number</label>
                <input 
                    type="text" 
                    id="venmoPhone" 
                    value="${formData.venmo_phone_last4}" 
                    placeholder="Enter last 4 digits" 
                    maxlength="4" 
                    pattern="\d{4}" 
                    style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;"
                />
                <small style="color: #888; font-size: 0.8rem;">Required if you entered a Venmo username</small>
            </div>
        `;
        
        // Add event listeners for Venmo fields
        document.getElementById('venmoUsername').addEventListener('input', (e) => {
            formData.venmo_username = e.target.value;
        });
        
        document.getElementById('venmoConfirm').addEventListener('input', (e) => {
            formData.venmo_confirm = e.target.value;
        });
        
        document.getElementById('venmoPhone').addEventListener('input', (e) => {
            formData.venmo_phone_last4 = e.target.value;
        });
    }
    
    // Step 6: Baby Name Game
    function renderNameGameStep(container) {
        container.innerHTML = `
            <h2 style="color: #333; margin-bottom: 1.5rem;">Add Baby Name Game</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">
                Let guests suggest names for the baby or guess the chosen name that hasn't been revealed yet.
                If you don't know if the baby already has a chosen name, you can skip this for now.
            </p>
            
            <div style="margin-bottom: 1.5rem; display: flex; align-items: center;">
                <label for="nameGameEnabled" style="margin-right: 1rem; color: #555; font-weight: 500;">Enable Name Game</label>
                <label style="position: relative; display: inline-block; width: 60px; height: 30px;">
                    <input 
                        type="checkbox" 
                        id="nameGameEnabled" 
                        ${formData.name_game_enabled ? 'checked' : ''} 
                        style="opacity: 0; width: 0; height: 0;"
                    />
                    <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${formData.name_game_enabled ? '#ff66b3' : '#ccc'}; transition: .4s; border-radius: 34px;">
                        <span style="position: absolute; content: ''; height: 22px; width: 22px; left: ${formData.name_game_enabled ? '34px' : '4px'}; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                    </span>
                </label>
            </div>
            
            ${formData.name_game_enabled ? `
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Do the parents already have a name for the baby?</label>
                    <div style="display: flex; gap: 2rem;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input 
                                type="radio" 
                                name="babyNameChosen" 
                                value="yes" 
                                ${formData.baby_name_chosen ? 'checked' : ''} 
                                style="margin-right: 0.5rem;"
                            />
                            Yes
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input 
                                type="radio" 
                                name="babyNameChosen" 
                                value="no" 
                                ${!formData.baby_name_chosen ? 'checked' : ''} 
                                style="margin-right: 0.5rem;"
                            />
                            No
                        </label>
                    </div>
                </div>
                
                ${formData.baby_name_chosen ? `
                    <div style="margin-bottom: 1.5rem;">
                        <label for="babyName" style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">Baby's Name</label>
                        <input 
                            type="text" 
                            id="babyName" 
                            value="${formData.baby_name}" 
                            placeholder="Enter the baby's name" 
                            style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;"
                        />
                        <small style="color: #888; font-size: 0.8rem;">This will be hidden from guests until you choose to reveal it</small>
                    </div>
                ` : ''}
            ` : ''}
        `;
        
        // Add event listener for name game toggle
        document.getElementById('nameGameEnabled').addEventListener('change', (e) => {
            formData.name_game_enabled = e.target.checked;
            // Update the toggle appearance
            const toggleSpan = e.target.nextElementSibling;
            toggleSpan.style.backgroundColor = e.target.checked ? '#ff66b3' : '#ccc';
            toggleSpan.querySelector('span').style.left = e.target.checked ? '34px' : '4px';
            renderCurrentStep();
        });
        
        // Add event listeners for baby name chosen radio buttons
        if (formData.name_game_enabled) {
            document.querySelectorAll('input[name="babyNameChosen"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    formData.baby_name_chosen = e.target.value === 'yes';
                    renderCurrentStep();
                });
            });
            
            // Add event listener for baby name input if applicable
            if (formData.baby_name_chosen) {
                document.getElementById('babyName').addEventListener('input', (e) => {
                    formData.baby_name = e.target.value;
                });
            }
        }
    }
    
    // Form submission handler
    async function handleSubmit() {
        // Prevent multiple submissions
        if (loading) return;
        
        // Reset error state
        error = '';
        loading = true;
        renderCurrentStep();
        
        try {
            // Validate mother's name and due date
            if (!formData.mother_name.trim()) {
                error = "Mother's name is required";
                loading = false;
                renderCurrentStep();
                return;
            }
            
            if (!formData.due_date) {
                error = "Baby's due date is required";
                loading = false;
                renderCurrentStep();
                return;
            }
            
            // Check venmo validation
            if (formData.venmo_username && !formData.venmo_phone_last4) {
                error = "Please enter the last 4 digits of your phone number for Venmo";
                loading = false;
                renderCurrentStep();
                return;
            }
            
            // Prepare event data
            const eventData = {
                title: formData.title || `${formData.mother_name}'s Baby Shower`,
                mother_name: formData.mother_name,
                partner_name: formData.partner_name,
                event_date: formData.event_date,
                due_date: formData.due_date,
                show_host_email: formData.show_host_email,
                shower_link: formData.shower_link,
                guess_price: parseFloat(formData.guess_price) || 1.0,
                theme: formData.theme,
                theme_mode: formData.theme_mode,
                name_game_enabled: formData.name_game_enabled,
                baby_name: formData.baby_name,
                baby_name_revealed: formData.baby_name_chosen,
                guest_emails: formData.parsed_emails,
                venmo_username: formData.venmo_username,
                venmo_phone_last4: formData.venmo_phone_last4
            };
            
            console.log("Creating event with data:", eventData);
            
            // Create event
            const response = await api.createEvent(eventData);
            
            if (!response || !response.id) {
                throw new Error("Failed to receive valid response when creating event");
            }
            
            console.log("Event created successfully:", response);
            
            // Upload image if provided
            if (formData.image_file && response.id) {
                console.log("Uploading image for event:", response.id);
                await api.uploadEventImage(response.id, formData.image_file);
            }
            
            // Navigate to dashboard
            window.location.href = '/host/dashboard?success=true';
            
        } catch (err) {
            console.error("Event creation error:", err);
            error = err.message || 'Failed to create event. Please try again.';
            loading = false;
            renderCurrentStep();
        }
    }
};

// Routing
const handleRouting = async () => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    console.log('Handling route:', path, 'Auth status:', isAuthenticated(), 'Is host:', isHost(), 'URL params:', window.location.search);
    
    if (path === '/host/dashboard') {
        if (isAuthenticated() && isHost()) {
            await renderDashboard();
            return;
        } else {
            // Not authenticated or not a host, redirect to login
            window.location.href = '/auth/host_login';
            return;
        }
    }
    
    if (path === '/host/event/create') {
        if (isAuthenticated() && isHost()) {
            renderEventCreation();
            return;
        } else {
            // Not authenticated or not a host, redirect to login
            window.location.href = '/auth/host_login';
            return;
        }
    }
    
    if (path === '/guest/login' || path === '/auth/guest_login') {
        // Check for URL parameters that indicate what form to show
        const eventId = searchParams.get('event_id');
        const needInfo = searchParams.get('need_info');
        const needProfile = searchParams.get('need_profile');
        
        if (eventId && needInfo === 'true') {
            // Show user info form for the specified event
            renderGuestUserInfoForm(eventId);
            return;
        } else if (needProfile === 'true') {
            // Show profile completion form
            renderGuestProfileForm();
            return;
        } else {
            // Show standard guest login form
            renderGuestLogin();
            return;
        }
    }
    
    // Default: render the home page for root or unhandled paths
    renderHomePage();
};

// Guest Login Form Implementation
const renderGuestLogin = () => {
    document.getElementById('root').innerHTML = `
        <div style="font-family: 'Poppins', sans-serif; padding: 2rem; text-align: center;">
            <h1 style="color: #ff66b3; margin-bottom: 1rem;">Baby Pool App</h1>
            
            <div style="max-width: 500px; margin: 40px auto; padding: 30px; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="font-size: 2rem; color: #ff66b3; margin-bottom: 10px;">Join Baby Pool</h2>
                    <p style="color: #666;">Join the fun and guess when the baby will arrive!</p>
                </div>
                
                <div id="error-message" style="display: none; color: #dc3545; font-size: 14px; margin-top: 5px; margin-bottom: 20px; font-weight: 500;"></div>
                <div id="success-message" style="padding: 15px; margin-bottom: 20px; border: 1px solid #c3e6cb; border-radius: 8px; color: #155724; background-color: #d4edda; display: none;"></div>
                
                <ul class="nav nav-tabs" id="loginTabs" role="tablist" style="border-bottom: 1px solid #ddd; margin-bottom: 20px;">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="code-tab" type="button" style="color: #ff66b3; border: none; border-bottom: 2px solid #ff99cc; padding: 10px 20px;">Event Code</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="search-tab" type="button" style="color: #666; border: none; border-bottom: 2px solid transparent; padding: 10px 20px;">Search Events</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="email-tab" type="button" style="color: #666; border: none; border-bottom: 2px solid transparent; padding: 10px 20px;">Email Login</button>
                    </li>
                </ul>
                
                <div class="tab-content" id="loginTabsContent" style="padding-top: 10px;">
                    <div class="tab-pane fade show active" id="code" role="tabpanel" style="text-align: left;">
                        <form id="code-form" novalidate>
                            <div style="margin-bottom: 20px;">
                                <label for="event-code" style="font-weight: 500; color: #444; display: block; margin-bottom: 8px;">Event Code</label>
                                <input type="text" id="event-code" name="event-code" placeholder="Enter the event code" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd;">
                                <div class="invalid-feedback" style="display: none; color: #dc3545; font-size: 14px; margin-top: 5px;"></div>
                            </div>
                            
                            <button type="submit" style="background-color: #ff99cc; border: none; color: white; padding: 12px 30px; font-weight: 500; border-radius: 30px; box-shadow: 0 4px 8px rgba(255, 153, 204, 0.3); transition: all 0.3s ease; width: 100%; margin-top: 10px; cursor: pointer;">Join Event</button>
                        </form>
                    </div>
                    
                    <div class="tab-pane fade" id="search" role="tabpanel" style="text-align: left; display: none;">
                        <form id="search-form" novalidate>
                            <div style="margin-bottom: 20px;">
                                <label for="search-term" style="font-weight: 500; color: #444; display: block; margin-bottom: 8px;">Search by Mother's Name</label>
                                <input type="text" id="search-term" name="search-term" placeholder="Enter mother's name" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd;">
                                <div class="invalid-feedback" style="display: none; color: #dc3545; font-size: 14px; margin-top: 5px;"></div>
                            </div>
                            
                            <button type="submit" style="background-color: #ff99cc; border: none; color: white; padding: 12px 30px; font-weight: 500; border-radius: 30px; box-shadow: 0 4px 8px rgba(255, 153, 204, 0.3); transition: all 0.3s ease; width: 100%; margin-top: 10px; cursor: pointer;">Search Events</button>
                        </form>
                        
                        <div id="search-results" style="margin-top: 1.5rem;"></div>
                    </div>
                    
                    <div class="tab-pane fade" id="email" role="tabpanel" style="text-align: left; display: none;">
                        <form id="email-form" novalidate>
                            <div style="margin-bottom: 20px;">
                                <label for="email-input" style="font-weight: 500; color: #444; display: block; margin-bottom: 8px;">Email</label>
                                <input type="email" id="email-input" name="email" placeholder="Enter your email" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd;">
                                <div class="invalid-feedback" style="display: none; color: #dc3545; font-size: 14px; margin-top: 5px;"></div>
                            </div>
                            
                            <button type="submit" style="background-color: #ff99cc; border: none; color: white; padding: 12px 30px; font-weight: 500; border-radius: 30px; box-shadow: 0 4px 8px rgba(255, 153, 204, 0.3); transition: all 0.3s ease; width: 100%; margin-top: 10px; cursor: pointer;">Continue</button>
                        </form>
                    </div>
                </div>
                
                <div style="width: 100%; text-align: center; border-bottom: 1px solid #ddd; line-height: 0.1em; margin: 20px 0; color: #888;">
                    <span style="background: white; padding: 0 10px;">or</span>
                </div>
                
                <a href="/google_auth/google_login" style="background-color: white; color: #444; padding: 12px 20px; border-radius: 30px; text-decoration: none; display: flex; align-items: center; justify-content: center; font-weight: 500; margin-top: 20px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                    <img src="/static/images/googleicon.png" alt="Google Logo" style="height: 24px; margin-right: 10px;">
                    Sign in with Google
                </a>
                
                <div style="margin-top: 20px; text-align: center;">
                    <a href="/" style="color: #ff66b3; text-decoration: none;">Back to Home</a>
                </div>
            </div>
            
            <footer style="margin-top: 3rem; text-align: center;">
                <div class="buy-coffee-footer">
                    <img src="/static/images/coffee-icon.svg" alt="Coffee" class="buy-coffee-qr">
                    <p class="buy-coffee-text">Like this app?</p>
                    <a class="buy-coffee-link" onclick="window.showBuyCoffeeModal()">Buy me a coffee</a>
                </div>
            </footer>
        </div>
    `;
    
    // Set up tab switching
    document.getElementById('code-tab').addEventListener('click', () => {
        // Update tab styles
        document.getElementById('code-tab').style.color = '#ff66b3';
        document.getElementById('code-tab').style.borderBottom = '2px solid #ff99cc';
        document.getElementById('search-tab').style.color = '#666';
        document.getElementById('search-tab').style.borderBottom = '2px solid transparent';
        document.getElementById('email-tab').style.color = '#666';
        document.getElementById('email-tab').style.borderBottom = '2px solid transparent';
        
        // Show/hide panes
        document.getElementById('code').style.display = 'block';
        document.getElementById('search').style.display = 'none';
        document.getElementById('email').style.display = 'none';
    });
    
    document.getElementById('search-tab').addEventListener('click', () => {
        // Update tab styles
        document.getElementById('search-tab').style.color = '#ff66b3';
        document.getElementById('search-tab').style.borderBottom = '2px solid #ff99cc';
        document.getElementById('code-tab').style.color = '#666';
        document.getElementById('code-tab').style.borderBottom = '2px solid transparent';
        document.getElementById('email-tab').style.color = '#666';
        document.getElementById('email-tab').style.borderBottom = '2px solid transparent';
        
        // Show/hide panes
        document.getElementById('search').style.display = 'block';
        document.getElementById('code').style.display = 'none';
        document.getElementById('email').style.display = 'none';
    });
    
    document.getElementById('email-tab').addEventListener('click', () => {
        // Update tab styles
        document.getElementById('email-tab').style.color = '#ff66b3';
        document.getElementById('email-tab').style.borderBottom = '2px solid #ff99cc';
        document.getElementById('code-tab').style.color = '#666';
        document.getElementById('code-tab').style.borderBottom = '2px solid transparent';
        document.getElementById('search-tab').style.color = '#666';
        document.getElementById('search-tab').style.borderBottom = '2px solid transparent';
        
        // Show/hide panes
        document.getElementById('email').style.display = 'block';
        document.getElementById('code').style.display = 'none';
        document.getElementById('search').style.display = 'none';
    });
    
    // Function to show error messages
    const showError = (message) => {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    };
    
    // Function to show success messages
    const showSuccess = (message) => {
        const successElement = document.getElementById('success-message');
        successElement.textContent = message;
        successElement.style.display = 'block';
    };
    
    // Handle event code form submission
    document.getElementById('code-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventCode = document.getElementById('event-code').value;
        
        if (!eventCode.trim()) {
            showError('Please enter an event code');
            return;
        }
        
        try {
            // Show loading state
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Checking...';
            submitButton.disabled = true;
            
            const response = await fetch('/auth/guest/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    login_type: 'event_code',
                    event_code: eventCode 
                })
            });
            
            // Reset button
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
            
            const data = await response.json();
            console.log('Event code response:', data);
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            if (data.status === 'need_user_info') {
                // Store event info in localStorage as a backup
                localStorage.setItem('pendingEventId', data.event_id);
                localStorage.setItem('pendingEventTitle', data.event_title);
                
                // Show a brief message before redirecting
                showSuccess('Event found! Please provide your information to join.');
                
                // Use a small timeout to ensure the message is seen
                setTimeout(() => {
                    // Redirect to collect user info
                    window.location.href = `/auth/guest_login?event_id=${data.event_id}&need_info=true`;
                }, 800);
                return;
            }
            
            if (data.status === 'need_profile_info') {
                // Show a brief message before redirecting
                showSuccess('Please complete your profile.');
                
                // Use a small timeout to ensure the message is seen
                setTimeout(() => {
                    // Redirect to profile completion form
                    window.location.href = `/auth/guest_login?need_profile=true`;
                }, 800);
                return;
            }
            
            if (data.status === 'logged_in') {
                showSuccess('Login successful! Redirecting...');
                
                // Store the JWT token and user data in localStorage
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('refreshToken', data.refresh_token);
                localStorage.setItem('isHost', data.is_host);
                localStorage.setItem('currentUser', JSON.stringify({
                    id: data.user_id,
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    nickname: data.nickname,
                    is_host: data.is_host,
                    event_id: data.event_id
                }));
                
                // Redirect to the appropriate page
                setTimeout(() => {
                    window.location.href = `/guest/event/${data.event_id}`;
                }, 1000);
            }
        } catch (err) {
            console.error('Error during login:', err);
            showError('An error occurred. Please try again.');
        }
    });
    
    // Handle search form submission
    document.getElementById('search-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const searchTerm = document.getElementById('search-term').value;
        
        if (!searchTerm.trim() || searchTerm.trim().length < 2) {
            showError('Please enter at least 2 characters to search');
            return;
        }
        
        try {
            const response = await fetch('/auth/guest/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    login_type: 'mother_search',
                    search_term: searchTerm 
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            // Handle the found events
            if (data.events && data.events.length > 0) {
                const resultsContainer = document.getElementById('search-results');
                
                let resultsHTML = `<h3 style="margin-bottom: 1rem;">Search Results</h3><ul style="list-style: none; padding: 0;">`;
                
                data.events.forEach(event => {
                    resultsHTML += `
                        <li style="margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h4 style="margin: 0 0 0.5rem 0;">${event.title || `Baby Shower for ${event.mother_name}`}</h4>
                                    <p style="margin: 0; font-size: 0.9rem;">Mother-to-be: ${event.mother_name}</p>
                                    <p style="margin: 0; font-size: 0.9rem;">Hosted by: ${event.host_name}</p>
                                </div>
                                <button 
                                    onclick="selectEvent(${event.id})" 
                                    style="background-color: #ff99cc; border: none; color: white; padding: 8px 16px; border-radius: 20px; cursor: pointer;"
                                >
                                    Select
                                </button>
                            </div>
                        </li>
                    `;
                });
                
                resultsHTML += `</ul>`;
                resultsContainer.innerHTML = resultsHTML;
                
                // Define the selectEvent function
                window.selectEvent = async (eventId) => {
                    try {
                        const response = await fetch('/auth/guest/select-event', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ event_id: eventId })
                        });
                        
                        const data = await response.json();
                        
                        if (data.error) {
                            showError(data.error);
                            return;
                        }
                        
                        if (data.status === 'need_user_info') {
                            // Redirect to a form to collect user info
                            window.location.href = `/auth/guest_login?event_id=${data.event_id}&need_info=true`;
                            return;
                        }
                        
                        if (data.status === 'logged_in') {
                            showSuccess('Login successful! Redirecting...');
                            
                            // Store the JWT token and user data in localStorage
                            localStorage.setItem('token', data.access_token);
                            localStorage.setItem('refreshToken', data.refresh_token);
                            localStorage.setItem('isHost', data.is_host);
                            localStorage.setItem('currentUser', JSON.stringify({
                                id: data.user_id,
                                email: data.email,
                                first_name: data.first_name,
                                last_name: data.last_name,
                                nickname: data.nickname,
                                is_host: data.is_host,
                                event_id: data.event_id
                            }));
                            
                            // Redirect to the appropriate page
                            setTimeout(() => {
                                window.location.href = `/guest/event/${data.event_id}`;
                            }, 1000);
                        }
                    } catch (err) {
                        console.error('Error during event selection:', err);
                        showError('An error occurred. Please try again.');
                    }
                };
            } else {
                document.getElementById('search-results').innerHTML = `
                    <div style="padding: 1rem; text-align: center; color: #666;">
                        No events found matching "${searchTerm}". Please try another search.
                    </div>
                `;
            }
        } catch (err) {
            console.error('Error during search:', err);
            showError('An error occurred during search. Please try again.');
        }
    });
    
    // Handle email form submission
    document.getElementById('email-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email-input').value;
        
        if (!email.trim() || !email.includes('@')) {
            showError('Please enter a valid email address');
            return;
        }
        
        try {
            const response = await fetch('/auth/guest/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    login_type: 'email',
                    email 
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            if (data.status === 'need_event') {
                showError('Please search for an event or enter an event code');
                document.getElementById('code-tab').click();
                return;
            }
            
            if (data.status === 'need_profile_info') {
                // Redirect to a form to collect profile info
                window.location.href = `/auth/guest_login?user_id=${data.user_id}&need_profile=true`;
                return;
            }
            
            if (data.status === 'logged_in') {
                showSuccess('Login successful!');
                
                // Store the JWT token and user data in localStorage
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('refreshToken', data.refresh_token);
                localStorage.setItem('isHost', data.is_host);
                localStorage.setItem('currentUser', JSON.stringify({
                    id: data.user_id,
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    nickname: data.nickname,
                    is_host: data.is_host,
                    event_id: data.event_id
                }));
                
                // If there's only one event, redirect to it directly
                if (data.event_id) {
                    showSuccess('Login successful! Redirecting to your event...');
                    setTimeout(() => {
                        window.location.href = `/guest/event/${data.event_id}`;
                    }, 1000);
                    return;
                }
                
                // If there are multiple events, show a list to choose from
                if (data.events && data.events.length > 0) {
                    showSuccess('Please select an event to join:');
                    const searchResults = document.getElementById('search-results');
                    searchResults.innerHTML = `<h3>Your Events</h3><ul style="list-style: none; padding: 0;">`;
                    
                    data.events.forEach(event => {
                        searchResults.innerHTML += `
                            <li style="margin-bottom: 0.5rem;">
                                <a href="/guest/event/${event.id}" style="display: block; padding: 0.75rem; background: #f8f9fa; border-radius: 4px; text-decoration: none; color: #333;">
                                    ${event.title || `Baby Shower for ${event.mother_name}`}
                                </a>
                            </li>
                        `;
                    });
                    
                    searchResults.innerHTML += `</ul>`;
                    document.getElementById('search').style.display = 'block';
                    document.getElementById('email').style.display = 'none';
                    
                    // Update tabs
                    document.getElementById('search-tab').style.color = '#ff66b3';
                    document.getElementById('search-tab').style.borderBottom = '2px solid #ff99cc';
                    document.getElementById('email-tab').style.color = '#666';
                    document.getElementById('email-tab').style.borderBottom = '2px solid transparent';
                }
            }
        } catch (err) {
            console.error('Error during email login:', err);
            showError('An error occurred. Please try again.');
        }
    });
};

// Guest User Info Form Implementation
const renderGuestUserInfoForm = (eventId) => {
    // First fetch event details to show event title
    fetch(`/api/events/${eventId}`)
        .then(response => {
            if (!response.ok) {
                return { error: 'Failed to fetch event details' };
            }
            return response.json();
        })
        .then(event => {
            // If we have an error, show default form without event title
            const eventTitle = event.error ? 'Baby Shower Event' : (event.title || `Baby Shower for ${event.mother_name}`);
            
            document.getElementById('root').innerHTML = `
                <div style="font-family: 'Poppins', sans-serif; padding: 2rem; text-align: center;">
                    <h1 style="color: #ff66b3; margin-bottom: 1rem;">Baby Pool App</h1>
                    
                    <div style="max-width: 500px; margin: 40px auto; padding: 30px; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="font-size: 2rem; color: #ff66b3; margin-bottom: 10px;">Complete Your Information</h2>
                            <p style="color: #666;">For: ${eventTitle}</p>
                        </div>
                        
                        <div id="error-message" style="display: none; color: #dc3545; font-size: 14px; margin-top: 5px; margin-bottom: 20px; font-weight: 500;"></div>
                        <div id="success-message" style="padding: 15px; margin-bottom: 20px; border: 1px solid #c3e6cb; border-radius: 8px; color: #155724; background-color: #d4edda; display: none;"></div>
                        
                        <form id="user-info-form" novalidate>
                            <div style="margin-bottom: 20px;">
                                <label for="first-name" style="font-weight: 500; color: #444; display: block; margin-bottom: 8px;">First Name*</label>
                                <input 
                                    type="text" 
                                    id="first-name" 
                                    name="first_name" 
                                    placeholder="Enter your first name" 
                                    style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd;"
                                    required
                                >
                                <div class="invalid-feedback" style="display: none; color: #dc3545; font-size: 14px; margin-top: 5px;"></div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label for="last-name" style="font-weight: 500; color: #444; display: block; margin-bottom: 8px;">Last Name*</label>
                                <input 
                                    type="text" 
                                    id="last-name" 
                                    name="last_name" 
                                    placeholder="Enter your last name" 
                                    style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd;"
                                    required
                                >
                                <div class="invalid-feedback" style="display: none; color: #dc3545; font-size: 14px; margin-top: 5px;"></div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label for="nickname" style="font-weight: 500; color: #444; display: block; margin-bottom: 8px;">Nickname (Optional)</label>
                                <input 
                                    type="text" 
                                    id="nickname" 
                                    name="nickname" 
                                    placeholder="Enter a nickname" 
                                    style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd;"
                                >
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label for="email" style="font-weight: 500; color: #444; display: block; margin-bottom: 8px;">Email</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    placeholder="Enter your email" 
                                    style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd;"
                                >
                                <div class="invalid-feedback" style="display: none; color: #dc3545; font-size: 14px; margin-top: 5px;"></div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label for="phone" style="font-weight: 500; color: #444; display: block; margin-bottom: 8px;">Phone Number (Required if no email)</label>
                                <input 
                                    type="tel" 
                                    id="phone" 
                                    name="phone" 
                                    placeholder="Enter your phone number" 
                                    style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd;"
                                >
                                <div class="invalid-feedback" style="display: none; color: #dc3545; font-size: 14px; margin-top: 5px;"></div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="font-weight: 500; color: #444; display: block; margin-bottom: 8px;">Payment Method Preference</label>
                                <div style="display: flex; gap: 20px;">
                                    <label style="display: flex; align-items: center; cursor: pointer;">
                                        <input 
                                            type="radio" 
                                            name="payment_method" 
                                            value="venmo" 
                                            checked 
                                            style="margin-right: 8px;"
                                        >
                                        Venmo
                                    </label>
                                    <label style="display: flex; align-items: center; cursor: pointer;">
                                        <input 
                                            type="radio" 
                                            name="payment_method" 
                                            value="cash" 
                                            style="margin-right: 8px;"
                                        >
                                        Cash
                                    </label>
                                </div>
                            </div>
                            
                            <button 
                                type="submit" 
                                style="background-color: #ff99cc; border: none; color: white; padding: 12px 30px; font-weight: 500; border-radius: 30px; box-shadow: 0 4px 8px rgba(255, 153, 204, 0.3); transition: all 0.3s ease; width: 100%; margin-top: 10px; cursor: pointer;"
                            >
                                Join Event
                            </button>
                        </form>
                        
                        <div style="margin-top: 20px; text-align: center;">
                            <a href="/auth/guest_login" style="color: #ff66b3; text-decoration: none;">Back to Login</a>
                        </div>
                    </div>
                    
                    <footer style="margin-top: 3rem; text-align: center;">
                        <div class="buy-coffee-footer">
                            <img src="/static/images/coffee-icon.svg" alt="Coffee" class="buy-coffee-qr">
                            <p class="buy-coffee-text">Like this app?</p>
                            <a class="buy-coffee-link" onclick="window.showBuyCoffeeModal()">Buy me a coffee</a>
                        </div>
                    </footer>
                </div>
            `;
            
            // Function to show error messages
            const showError = (message) => {
                const errorElement = document.getElementById('error-message');
                errorElement.textContent = message;
                errorElement.style.display = 'block';
                setTimeout(() => {
                    errorElement.style.display = 'none';
                }, 5000);
            };
            
            // Function to show success messages
            const showSuccess = (message) => {
                const successElement = document.getElementById('success-message');
                successElement.textContent = message;
                successElement.style.display = 'block';
            };
            
            // Function to show field validation errors
            const showFieldError = (fieldId, message) => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.style.borderColor = '#dc3545';
                    
                    const feedbackElement = field.nextElementSibling;
                    if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
                        feedbackElement.textContent = message;
                        feedbackElement.style.display = 'block';
                    }
                }
            };
            
            // Handle form submission
            document.getElementById('user-info-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Validate required fields
                const firstName = document.getElementById('first-name').value.trim();
                const lastName = document.getElementById('last-name').value.trim();
                const email = document.getElementById('email').value.trim();
                const phone = document.getElementById('phone').value.trim();
                
                let hasError = false;
                
                if (!firstName) {
                    showFieldError('first-name', 'First name is required');
                    hasError = true;
                }
                
                if (!lastName) {
                    showFieldError('last-name', 'Last name is required');
                    hasError = true;
                }
                
                if (!email && !phone) {
                    showFieldError('email', 'Either email or phone is required');
                    showFieldError('phone', 'Either email or phone is required');
                    hasError = true;
                }
                
                if (hasError) {
                    return;
                }
                
                // Get form data
                const formData = {
                    event_id: eventId,
                    first_name: firstName,
                    last_name: lastName,
                    nickname: document.getElementById('nickname').value.trim(),
                    email: email || null,
                    phone: phone || null,
                    payment_method: document.querySelector('input[name="payment_method"]:checked').value
                };
                
                try {
                    const response = await fetch('/auth/guest/select-event', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });
                    
                    const data = await response.json();
                    
                    if (data.error) {
                        showError(data.error);
                        return;
                    }
                    
                    if (data.status === 'logged_in') {
                        showSuccess('Login successful! Redirecting...');
                        
                        // Store the JWT token and user data
                        localStorage.setItem('token', data.access_token);
                        localStorage.setItem('refreshToken', data.refresh_token);
                        localStorage.setItem('isHost', data.is_host);
                        localStorage.setItem('currentUser', JSON.stringify({
                            id: data.user_id,
                            email: data.email,
                            first_name: data.first_name,
                            last_name: data.last_name,
                            nickname: data.nickname,
                            is_host: data.is_host,
                            event_id: data.event_id
                        }));
                        
                        // Redirect to the guest dashboard
                        setTimeout(() => {
                            window.location.href = `/guest/event/${data.event_id}`;
                        }, 1000);
                    }
                } catch (err) {
                    console.error('Error submitting user info:', err);
                    showError('An error occurred. Please try again.');
                }
            });
        })
        .catch(error => {
            console.error('Error fetching event details:', error);
            // Fallback to generic form
            // This would be similar to the code above but without specific event details
        });
};

// Guest Profile Form Implementation
const renderGuestProfileForm = () => {
    document.getElementById('root').innerHTML = `
        <div style="font-family: 'Poppins', sans-serif; padding: 2rem; text-align: center;">
            <h1 style="color: #ff66b3; margin-bottom: 1rem;">Baby Pool App</h1>
            
            <div style="max-width: 500px; margin: 40px auto; padding: 30px; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="font-size: 2rem; color: #ff66b3; margin-bottom: 10px;">Complete Your Profile</h2>
                    <p style="color: #666;">We need a bit more information to complete your profile.</p>
                </div>
                
                <div id="error-message" style="display: none; color: #dc3545; font-size: 14px; margin-top: 5px; margin-bottom: 20px; font-weight: 500;"></div>
                <div id="success-message" style="padding: 15px; margin-bottom: 20px; border: 1px solid #c3e6cb; border-radius: 8px; color: #155724; background-color: #d4edda; display: none;"></div>
                
                <form id="profile-form" novalidate>
                    <div style="margin-bottom: 20px;">
                        <label for="first-name" style="font-weight: 500; color: #444; display: block; margin-bottom: 8px;">First Name*</label>
                        <input 
                            type="text" 
                            id="first-name" 
                            name="first_name" 
                            placeholder="Enter your first name" 
                            style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd;"
                            required
                        >
                        <div class="invalid-feedback" style="display: none; color: #dc3545; font-size: 14px; margin-top: 5px;"></div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label for="last-name" style="font-weight: 500; color: #444; display: block; margin-bottom: 8px;">Last Name*</label>
                        <input 
                            type="text" 
                            id="last-name" 
                            name="last_name" 
                            placeholder="Enter your last name" 
                            style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd;"
                            required
                        >
                        <div class="invalid-feedback" style="display: none; color: #dc3545; font-size: 14px; margin-top: 5px;"></div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label for="nickname" style="font-weight: 500; color: #444; display: block; margin-bottom: 8px;">Nickname (Optional)</label>
                        <input 
                            type="text" 
                            id="nickname" 
                            name="nickname" 
                            placeholder="Enter a nickname" 
                            style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd;"
                        >
                    </div>
                    
                    <button 
                        type="submit" 
                        style="background-color: #ff99cc; border: none; color: white; padding: 12px 30px; font-weight: 500; border-radius: 30px; box-shadow: 0 4px 8px rgba(255, 153, 204, 0.3); transition: all 0.3s ease; width: 100%; margin-top: 10px; cursor: pointer;"
                    >
                        Update Profile
                    </button>
                </form>
            </div>
            
            <footer style="margin-top: 3rem; text-align: center;">
                <div class="buy-coffee-footer">
                    <img src="/static/images/coffee-icon.svg" alt="Coffee" class="buy-coffee-qr">
                    <p class="buy-coffee-text">Like this app?</p>
                    <a class="buy-coffee-link" onclick="window.showBuyCoffeeModal()">Buy me a coffee</a>
                </div>
            </footer>
        </div>
    `;
    
    // Function to show error messages
    const showError = (message) => {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    };
    
    // Function to show success messages
    const showSuccess = (message) => {
        const successElement = document.getElementById('success-message');
        successElement.textContent = message;
        successElement.style.display = 'block';
    };
    
    // Function to show field validation errors
    const showFieldError = (fieldId, message) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '#dc3545';
            
            const feedbackElement = field.nextElementSibling;
            if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
                feedbackElement.textContent = message;
                feedbackElement.style.display = 'block';
            }
        }
    };
    
    // Handle form submission
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate required fields
        const firstName = document.getElementById('first-name').value.trim();
        const lastName = document.getElementById('last-name').value.trim();
        
        let hasError = false;
        
        if (!firstName) {
            showFieldError('first-name', 'First name is required');
            hasError = true;
        }
        
        if (!lastName) {
            showFieldError('last-name', 'Last name is required');
            hasError = true;
        }
        
        if (hasError) {
            return;
        }
        
        // Get form data
        const formData = {
            first_name: firstName,
            last_name: lastName,
            nickname: document.getElementById('nickname').value.trim()
        };
        
        try {
            const response = await fetch('/auth/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            if (data.success) {
                showSuccess('Profile updated successfully! Redirecting...');
                
                // Redirect to the guest dashboard or event selection
                setTimeout(() => {
                    if (data.event_id) {
                        window.location.href = `/guest/event/${data.event_id}`;
                    } else {
                        window.location.href = '/auth/guest_login';
                    }
                }, 1000);
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            showError('An error occurred. Please try again.');
        }
    });
};

// Call the routing handler when the DOM is loaded
document.addEventListener('DOMContentLoaded', handleRouting);

// Listen for navigation events (if using history API)
window.addEventListener('popstate', handleRouting);
