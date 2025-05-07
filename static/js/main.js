
// Simplified React app bundle
// This is a temporary solution until we can get the full build process working

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
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google Logo" style="height: 20px; margin-right: 10px;">
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
                &copy; 2025 Baby Pool App
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

const renderDashboard = () => {
    const userData = getUserData();
    const userName = userData?.first_name || 'User';
    const hostedEventsCount = userData?.hosted_events_count || 0;

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
                        <a href="/host/event/create" style="text-decoration: none; background-color: #ff66b3; color: white; padding: 0.5rem 1rem; border-radius: 30px; font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem;">
                            <span>Create Event</span>
                        </a>
                    </div>
                    
                    ${hostedEventsCount === 0 ? `
                        <div style="background: white; border-radius: 10px; padding: 2rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <img src="https://img.icons8.com/pastel-glyph/64/ff66b3/confetti.png" alt="Celebration" style="width: 64px; height: 64px; margin-bottom: 1rem;">
                            <h3 style="color: #333; margin-bottom: 1rem;">Welcome to Baby Pool!</h3>
                            <p style="color: #666; margin-bottom: 2rem;">You haven't created any baby shower events yet. Create your first event to get started!</p>
                            <a href="/host/event/create" style="text-decoration: none; background-color: #ff66b3; color: white; padding: 0.75rem 1.5rem; border-radius: 30px; font-weight: 500; box-shadow: 0 4px 8px rgba(255, 102, 179, 0.3); transition: all 0.3s ease;">Create Your First Event</a>
                        </div>
                    ` : `
                        <div style="background: white; border-radius: 10px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h3 style="color: #333; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee;">Your Events (${hostedEventsCount})</h3>
                            <p>Loading your events...</p>
                            <!-- Events would be loaded dynamically here -->
                        </div>
                    `}
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
};

// Add login form handler to directly capture login without redirection
const addLoginHandler = () => {
    // Only add the handler if we're on the login page and the form exists
    const loginForm = document.querySelector('form.auth-form');
    if (!loginForm || window.location.pathname !== '/auth/host_login') {
        return;
    }
    
    console.log('Adding login form handler');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const submitButton = document.querySelector('button[type="submit"]');
        const errorDiv = document.querySelector('.error-message') || document.createElement('div');
        
        if (!errorDiv.classList.contains('error-message')) {
            errorDiv.classList.add('error-message');
            loginForm.prepend(errorDiv);
        }
        
        if (!emailInput || !passwordInput) {
            errorDiv.textContent = 'Form inputs not found';
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            errorDiv.textContent = 'Please enter email and password';
            return;
        }
        
        // Disable submit button and show loading
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Logging in...';
        }
        
        errorDiv.textContent = '';
        
        try {
            // Make the login request
            const response = await fetch('/auth/host/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Login failed');
            }
            
            const userData = await response.json();
            console.log('Login successful:', userData);
            
            // Store auth data in localStorage
            const token = Date.now().toString(); // Simple token
            localStorage.setItem('token', token);
            localStorage.setItem('isHost', userData.is_host);
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            console.log('Auth data stored in localStorage');
            
            // Redirect to dashboard
            window.location.href = '/host/dashboard';
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = error.message || 'Failed to login. Please try again.';
            
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
            }
        }
    });
};

// Routing
const handleRouting = () => {
    const path = window.location.pathname;
    console.log('Handling route:', path, 'Auth status:', isAuthenticated(), 'Is host:', isHost());
    
    // Add login form handler if we're on the login page
    if (path === '/auth/host_login') {
        setTimeout(addLoginHandler, 100); // Small delay to ensure DOM is fully rendered
    }
    
    // If we're at the dashboard and logged in as a host, show the dashboard
    if (path === '/host/dashboard') {
        if (isAuthenticated() && isHost()) {
            console.log('Rendering dashboard with user data:', getUserData());
            renderDashboard();
            return;
        } else {
            console.log('Not authenticated for dashboard, redirecting to login');
            window.location.href = '/auth/host_login';
            return;
        }
    }
    
    // Default: render the home page for root or unhandled paths
    renderHomePage();
};

// Debug functions
function debugAuthState() {
    console.log({
        isAuthenticated: isAuthenticated(),
        isHost: isHost(),
        userData: getUserData(),
        token: localStorage.getItem('token'),
        isHostStorage: localStorage.getItem('isHost'),
        userDataRaw: localStorage.getItem('currentUser')
    });
}

// Call the routing handler when the DOM is loaded
document.addEventListener('DOMContentLoaded', handleRouting);

// Listen for navigation events (if using history API)
window.addEventListener('popstate', handleRouting);

// Make helper functions accessible globally for testing
window.isAuthenticated = isAuthenticated;
window.isHost = isHost;
window.getUserData = getUserData;
window.handleRouting = handleRouting;
window.renderDashboard = renderDashboard;
window.debugAuthState = debugAuthState;
