/**
 * Client-side authentication testing script
 * 
 * This file contains functions to test different aspects of the client-side
 * authentication flow, including localStorage handling, form submission,
 * and redirection logic.
 * 
 * Usage:
 * 1. Include this script on your page: <script src="/static/js/auth_test.js"></script>
 * 2. Open browser console and run the tests using authTest.runAll() or individual tests
 */

const authTest = (function() {
  // Test configuration
  const config = {
    testEmail: 'test@example.com',
    testPassword: 'password123',
    loginUrl: '/auth/host/login',
    dashboardUrl: '/host/dashboard'
  };

  // Helper functions
  function clearAuthData() {
    console.log('Clearing authentication data from localStorage...');
    localStorage.removeItem('token');
    localStorage.removeItem('isHost');
    localStorage.removeItem('currentUser');
    console.log('Authentication data cleared.');
  }

  function setAuthData(userData = null) {
    console.log('Setting mock authentication data...');
    
    // Default test user if none provided
    if (!userData) {
      userData = {
        id: 1,
        email: config.testEmail,
        first_name: 'Test',
        last_name: 'User',
        is_host: true,
        hosted_events_count: 1
      };
    }
    
    const token = Date.now().toString();
    localStorage.setItem('token', token);
    localStorage.setItem('isHost', userData.is_host.toString());
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    console.log('Mock authentication data set:', {
      token,
      isHost: userData.is_host,
      userData
    });
    
    return userData;
  }

  function checkAuthHelpers() {
    console.log('Testing authentication helper functions...');
    
    // First, clear any existing auth data
    clearAuthData();
    
    // Test when not authenticated
    console.assert(
      !isAuthenticated(), 
      'isAuthenticated() should return false when not logged in'
    );
    
    console.assert(
      !isHost(),
      'isHost() should return false when not logged in'
    );
    
    console.assert(
      getUserData() === null,
      'getUserData() should return null when not logged in'
    );
    
    // Set mock auth data and test again
    const userData = setAuthData();
    
    console.assert(
      isAuthenticated(),
      'isAuthenticated() should return true after login'
    );
    
    console.assert(
      isHost(),
      'isHost() should return true after logging in as host'
    );
    
    const storedUserData = getUserData();
    console.assert(
      storedUserData !== null,
      'getUserData() should not return null after login'
    );
    
    console.assert(
      storedUserData.email === userData.email,
      'getUserData() should return correct email'
    );
    
    console.log('Authentication helper tests complete.');
    
    // Cleanup
    clearAuthData();
  }

  function testFormSubmission() {
    console.log('Testing login form submission...');
    
    // Only run this test if we're on the login page
    if (window.location.pathname !== '/auth/host_login') {
      console.warn('This test should be run on the login page (/auth/host_login)');
      return false;
    }
    
    // Clear any existing auth data
    clearAuthData();
    
    // Get form elements
    const form = document.querySelector('form.auth-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = form?.querySelector('button[type="submit"]');
    
    if (!form || !emailInput || !passwordInput || !submitButton) {
      console.error('Could not find login form elements');
      return false;
    }
    
    // Mock fetch to intercept the form submission
    const originalFetch = window.fetch;
    let fetchCalled = false;
    let fetchUrl = null;
    let fetchOptions = null;
    
    window.fetch = function mockFetch(url, options) {
      console.log('Intercepted fetch call to', url);
      fetchCalled = true;
      fetchUrl = url;
      fetchOptions = options;
      
      // Return a successful mock response
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          id: 1,
          email: emailInput.value,
          first_name: 'Test',
          last_name: 'User',
          is_host: true,
          hosted_events_count: 1,
          message: 'Login successful'
        })
      });
    };
    
    // Mock redirection to prevent actual navigation
    const originalHref = window.location.href;
    let redirectCalled = false;
    let redirectUrl = null;
    
    Object.defineProperty(window.location, 'href', {
      set(value) {
        console.log('Intercepted redirect to:', value);
        redirectCalled = true;
        redirectUrl = value;
        return value;
      }
    });
    
    try {
      // Fill in the form
      emailInput.value = config.testEmail;
      passwordInput.value = config.testPassword;
      
      console.log('Submitting login form...');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      // Check results after a short delay
      setTimeout(() => {
        // Restore original functions
        window.fetch = originalFetch;
        
        // Check if fetch was called correctly
        if (!fetchCalled) {
          console.error('❌ fetch was not called during form submission');
          return;
        }
        
        console.log('✓ fetch was called');
        
        // Check fetch URL
        if (fetchUrl !== config.loginUrl) {
          console.error(`❌ fetch URL incorrect: expected ${config.loginUrl}, got ${fetchUrl}`);
          return;
        }
        
        console.log(`✓ fetch URL correct: ${fetchUrl}`);
        
        // Check fetch method
        if (!fetchOptions || fetchOptions.method !== 'POST') {
          console.error('❌ fetch method incorrect: expected POST');
          return;
        }
        
        console.log('✓ fetch method correct: POST');
        
        // Check fetch body
        try {
          const body = JSON.parse(fetchOptions.body);
          if (!body.email || !body.password) {
            console.error('❌ fetch body missing email or password');
            return;
          }
          
          if (body.email !== config.testEmail || body.password !== config.testPassword) {
            console.error(`❌ fetch body incorrect: expected ${config.testEmail}, got ${body.email}`);
            return;
          }
          
          console.log('✓ fetch body correct');
        } catch (e) {
          console.error('❌ Could not parse fetch body:', e);
          return;
        }
        
        // Check localStorage after a short delay
        setTimeout(() => {
          // Check if localStorage was updated
          const token = localStorage.getItem('token');
          const isHost = localStorage.getItem('isHost');
          const currentUser = localStorage.getItem('currentUser');
          
          if (!token) {
            console.error('❌ localStorage token not set');
          } else {
            console.log('✓ localStorage token set');
          }
          
          if (!isHost) {
            console.error('❌ localStorage isHost not set');
          } else {
            console.log('✓ localStorage isHost set');
          }
          
          if (!currentUser) {
            console.error('❌ localStorage currentUser not set');
          } else {
            console.log('✓ localStorage currentUser set');
          }
          
          // Check if redirect was called
          if (!redirectCalled) {
            console.error('❌ redirect not called');
          } else {
            console.log('✓ redirect called');
            
            if (!redirectUrl || !redirectUrl.endsWith(config.dashboardUrl)) {
              console.error(`❌ redirect URL incorrect: expected to end with ${config.dashboardUrl}, got ${redirectUrl}`);
            } else {
              console.log(`✓ redirect URL correct: ${redirectUrl}`);
            }
          }
          
          // Clean up for safety
          clearAuthData();
          
          console.log('Login form test complete.');
        }, 500);
      }, 300);
      
      return true;
    } catch (e) {
      console.error('Error during login form test:', e);
      window.fetch = originalFetch;
      return false;
    }
  }

  function testRoutingLogic() {
    console.log('Testing routing logic...');
    
    // First test: not authenticated on dashboard
    clearAuthData();
    
    // Store original path and add a mock redirect function
    const originalPath = window.location.pathname;
    let redirectCalled = false;
    let redirectUrl = null;
    
    const originalLocationHref = Object.getOwnPropertyDescriptor(window.location, 'href');
    Object.defineProperty(window.location, 'href', {
      set(value) {
        console.log('Intercepted redirect to:', value);
        redirectCalled = true;
        redirectUrl = value;
        return value;
      }
    });
    
    // Mock current path as dashboard
    Object.defineProperty(window.location, 'pathname', {
      get() {
        return '/host/dashboard';
      }
    });
    
    // Mock document.getElementById to return a fake root element
    const originalGetElementById = document.getElementById;
    document.getElementById = function mockGetElementById(id) {
      if (id === 'root') {
        return {
          innerHTML: ''
        };
      }
      return originalGetElementById.call(document, id);
    };
    
    try {
      console.log('Test 1: Not authenticated on dashboard');
      
      // Call the routing function
      handleRouting();
      
      // Check if redirection happened
      if (!redirectCalled) {
        console.error('❌ Not redirected when accessing dashboard while not authenticated');
      } else {
        console.log('✓ Redirected when accessing dashboard while not authenticated');
        
        if (!redirectUrl || !redirectUrl.includes('/auth/host_login')) {
          console.error(`❌ Incorrect redirect URL: expected to include /auth/host_login, got ${redirectUrl}`);
        } else {
          console.log(`✓ Correct redirect URL: ${redirectUrl}`);
        }
      }
      
      // Reset for next test
      redirectCalled = false;
      redirectUrl = null;
      
      console.log('Test 2: Authenticated on dashboard');
      
      // Set mock auth data
      setAuthData();
      
      // Call the routing function again
      handleRouting();
      
      // Now we should NOT be redirected
      if (redirectCalled) {
        console.error(`❌ Incorrectly redirected when already authenticated: ${redirectUrl}`);
      } else {
        console.log('✓ Not redirected when authenticated on dashboard');
      }
      
    } finally {
      // Restore all mocks
      document.getElementById = originalGetElementById;
      
      // Restore original pathname
      Object.defineProperty(window.location, 'pathname', {
        get() {
          return originalPath;
        }
      });
      
      // Restore original location.href
      Object.defineProperty(window.location, 'href', originalLocationHref);
      
      // Clean up
      clearAuthData();
    }
    
    console.log('Routing logic test complete.');
  }

  // Public API
  return {
    clearAuthData,
    setAuthData,
    checkAuth: checkAuthHelpers,
    testForm: testFormSubmission,
    testRouting: testRoutingLogic,
    runAll: function() {
      console.log('Running all client-side authentication tests...');
      checkAuthHelpers();
      
      // Only run form test if on login page
      if (window.location.pathname === '/auth/host_login') {
        testFormSubmission();
      } else {
        console.log('Skipping form test - not on login page');
      }
      
      testRoutingLogic();
      console.log('All tests complete!');
    },
    config
  };
})();

console.log('Authentication test script loaded. Run tests with authTest.runAll() or individual tests.');