/**
 * Frontend authentication test script
 * Run this in the browser console to test frontend authentication logic
 */

// Test auth status
function testAuthStatus() {
  console.log('======== TESTING AUTH STATUS ========');
  
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refresh_token');
  const isHost = localStorage.getItem('isHost');
  const currentUser = localStorage.getItem('currentUser');
  
  console.log('Token exists:', !!token);
  console.log('Refresh token exists:', !!refreshToken);
  console.log('Is host:', isHost);
  console.log('Current user exists:', !!currentUser);
  
  if (currentUser) {
    try {
      const userData = JSON.parse(currentUser);
      console.log('User data:', {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        is_host: userData.is_host,
        event_id: userData.event_id
      });
    } catch (e) {
      console.error('Error parsing current user data:', e);
    }
  }
  
  return {
    token,
    refreshToken,
    isHost,
    currentUser: currentUser ? JSON.parse(currentUser) : null
  };
}

// Test login with guest credentials
async function testGuestLogin(email = 'testguest@example.com') {
  console.log('======== TESTING GUEST LOGIN ========');
  console.log(`Logging in as ${email}`);
  
  try {
    // Clear any existing auth data
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isHost');
    localStorage.removeItem('currentUser');
    
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
    
    console.log('Response status:', response.status);
    
    // Log response headers
    console.log('Response headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    // Get response cookies
    console.log('Response cookies:', document.cookie);
    
    const data = await response.json();
    console.log('Response data:', {
      ...data,
      access_token: data.access_token ? '[PRESENT]' : '[MISSING]',
      refresh_token: data.refresh_token ? '[PRESENT]' : '[MISSING]'
    });
    
    // Store tokens if present
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      console.log('Stored access token in localStorage');
    }
    
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
      console.log('Stored refresh token in localStorage');
    }
    
    // Store user info
    if (data.is_host !== undefined) {
      localStorage.setItem('isHost', data.is_host);
      console.log('Stored isHost value:', data.is_host);
    }
    
    // Create user data object without tokens
    const userData = { ...data };
    delete userData.access_token;
    delete userData.refresh_token;
    
    localStorage.setItem('currentUser', JSON.stringify(userData));
    console.log('Stored user data in localStorage');
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Test accessing a protected API endpoint
async function testProtectedApiAccess() {
  console.log('======== TESTING PROTECTED API ACCESS ========');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found in localStorage. Please login first.');
    return null;
  }
  
  try {
    const response = await fetch('/api/current-user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    // Log response headers
    console.log('Response headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    if (!response.ok) {
      console.error('Failed to access protected endpoint');
      return null;
    }
    
    const data = await response.json();
    console.log('Protected API response:', data);
    return data;
  } catch (error) {
    console.error('API access error:', error);
    return null;
  }
}

// Test token verification endpoint
async function testTokenVerification() {
  console.log('======== TESTING TOKEN VERIFICATION ========');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found in localStorage. Please login first.');
    return null;
  }
  
  try {
    const response = await fetch('/auth/token/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Token verification failed');
      return null;
    }
    
    const data = await response.json();
    console.log('Token verification response:', data);
    return data;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Test token refresh
async function testTokenRefresh() {
  console.log('======== TESTING TOKEN REFRESH ========');
  
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    console.error('No refresh token found in localStorage. Please login first.');
    return null;
  }
  
  try {
    const response = await fetch('/auth/token/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Token refresh failed');
      return null;
    }
    
    const data = await response.json();
    console.log('Token refresh response:', {
      ...data,
      access_token: data.access_token ? '[PRESENT]' : '[MISSING]'
    });
    
    // Update access token if present
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      console.log('Updated access token in localStorage');
    }
    
    return data;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// Test redirect handling
function testRedirectHandling() {
  console.log('======== TESTING REDIRECT HANDLING ========');
  
  // Check if current URL has any problematic patterns
  const url = window.location.href;
  console.log('Current URL:', url);
  
  // Check for potential issues
  if (url.includes('/guest-info')) {
    console.error('Detected /guest-info in URL. This indicates a backend redirect collision with SPA routes.');
    console.log('This URL should be handled by the frontend router but appears to be a server-side redirect.');
  }
  
  if (url.includes('/auth/guest_login') && localStorage.getItem('token')) {
    console.error('User has a token but was redirected to login page.');
    console.log('This suggests the ProtectedRoute component is not properly checking authentication.');
  }
  
  // Check route definitions in the app
  console.log('Checking route paths from React Router:');
  // This is a simplistic approach - in a real app we'd need access to the router instance
  const possibleRoutes = [
    '/',
    '/host/login',
    '/host/register',
    '/guest/login',
    '/guest/event/:eventId',
    '/host/dashboard'
  ];
  
  console.log('Expected SPA routes:', possibleRoutes);
  
  return {
    currentUrl: url,
    isLoginPage: url.includes('/login'),
    isAuthenticated: !!localStorage.getItem('token'),
    isExpectedSpaRoute: possibleRoutes.some(route => 
      url.includes(route.replace(':eventId', ''))
    )
  };
}

// Run all tests in sequence
async function runAllTests() {
  console.log('=======================================');
  console.log('STARTING FRONTEND AUTH TESTS');
  console.log('=======================================');
  
  const initialStatus = testAuthStatus();
  console.log('Initial auth status:', initialStatus);
  
  // Only perform login if not already authenticated
  let loginData = null;
  if (!initialStatus.token) {
    loginData = await testGuestLogin();
    console.log('Login result:', loginData ? 'Success' : 'Failed');
  } else {
    console.log('Already logged in, skipping login test');
  }
  
  const authStatusAfterLogin = testAuthStatus();
  console.log('Auth status after login:', authStatusAfterLogin);
  
  if (authStatusAfterLogin.token) {
    const apiAccessResult = await testProtectedApiAccess();
    console.log('Protected API access result:', apiAccessResult ? 'Success' : 'Failed');
    
    const verificationResult = await testTokenVerification();
    console.log('Token verification result:', verificationResult ? 'Success' : 'Failed');
    
    const refreshResult = await testTokenRefresh();
    console.log('Token refresh result:', refreshResult ? 'Success' : 'Failed');
  }
  
  const redirectInfo = testRedirectHandling();
  console.log('Redirect handling assessment:', redirectInfo);
  
  console.log('=======================================');
  console.log('FRONTEND AUTH TESTS COMPLETED');
  console.log('=======================================');
  
  return {
    initialStatus,
    loginSuccess: !!loginData,
    authStatusAfterLogin,
    redirectInfo
  };
}

// To use this script in the browser console:
// 1. Paste the entire script
// 2. Call runAllTests() to run all tests
// 3. Or call individual test functions as needed