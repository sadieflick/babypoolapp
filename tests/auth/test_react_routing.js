/**
 * Test script for React frontend routing
 * 
 * This file tests the client-side routing in the React SPA to ensure
 * that routes properly handle authentication states and redirects.
 * 
 * Execute this in your browser console to test routing functionality.
 */

// Mock for localStorage to track values
const localStorageMock = (() => {
  const store = {};
  return {
    getItem: (key) => store[key],
    setItem: (key, value) => { store[key] = value; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); },
    getAll: () => store,
    removeItem: (key) => { delete store[key]; }
  };
})();

// Replace actual localStorage with mock for testing
const originalLocalStorage = window.localStorage;
window.localStorage = localStorageMock;

// Mock JWT token values
const mockTokens = {
  validGuestToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpc19ob3N0IjpmYWxzZX0.mock',
  validHostToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDU2LCJpc19ob3N0Ijp0cnVlfQ.mock',
  expiredToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nzg5LCJleHAiOjE1MTYyMzkwMjJ9.mock'
};

// Keep track of responses and redirects
const testResults = {
  redirects: [],
  renderCalls: [],
  authChecks: []
};

// Mock history.pushState to track redirects
const originalPushState = history.pushState;
history.pushState = function(state, title, url) {
  testResults.redirects.push(url);
  originalPushState.call(this, state, title, url);
};

// Mock components to track render calls
const componentMocks = {
  Dashboard: (props) => {
    testResults.renderCalls.push({ component: 'Dashboard', props });
    return null;
  },
  GuestLogin: (props) => {
    testResults.renderCalls.push({ component: 'GuestLogin', props });
    return null;
  },
  HostLogin: (props) => {
    testResults.renderCalls.push({ component: 'HostLogin', props });
    return null;
  },
  GuestDashboard: (props) => {
    testResults.renderCalls.push({ component: 'GuestDashboard', props });
    return null;
  },
  HostDashboard: (props) => {
    testResults.renderCalls.push({ component: 'HostDashboard', props });
    return null;
  }
};

// Testing utilities
function clearTestState() {
  localStorageMock.clear();
  testResults.redirects = [];
  testResults.renderCalls = [];
  testResults.authChecks = [];
}

function setupAuthState(isAuthenticated = false, isHost = false) {
  clearTestState();
  if (isAuthenticated) {
    const token = isHost ? mockTokens.validHostToken : mockTokens.validGuestToken;
    localStorageMock.setItem('token', token);
    localStorageMock.setItem('isHost', isHost);
    
    // Set a mock user object
    const user = {
      id: isHost ? 456 : 123,
      email: isHost ? 'host@example.com' : 'guest@example.com',
      first_name: isHost ? 'Host' : 'Guest',
      last_name: 'User',
      is_host: isHost
    };
    localStorageMock.setItem('currentUser', JSON.stringify(user));
  }
}

// Test cases
const testCases = [
  {
    name: "Unauthenticated user accessing home page",
    setup: () => setupAuthState(false),
    test: () => handleRouting('/'),
    assert: () => {
      // Should render the home page
      return testResults.renderCalls.some(call => call.component === 'HomePage');
    }
  },
  {
    name: "Unauthenticated user accessing guest dashboard",
    setup: () => setupAuthState(false),
    test: () => handleRouting('/guest/event/1'),
    assert: () => {
      // Should redirect to login
      return testResults.redirects.includes('/auth/guest_login');
    }
  },
  {
    name: "Unauthenticated user accessing host dashboard",
    setup: () => setupAuthState(false),
    test: () => handleRouting('/host/dashboard'),
    assert: () => {
      // Should redirect to login
      return testResults.redirects.includes('/auth/host_login');
    }
  },
  {
    name: "Authenticated guest accessing guest dashboard",
    setup: () => setupAuthState(true, false),
    test: () => handleRouting('/guest/event/1'),
    assert: () => {
      // Should render the guest dashboard
      return testResults.renderCalls.some(call => call.component === 'GuestDashboard');
    }
  },
  {
    name: "Authenticated guest trying to access host dashboard",
    setup: () => setupAuthState(true, false),
    test: () => handleRouting('/host/dashboard'),
    assert: () => {
      // Should redirect to guest dashboard/home
      return testResults.redirects.includes('/guest/dashboard') || testResults.redirects.includes('/');
    }
  },
  {
    name: "Authenticated host accessing host dashboard",
    setup: () => setupAuthState(true, true),
    test: () => handleRouting('/host/dashboard'),
    assert: () => {
      // Should render the host dashboard
      return testResults.renderCalls.some(call => call.component === 'HostDashboard');
    }
  },
  {
    name: "Authenticated host trying to access guest dashboard",
    setup: () => setupAuthState(true, true),
    test: () => handleRouting('/guest/event/1'),
    assert: () => {
      // Should be able to view the guest dashboard too (hosts can see event details)
      return testResults.renderCalls.some(call => call.component === 'GuestDashboard');
    }
  },
  {
    name: "Guest login form submission with event code",
    setup: () => setupAuthState(false),
    test: async () => {
      // Mock form submission logic
      const mockResponse = {
        status: 'need_user_info',
        event_id: 123,
        event_title: 'Test Event'
      };
      
      // Record redirect after form submission
      await simulateGuestLoginSubmit('event_code', '1234', mockResponse);
      
      return testResults.redirects.includes('/auth/guest_login?event_id=123&need_info=true');
    }
  },
  {
    name: "Guest user info form submission",
    setup: () => setupAuthState(false),
    test: async () => {
      // Mock successful login response
      const mockResponse = {
        status: 'logged_in',
        user_id: 999,
        event_id: 123,
        is_host: false,
        access_token: mockTokens.validGuestToken,
        refresh_token: 'refresh123'
      };
      
      // Simulate form submission and check redirect
      await simulateUserInfoSubmit({
        event_id: 123,
        first_name: 'Test',
        last_name: 'User'
      }, mockResponse);
      
      // Should redirect to guest event page and set localStorage
      return testResults.redirects.includes('/guest/event/123') && 
             localStorageMock.getItem('token') === mockTokens.validGuestToken;
    }
  }
];

