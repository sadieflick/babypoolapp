import os
import subprocess
import shutil
import time

print("Starting simplified React frontend build process...")

# Create needed directories
os.makedirs('static/js', exist_ok=True)
os.makedirs('static/css', exist_ok=True)

# Create a simplified main.js that will render the basic React app
def create_main_js():
    print("Creating simplified React bundle...")
    
    # Define the path to the main.js file
    main_js_path = 'static/js/main.js'
    
    # Check if we have the React components we need
    if not os.path.exists('frontend/src/App.js'):
        print("Error: frontend/src/App.js not found. Skipping bundling.")
        return False
    
    # If the main.js file already exists, keep it
    if os.path.exists(main_js_path):
        print(f"Not overwriting existing {main_js_path}")
        return True
    
    # Content for the main.js file
    js_content = """
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
            
            <!-- Buy Me a Coffee Section -->
            <div class="buy-coffee-container" style="background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); padding: 20px; margin: 30px auto; max-width: 500px; text-align: center;">
                <h3 style="color: #ff66b3; font-size: 1.5rem; margin-bottom: 15px;">Like this app? Buy me a coffee!</h3>
                <p style="color: #333; margin-bottom: 20px;">If you find this app useful, consider supporting my work with a small donation.</p>
                <img src="/static/images/venmo-qr.svg" alt="Venmo QR Code" style="max-width: 200px; height: auto; margin: 0 auto 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="font-weight: 500; color: #008CFF; margin-bottom: 10px;">Scan with Venmo app</p>
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
                    <p style="color: #888; margin: 0;">&copy; 2025 Baby Pool App</p>
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
                    emails = value.split(/\\n/).map(email => email.trim()).filter(Boolean);
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
                    pattern="\\d{4}" 
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
    console.log('Handling route:', path, 'Auth status:', isAuthenticated(), 'Is host:', isHost());
    
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
    
    // Default: render the home page for root or unhandled paths
    renderHomePage();
};

// Call the routing handler when the DOM is loaded
document.addEventListener('DOMContentLoaded', handleRouting);

// Listen for navigation events (if using history API)
window.addEventListener('popstate', handleRouting);
"""
    
    # Write the content to the file
    with open(main_js_path, 'w') as f:
        f.write(js_content)
    
    print(f"Created simplified React bundle at {main_js_path}")
    return True

# Create the temporary React app
create_main_js()

print("Simplified frontend build process completed.")
print("This temporary solution will be replaced with the full React build when the dependency issues are resolved.")