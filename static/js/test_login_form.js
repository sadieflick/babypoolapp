/**
 * Test script for the login form submission
 * 
 * This test simulates filling out and submitting the login form
 * to verify that our form interceptor works correctly.
 * 
 * To use this test:
 * 1. Navigate to the login page: /auth/host_login
 * 2. Open the browser console
 * 3. Include this script in your page or paste it into the console
 * 4. Call testLoginForm() function
 */

function testLoginForm() {
  console.log('Starting login form test...');
  
  // Get the form elements
  const form = document.querySelector('form.auth-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitButton = form.querySelector('button[type="submit"]');
  
  if (!form || !emailInput || !passwordInput || !submitButton) {
    console.error('LOGIN TEST FAILED: Could not find form elements');
    console.log('Form:', form);
    console.log('Email input:', emailInput);
    console.log('Password input:', passwordInput);
    console.log('Submit button:', submitButton);
    return;
  }
  
  console.log('Form elements found, proceeding with test...');
  
  // Mock fetch to intercept the form submission
  const originalFetch = window.fetch;
  let fetchCalled = false;
  let fetchOptions = null;
  
  window.fetch = function mockFetch(url, options) {
    console.log('Intercepted fetch call:', { url, options });
    fetchCalled = true;
    fetchOptions = options;
    
    // Return a successful response
    return Promise.resolve({
      ok: true,
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
  
  // Mock location.href to prevent actual navigation
  const originalHref = window.location.href;
  let redirectCalled = false;
  let redirectUrl = null;
  
  Object.defineProperty(window.location, 'href', {
    set: function(value) {
      console.log('Intercepted redirect to:', value);
      redirectCalled = true;
      redirectUrl = value;
      return value;
    }
  });
  
  // Clear localStorage before test
  localStorage.removeItem('token');
  localStorage.removeItem('isHost');
  localStorage.removeItem('currentUser');
  
  try {
    // Fill in the form
    emailInput.value = 'test@example.com';
    passwordInput.value = 'password123';
    
    console.log('Form filled, submitting...');
    
    // Programmatically submit the form
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
    
    // Check results after a short delay (to allow promises to resolve)
    setTimeout(() => {
      console.log('Checking test results...');
      
      // Verify that fetch was called with the right parameters
      if (!fetchCalled) {
        console.error('LOGIN TEST FAILED: fetch was not called');
        return;
      }
      
      console.log('✓ fetch was called');
      
      // Verify the fetch options
      if (!fetchOptions || fetchOptions.method !== 'POST') {
        console.error('LOGIN TEST FAILED: fetch was not called with POST method');
        return;
      }
      
      console.log('✓ fetch was called with POST method');
      
      // Verify that the body contains the email and password
      try {
        const body = JSON.parse(fetchOptions.body);
        if (body.email !== 'test@example.com' || body.password !== 'password123') {
          console.error('LOGIN TEST FAILED: fetch body does not contain correct credentials');
          console.log('Body:', body);
          return;
        }
        
        console.log('✓ fetch body contains correct credentials');
      } catch (e) {
        console.error('LOGIN TEST FAILED: could not parse fetch body');
        console.log('Body:', fetchOptions.body);
        return;
      }
      
      // Verify that localStorage was updated
      const token = localStorage.getItem('token');
      const isHost = localStorage.getItem('isHost');
      const currentUser = localStorage.getItem('currentUser');
      
      if (!token || !isHost || !currentUser) {
        console.error('LOGIN TEST FAILED: localStorage was not updated');
        console.log('Token:', token);
        console.log('isHost:', isHost);
        console.log('currentUser:', currentUser);
        return;
      }
      
      console.log('✓ localStorage was updated');
      
      // Verify that redirect was called
      if (!redirectCalled) {
        console.error('LOGIN TEST FAILED: redirect was not called');
        return;
      }
      
      console.log('✓ redirect was called');
      
      // Verify the redirect URL
      if (!redirectUrl || !redirectUrl.endsWith('/host/dashboard')) {
        console.error('LOGIN TEST FAILED: redirect was not to /host/dashboard');
        console.log('Redirect URL:', redirectUrl);
        return;
      }
      
      console.log('✓ redirect was to /host/dashboard');
      
      console.log('LOGIN TEST PASSED! All checks successful.');
    }, 500);
  } finally {
    // Restore original functions after 1 second
    setTimeout(() => {
      window.fetch = originalFetch;
      
      // Restore original location.href
      Object.defineProperty(window.location, 'href', {
        value: originalHref
      });
      
      // Clean up localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('isHost');
      localStorage.removeItem('currentUser');
      
      console.log('Test cleanup completed.');
    }, 1000);
  }
}

// Export the test function to window
window.testLoginForm = testLoginForm;

console.log('Login form test loaded. Run the test with: testLoginForm()');