// Test runner
async function runAllTests() {
  console.log("🔍 Starting React routing tests...");
  
  let passCount = 0;
  let failCount = 0;
  
  for (const testCase of testCases) {
    console.log(`\nRunning test: ${testCase.name}`);
    testCase.setup();
    
    try {
      const result = await testCase.test();
      const passed = testCase.assert();
      
      if (passed) {
        console.log(`✅ PASSED: ${testCase.name}`);
        passCount++;
      } else {
        console.log(`❌ FAILED: ${testCase.name}`);
        console.log('Test results:', testResults);
        failCount++;
      }
    } catch (error) {
      console.error(`⚠️ ERROR: ${testCase.name}`, error);
      failCount++;
    }
  }
  
  console.log(`\n====== Test Results =======`);
  console.log(`Tests passed: ${passCount}`);
  console.log(`Tests failed: ${failCount}`);
  console.log(`Total: ${testCases.length}`);
  
  // Restore original localStorage
  window.localStorage = originalLocalStorage;
  // Restore original history.pushState
  history.pushState = originalPushState;
}

// Helper functions for simulation
async function simulateGuestLoginSubmit(loginType, value, mockResponse) {
  // Mock fetch response
  const originalFetch = window.fetch;
  window.fetch = () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockResponse)
  });
  
  // Create a mock form submission event
  const formData = loginType === 'event_code' ? 
    { login_type: 'event_code', event_code: value } : 
    { login_type: 'email', email: value };
  
  // Simulate the form submission logic
  try {
    if (mockResponse.status === 'need_user_info') {
      // Store event info and redirect
      localStorage.setItem('pendingEventId', mockResponse.event_id);
      localStorage.setItem('pendingEventTitle', mockResponse.event_title);
      history.pushState(
        {}, 
        '', 
        `/auth/guest_login?event_id=${mockResponse.event_id}&need_info=true`
      );
    }
  } finally {
    // Restore original fetch
    window.fetch = originalFetch;
  }
}

async function simulateUserInfoSubmit(formData, mockResponse) {
  // Mock fetch response
  const originalFetch = window.fetch;
  window.fetch = () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockResponse)
  });
  
  // Simulate the form submission logic
  try {
    if (mockResponse.status === 'logged_in') {
      // Store auth data
      localStorage.setItem('token', mockResponse.access_token);
      localStorage.setItem('refreshToken', mockResponse.refresh_token);
      localStorage.setItem('isHost', mockResponse.is_host);
      localStorage.setItem('currentUser', JSON.stringify({
        id: mockResponse.user_id,
        is_host: mockResponse.is_host,
        event_id: mockResponse.event_id
      }));
      
      // Redirect to event page
      history.pushState({}, '', `/guest/event/${mockResponse.event_id}`);
    }
  } finally {
    // Restore original fetch
    window.fetch = originalFetch;
  }
}

// Export for running in console
window.testReactRouting = runAllTests;

// Run the tests
if (typeof document !== 'undefined') {
  console.log('React routing tests loaded. Run tests with: testReactRouting()');
}