/**
 * Guest Login Flow Diagnostic Test
 * 
 * This test script tracks the execution flow through the login process
 * to identify exactly where things break down.
 */

// Function to log state changes with timestamps
function logState(label, state) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${label}:`);
  console.log(JSON.stringify(state, null, 2));
  console.log('-------------------------');
}

// Mock the key parts of the React environment
function mockReactEnvironment() {
  // Create a fake DOM
  global.document = {
    getElementById: () => ({
      innerHTML: '',
      appendChild: () => {}
    }),
    createElement: () => ({
      setAttribute: () => {},
      appendChild: () => {},
      style: {}
    })
  };
  
  // Minimal React mock
  global.React = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: (initialValue) => [initialValue, () => {}],
    useEffect: (fn) => fn(),
    useReducer: (reducer, initialState) => {
      const state = { ...initialState };
      const dispatch = (action) => {
        console.log(`[DISPATCH] Action: ${action.type}`, action.payload || '');
        Object.assign(state, reducer(state, action));
        console.log(`[STATE UPDATE] New state after ${action.type}:`, state);
      };
      return [state, dispatch];
    },
    Fragment: 'fragment'
  };
  
  // Create a fake window object
  global.window = {
    location: { pathname: '/' }
  };
}

// Create a mock Auth context
function setupAuthContext() {
  return {
    login: (userData, accessToken, refreshToken) => {
      console.log('[AUTH] Login called with:');
      console.log('- userData:', userData);
      console.log('- accessToken:', accessToken ? 'present' : 'missing');
      console.log('- refreshToken:', refreshToken ? 'present' : 'missing');
    }
  };
}

// Mock API responses for testing
function mockApiResponses() {
  return {
    loginGuest: async (data) => {
      console.log('[API] loginGuest called with:', data);
      
      // Simulate the event code response
      if (data.login_type === 'event_code' && data.event_code === '8810') {
        console.log('[API] Returning need_name_only response');
        return {
          event_id: 2,
          event_title: "Haley's Shower",
          message: 'Please tell us your name to get started',
          status: 'need_name_only'
        };
      }
      
      return { error: 'Invalid request' };
    },
    
    selectEvent: async (data) => {
      console.log('[API] selectEvent called with:', data);
      
      // Simulate selection with nickname
      if (data.event_id && data.nickname) {
        return {
          status: 'logged_in',
          user_id: 1,
          is_host: false,
          event_id: data.event_id,
          event_title: "Haley's Shower",
          access_token: 'mock_token',
          refresh_token: 'mock_refresh_token'
        };
      }
      
      return { error: 'Missing required fields' };
    }
  };
}

// Create a test harness to run a simulated login flow
async function runDiagnosticTest() {
  console.log('=== STARTING GUEST LOGIN FLOW DIAGNOSTIC TEST ===');
  
  try {
    // Set up the test environment
    mockReactEnvironment();
    const auth = setupAuthContext();
    const api = mockApiResponses();
    
    // Load the actual reducer function from GuestLogin
    console.log('[TEST] Loading reducer and initial state...');
    
    // Simulate the reducer for testing
    const initialState = {
      step: 'initial',
      email: '',
      eventCode: '8810',
      selectedEvent: null,
      loginResponse: null,
      error: '',
      loading: false
    };
    
    function reducer(state, action) {
      console.log(`[REDUCER] Processing action: ${action.type}`);
      
      switch (action.type) {
        case 'SET_STEP':
          return { ...state, step: action.payload };
        case 'SET_ERROR':
          return { ...state, error: action.payload };
        case 'SET_LOADING':
          return { ...state, loading: action.payload };
        case 'SET_SELECTED_EVENT':
          return { ...state, selectedEvent: action.payload };
        case 'SET_LOGIN_RESPONSE':
          return { ...state, loginResponse: action.payload };
        case 'HANDLE_NEED_NAME_ONLY':
          console.log("[REDUCER] Handling need_name_only transition");
          return { 
            ...state, 
            step: 'name-only',
            selectedEvent: {
              id: action.payload.event_id,
              title: action.payload.event_title
            },
            loading: false
          };
        default:
          return state;
      }
    }
    
    // Create a state container
    let state = { ...initialState };
    
    // Track all state changes
    function dispatch(action) {
      console.log(`[DISPATCH] Action: ${action.type}`, action.payload || '');
      const prevState = { ...state };
      state = reducer(state, action);
      
      console.log('[STATE DIFF]');
      Object.keys(state).forEach(key => {
        if (JSON.stringify(state[key]) !== JSON.stringify(prevState[key])) {
          console.log(`- ${key}: ${JSON.stringify(prevState[key])} -> ${JSON.stringify(state[key])}`);
        }
      });
      
      logState('Current State', state);
      return state;
    }
    
    // Simulate the event code submission flow
    console.log('\n[TEST] Simulating event code submission...');
    
    // 1. Set loading state
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // 2. Call the API
    console.log('\n[TEST] Calling loginGuest API...');
    const response = await api.loginGuest({
      login_type: 'event_code',
      event_code: state.eventCode,
      email: state.email
    });
    
    console.log('\n[TEST] Processing API response...');
    console.log(response);
    
    // 3. Process the response based on status
    if (response.status === 'need_name_only') {
      console.log('\n[TEST] Status is need_name_only, dispatching action...');
      
      dispatch({
        type: 'HANDLE_NEED_NAME_ONLY',
        payload: {
          event_id: response.event_id,
          event_title: response.event_title
        }
      });
      
      // 4. Check the state after dispatching
      console.log('\n[TEST] State after handling need_name_only:');
      console.log('- step:', state.step);
      console.log('- selectedEvent:', state.selectedEvent);
      
      // 5. Verify the form step change
      if (state.step === 'name-only' && state.selectedEvent?.id === response.event_id) {
        console.log('\n[TEST] Form transition SUCCESSFUL ✅');
      } else {
        console.log('\n[TEST] Form transition FAILED ❌');
        console.log('Expected: step="name-only", selectedEvent.id=', response.event_id);
        console.log('Actual: step=', state.step, 'selectedEvent=', state.selectedEvent);
      }
    } else {
      console.log('\n[TEST] Response status is not need_name_only:', response.status);
      dispatch({ type: 'SET_LOGIN_RESPONSE', payload: response });
    }
    
    // 6. Simulate cleanup
    dispatch({ type: 'SET_LOADING', payload: false });
    
    console.log('\n[TEST] Final state:', state);
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('[ERROR] Test failed with exception:', error);
  }
}

// Run the diagnostic test
runDiagnosticTest().then(() => {
  console.log('Diagnostic test complete');
});