/**
 * Login Persistence Test Script
 * 
 * This script focuses on identifying issues with login persistence
 * by monitoring the form submission process and tracking what happens
 * to the authentication data.
 */

// Immediately invoked function to avoid polluting global namespace
const loginPersistenceTest = (function() {
    // Test configuration
    const config = {
        loginUrl: '/auth/host/login',
        loginEndpoint: '/auth/host/login',
        dashboardUrl: '/host/dashboard',
        testEmail: 'test@example.com',
        testPassword: 'password123'
    };

    // Helper: Clear any existing auth data
    function clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('isHost');
        localStorage.removeItem('currentUser');
        console.log('Auth data cleared from localStorage');
    }

    // Helper: Check current auth state
    function checkAuthState() {
        const token = localStorage.getItem('token');
        const isHostValue = localStorage.getItem('isHost');
        const userDataRaw = localStorage.getItem('currentUser');
        
        console.log('Current auth state:');
        console.log('- token:', token ? 'present' : 'missing');
        console.log('- isHost:', isHostValue);
        
        let userData = null;
        if (userDataRaw) {
            try {
                userData = JSON.parse(userDataRaw);
                console.log('- currentUser:', userData);
            } catch (e) {
                console.error('Error parsing currentUser:', e);
                console.log('- currentUser (raw):', userDataRaw);
            }
        } else {
            console.log('- currentUser: missing');
        }
        
        return {
            isAuthenticated: !!token,
            isHost: isHostValue === 'true',
            userData
        };
    }

    // Helper: Monitor fetch calls
    function monitorFetch() {
        const originalFetch = window.fetch;
        const fetchCalls = [];
        
        window.fetch = function monitoredFetch(url, options) {
            console.log(`Fetch called with URL: ${url}`);
            
            // Record this call
            const callRecord = {
                url,
                options: JSON.parse(JSON.stringify(options)),
                timestamp: Date.now()
            };
            
            // For login endpoint, capture additional data
            if (url === config.loginEndpoint) {
                console.log('LOGIN REQUEST DETECTED');
                try {
                    if (options.body) {
                        callRecord.requestBody = JSON.parse(options.body);
                    }
                } catch (e) {
                    console.error('Error parsing request body:', e);
                    callRecord.requestBodyRaw = options.body;
                }
            }
            
            fetchCalls.push(callRecord);
            
            // Call the original fetch
            const promise = originalFetch.apply(this, arguments);
            
            // For login endpoint responses, track what happens
            if (url === config.loginEndpoint) {
                return promise.then(response => {
                    // Clone the response to read the body without consuming it
                    const clone = response.clone();
                    
                    console.log(`Login response status: ${response.status}`);
                    callRecord.status = response.status;
                    
                    // Parse the response to see what data was returned
                    return clone.json().then(data => {
                        console.log('Login response data:', data);
                        callRecord.responseData = data;
                        
                        // Set a checkpoint to monitor localStorage after this returns
                        setTimeout(() => {
                            console.log('State AFTER login response processed:');
                            const authState = checkAuthState();
                            callRecord.authStateAfter = authState;
                            
                            // Verify auth data was properly stored
                            const allFieldsStored = 
                                !!localStorage.getItem('token') && 
                                !!localStorage.getItem('isHost') && 
                                !!localStorage.getItem('currentUser');
                            
                            if (!allFieldsStored) {
                                console.error('ISSUE DETECTED: Not all authentication fields were stored in localStorage');
                                console.log('This suggests the form handler or login success callback is not properly storing auth data');
                            } else {
                                console.log('✓ All auth fields are present in localStorage');
                                
                                // Verify the values stored are correct
                                try {
                                    const userData = JSON.parse(localStorage.getItem('currentUser'));
                                    const isHost = localStorage.getItem('isHost');
                                    
                                    if (userData.email !== config.testEmail) {
                                        console.error(`ISSUE DETECTED: Stored email (${userData.email}) doesn't match login email (${config.testEmail})`);
                                    }
                                    
                                    if (userData.is_host !== true && isHost !== 'true') {
                                        console.error('ISSUE DETECTED: User is not marked as host');
                                    }
                                } catch (e) {
                                    console.error('ISSUE DETECTED: Could not parse user data from localStorage:', e);
                                }
                            }
                            
                            // Check for redirect
                            setTimeout(() => {
                                if (window.location.pathname !== config.dashboardUrl) {
                                    console.error(`ISSUE DETECTED: Not redirected to dashboard. Current path: ${window.location.pathname}`);
                                } else {
                                    console.log('✓ Successfully redirected to dashboard');
                                }
                            }, 1000); // Check redirect after 1 second
                        }, 100); // Check localStorage after 100ms
                        
                        return response;
                    }).catch(err => {
                        console.error('Error parsing login response:', err);
                        callRecord.error = err.message;
                        return response;
                    });
                });
            }
            
            return promise;
        };
        
        return {
            calls: fetchCalls,
            restore: () => {
                window.fetch = originalFetch;
                console.log('Original fetch function restored');
            }
        };
    }

    // Main test function for login form submission
    function testLoginForm() {
        console.log('Starting login form monitoring...');
        console.log('Initial state:');
        clearAuthData();
        checkAuthState();
        
        // Only run if we're on the login page
        if (window.location.pathname !== config.loginUrl) {
            console.error(`This test must be run on the login page (${config.loginUrl})`);
            return false;
        }
        
        // Start monitoring fetch calls
        const monitor = monitorFetch();
        
        // Get form elements
        const form = document.querySelector('form.auth-form');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (!form || !emailInput || !passwordInput) {
            console.error('Could not find login form elements');
            monitor.restore();
            return false;
        }
        
        console.log('Found login form, filling in test credentials...');
        
        // Fill the form with test credentials
        emailInput.value = config.testEmail;
        passwordInput.value = config.testPassword;
        
        // Create a submit event
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        
        // Monitor submit event
        form.addEventListener('submit', (e) => {
            console.log('Form submit event triggered');
            console.log('Form data:', {
                email: emailInput.value,
                password: passwordInput.value
            });
        }, { once: true });
        
        // Submit the form
        console.log('Submitting login form...');
        form.dispatchEvent(submitEvent);
        
        // Set timeout to log results and clean up
        setTimeout(() => {
            console.log('Test complete. Fetch calls observed:', monitor.calls.length);
            monitor.restore();
        }, 5000);
        
        return true;
    }

    // Another test to watch what happens on page load with auth data present
    function testPageLoadWithAuth() {
        console.log('Testing page load with auth data present...');
        
        // Set up test auth data
        const testData = {
            id: 1,
            email: config.testEmail,
            first_name: 'Test',
            last_name: 'User',
            is_host: true,
            hosted_events_count: 1
        };
        
        localStorage.setItem('token', 'test-token-' + Date.now());
        localStorage.setItem('isHost', 'true');
        localStorage.setItem('currentUser', JSON.stringify(testData));
        
        console.log('Test auth data set in localStorage');
        
        // Check current state
        checkAuthState();
        
        // Create a new monitor
        const monitor = monitorFetch();
        
        // Load the dashboard page
        console.log(`Loading dashboard page: ${config.dashboardUrl}`);
        window.location.href = config.dashboardUrl;
        
        // Note: can't do anything after this since we're navigating away
        return true;
    }

    // Check the login form handler implementation
    function inspectLoginFormHandler() {
        console.log('Inspecting login form handler...');
        
        // Find login form handler
        const formHandler = document.querySelector('form.auth-form')?.onsubmit;
        
        if (!formHandler) {
            // Check if there's an event listener
            console.log('No direct onsubmit handler found, checking for addEventListener');
            console.log('This requires checking the source code');
            
            // Get main.js content to analyze
            fetch('/static/js/main.js')
                .then(response => response.text())
                .then(source => {
                    console.log('Analyzing main.js for login form handlers:');
                    
                    // Check for form handler patterns
                    const formSubmitPattern = /form\.addEventListener\(['"']submit/;
                    const hasFormSubmitListener = formSubmitPattern.test(source);
                    
                    console.log('Form submit event listener found:', hasFormSubmitListener);
                    
                    // Check for localStorage setting patterns
                    const localStoragePattern = /localStorage\.setItem/g;
                    const localStorageMatches = source.match(localStoragePattern) || [];
                    
                    console.log('localStorage.setItem calls:', localStorageMatches.length);
                    
                    // Check for specific auth data storage
                    const tokenStoragePattern = /localStorage\.setItem\(['"']token/;
                    const isHostStoragePattern = /localStorage\.setItem\(['"']isHost/;
                    const userDataStoragePattern = /localStorage\.setItem\(['"']currentUser/;
                    
                    console.log('Stores token:', tokenStoragePattern.test(source));
                    console.log('Stores isHost:', isHostStoragePattern.test(source));
                    console.log('Stores currentUser:', userDataStoragePattern.test(source));
                    
                    // Check auth-related fetch calls
                    const fetchPattern = /fetch\(['"']\/auth\/host\/login/;
                    console.log('Makes fetch to login endpoint:', fetchPattern.test(source));
                    
                    // Check for JSON parsing
                    const jsonParsePattern = /JSON\.parse/g;
                    const jsonStringifyPattern = /JSON\.stringify/g;
                    
                    console.log('JSON.parse calls:', (source.match(jsonParsePattern) || []).length);
                    console.log('JSON.stringify calls:', (source.match(jsonStringifyPattern) || []).length);
                    
                    // Alert on possible issues
                    if (!hasFormSubmitListener) {
                        console.error('ISSUE: No form submit listener found in main.js');
                    }
                    
                    if (!tokenStoragePattern.test(source) || !isHostStoragePattern.test(source) || !userDataStoragePattern.test(source)) {
                        console.error('ISSUE: Not all required auth data is being stored in localStorage');
                    }
                    
                    if (!fetchPattern.test(source)) {
                        console.error('ISSUE: No fetch call to login endpoint found');
                    }
                });
        } else {
            console.log('Found direct onsubmit handler on login form');
            // We could try to analyze the handler function but it's complex
        }
    }

    // Return public API
    return {
        run: testLoginForm,
        testPageLoad: testPageLoadWithAuth,
        inspect: inspectLoginFormHandler,
        checkState: checkAuthState,
        clear: clearAuthData,
        config
    };
})();

console.log('Login persistence test script loaded. Run test with loginPersistenceTest.run()');