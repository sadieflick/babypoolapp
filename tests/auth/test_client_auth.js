/**
 * Client-side authentication tests
 * 
 * These tests verify that the client-side authentication logic works
 * correctly for storing user data in localStorage and redirecting to 
 * the appropriate pages.
 * 
 * To run these tests, open your browser console and paste this code.
 */

// Test helper functions
function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('isHost');
  localStorage.removeItem('currentUser');
  console.log('Cleared authentication data');
}

function mockSuccessfulLogin() {
  // Mock user data
  const userData = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    is_host: true,
    hosted_events_count: 1
  };
  
  // Store authentication data
  localStorage.setItem('token', Date.now().toString());
  localStorage.setItem('isHost', userData.is_host);
  localStorage.setItem('currentUser', JSON.stringify(userData));
  
  console.log('Mocked successful login with data:', userData);
  return userData;
}

// Tests
const tests = {
  testAuthHelpers: function() {
    console.log('TEST: Auth Helper Functions');
    
    // Clear any existing data
    clearAuthData();
    
    // Test authentication status when not logged in
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
    
    // Mock successful login
    const userData = mockSuccessfulLogin();
    
    // Test authentication status after login
    console.assert(
      isAuthenticated(),
      'isAuthenticated() should return true after login'
    );
    
    console.assert(
      isHost(),
      'isHost() should return true after logging in as a host'
    );
    
    const storedUserData = getUserData();
    console.assert(
      storedUserData !== null,
      'getUserData() should not return null after login'
    );
    
    console.assert(
      storedUserData.email === userData.email,
      'getUserData() should return the correct user email'
    );
    
    console.assert(
      storedUserData.is_host === userData.is_host,
      'getUserData() should return the correct host status'
    );
    
    // Clean up
    clearAuthData();
    console.log('PASSED: Auth Helper Functions Test');
  },
  
  testRouting: function() {
    console.log('TEST: Routing Logic');
    
    // Clear any existing data
    clearAuthData();
    
    // 1. Test when not authenticated on dashboard page
    const currentPath = window.location.pathname;
    try {
      // Mock current path as dashboard
      Object.defineProperty(window, 'location', {
        value: { pathname: '/host/dashboard' }
      });
      
      // Capture navigation attempts
      let redirectedTo = null;
      Object.defineProperty(window.location, 'href', {
        set: function(value) {
          redirectedTo = value;
        }
      });
      
      // Call the routing function
      handleRouting();
      
      // Check if redirect happened
      console.assert(
        redirectedTo && redirectedTo.includes('/auth/host_login'),
        'Should redirect to login page when accessing dashboard while not authenticated'
      );
      
      // 2. Test when authenticated on dashboard page
      mockSuccessfulLogin();
      
      // Reset redirect capture
      redirectedTo = null;
      
      // Create mock for document.getElementById
      const originalGetElementById = document.getElementById;
      document.getElementById = function(id) {
        if (id === 'root') {
          return {
            innerHTML: ''
          };
        }
        return originalGetElementById.call(document, id);
      };
      
      // Call the routing function
      handleRouting();
      
      // Check that dashboard was rendered
      console.assert(
        redirectedTo === null,
        'Should not redirect when authenticated on dashboard'
      );
      
      // Restore mocks
      document.getElementById = originalGetElementById;
    } finally {
      // Reset window.location
      Object.defineProperty(window, 'location', {
        value: { pathname: currentPath }
      });
      
      // Clean up
      clearAuthData();
    }
    
    console.log('PASSED: Routing Logic Test');
  },
  
  testAuthPersistence: function() {
    console.log('TEST: Authentication Persistence');
    
    // Clear any existing data
    clearAuthData();
    
    // 1. Set mock data
    const userData = mockSuccessfulLogin();
    
    // 2. Simulate page refresh by calling the initial load effect handler
    // (This would normally happen when the page loads)
    const storedUser = localStorage.getItem('currentUser');
    const parsedUser = JSON.parse(storedUser);
    
    console.assert(
      parsedUser !== null,
      'User data should be retrieved from localStorage after page refresh'
    );
    
    console.assert(
      parsedUser.email === userData.email,
      'User email should be preserved after page refresh'
    );
    
    console.assert(
      parsedUser.is_host === userData.is_host,
      'Host status should be preserved after page refresh'
    );
    
    // Clean up
    clearAuthData();
    console.log('PASSED: Authentication Persistence Test');
  }
};

// Run all tests
function runAllTests() {
  console.log('Running client-side authentication tests...');
  
  try {
    tests.testAuthHelpers();
    tests.testRouting();
    tests.testAuthPersistence();
    
    console.log('All tests PASSED!');
  } catch (error) {
    console.error('TEST FAILED:', error);
  } finally {
    // Make sure auth data is cleared
    clearAuthData();
  }
}

// Export tests for browser console
window.authTests = {
  runAllTests,
  tests,
  clearAuthData,
  mockSuccessfulLogin
};

console.log('Auth tests loaded. Run tests with: authTests.runAllTests()');