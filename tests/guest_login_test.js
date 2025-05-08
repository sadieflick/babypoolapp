/**
 * Guest Login Flow Testing Script
 * 
 * This test script isolates the various components of the guest login flow
 * to identify where the issue occurs with transitioning to the name-only form.
 */
console.log("=== Guest Login Flow Test ===");

// Global variables to store test state
const testState = {
  eventCode: '8810',
  eventData: null,
  formStep: null,
  formRenderCount: 0
};

// Mock React's state management for testing
function createMockState(initialValue) {
  let value = initialValue;
  let updateCallbacks = [];
  
  function setValue(newValue) {
    console.log(`State change: ${JSON.stringify(value)} -> ${JSON.stringify(newValue)}`);
    value = typeof newValue === 'function' ? newValue(value) : newValue;
    // Notify listeners of state change
    updateCallbacks.forEach(cb => cb(value));
    return value;
  }
  
  function getValue() {
    return value;
  }
  
  function onChange(callback) {
    updateCallbacks.push(callback);
    return () => {
      updateCallbacks = updateCallbacks.filter(cb => cb !== callback);
    };
  }
  
  return { setValue, getValue, onChange };
}

// Mock API functions
async function mockLoginGuest(data) {
  console.log("API Call: loginGuest", data);
  
  // Simulate backend response for event code
  if (data.login_type === 'event_code' && data.event_code === testState.eventCode) {
    const response = {
      status: 'need_name_only',
      event_id: 2,
      event_title: "Haley's Shower",
      message: 'Please tell us your name to get started'
    };
    
    testState.eventData = response;
    console.log("API Response:", response);
    return response;
  }
  
  return { error: 'Invalid data' };
}

async function mockSelectEvent(data) {
  console.log("API Call: selectEvent", data);
  
  // Simulate backend response for name selection
  if (data.event_id && data.nickname) {
    const response = {
      status: 'logged_in',
      user_id: 123,
      is_host: false,
      event_id: data.event_id,
      event_title: "Haley's Shower",
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      message: 'Successfully joined event'
    };
    
    console.log("API Response:", response);
    return response;
  }
  
  return { error: 'Invalid data' };
}

// Test the direct state updates to see if React would render properly
function testReactStateUpdates() {
  console.log("\n=== Testing React State Updates ===");
  
  // Create mock states
  const loginStep = createMockState('initial');
  const selectedEvent = createMockState(null);
  const loginResponse = createMockState(null);
  
  // Track number of renders that would happen
  let renderCount = 0;
  
  // Mock a component render effect
  loginStep.onChange(() => {
    renderCount++;
    console.log(`Component would re-render (#${renderCount}) with loginStep: ${loginStep.getValue()}`);
  });
  
  selectedEvent.onChange(() => {
    console.log(`Selected event updated to:`, selectedEvent.getValue());
  });
  
  // Simulate the flow
  console.log("Starting with initial state");
  
  console.log("Updating login step to event-code (user clicking button)");
  loginStep.setValue('event-code');
  
  console.log("Simulating API response with need_name_only status");
  const mockResponse = {
    status: 'need_name_only',
    event_id: 2,
    event_title: "Haley's Shower",
    message: 'Please tell us your name to get started'
  };
  
  console.log("Setting selected event");
  selectedEvent.setValue({ 
    id: mockResponse.event_id,
    title: mockResponse.event_title
  });
  
  console.log("Setting login step to name-only");
  loginStep.setValue('name-only');
  
  console.log(`Final render count: ${renderCount}`);
  console.log(`Final login step: ${loginStep.getValue()}`);
  
  return {
    finalStep: loginStep.getValue(),
    renderCount: renderCount,
    eventSet: selectedEvent.getValue() !== null
  };
}

// Test the actual event code form submission
async function testEventCodeSubmission() {
  console.log("\n=== Testing Event Code Submission ===");
  
  // Mock states
  const loginStep = createMockState('event-code');
  const selectedEvent = createMockState(null);
  const error = createMockState('');
  const loading = createMockState(false);
  
  // Start from event-code form
  console.log(`Current login step: ${loginStep.getValue()}`);
  
  try {
    // Simulate form submission
    console.log("Submitting event code form with code:", testState.eventCode);
    loading.setValue(true);
    
    const response = await mockLoginGuest({
      login_type: 'event_code',
      event_code: testState.eventCode
    });
    
    console.log("Response received, processing...");
    
    // Handle response (mirroring the component code)
    if (response.status === 'need_name_only') {
      console.log("Status is need_name_only, updating state");
      
      // First set the selected event
      selectedEvent.setValue({ 
        id: response.event_id,
        title: response.event_title
      });
      
      // Then set the login step
      loginStep.setValue('name-only');
      
      console.log("States after updates:");
      console.log("- loginStep:", loginStep.getValue());
      console.log("- selectedEvent:", selectedEvent.getValue());
    } else {
      console.log("Unexpected response status:", response.status);
    }
  } catch (err) {
    console.error("Error during submission:", err);
    error.setValue('An error occurred');
  } finally {
    loading.setValue(false);
  }
  
  return {
    finalStep: loginStep.getValue(),
    hasError: error.getValue() !== '',
    eventSet: selectedEvent.getValue() !== null
  };
}

// Simulate user interaction with the full login flow
async function testFullLoginFlow() {
  console.log("\n=== Testing Complete Login Flow ===");
  
  // State for tracking form renderings
  let currentComponent = 'initial';
  let renderComponents = {
    'initial': () => { 
      testState.formRenderCount++; 
      console.log(`Rendered InitialForm (#${testState.formRenderCount})`); 
    },
    'event-code': () => { 
      testState.formRenderCount++; 
      console.log(`Rendered EventCodeForm (#${testState.formRenderCount})`); 
    },
    'name-only': () => { 
      testState.formRenderCount++; 
      console.log(`Rendered NameOnlyForm (#${testState.formRenderCount})`); 
    }
  };
  
  // Mock states with render triggers
  const loginStep = createMockState('initial');
  const selectedEvent = createMockState(null);
  const loading = createMockState(false);
  
  loginStep.onChange((newValue) => {
    currentComponent = newValue;
    if (renderComponents[newValue]) {
      renderComponents[newValue]();
    }
  });
  
  // Initial render
  renderComponents[currentComponent]();
  
  // Step 1: User clicks "Enter Event Code" button
  console.log("\nUser action: Click 'Enter Event Code' button");
  loginStep.setValue('event-code');
  
  // Step 2: User enters event code and submits form
  console.log("\nUser action: Enter event code and submit form");
  loading.setValue(true);
  
  try {
    // Make API call
    const response = await mockLoginGuest({
      login_type: 'event_code',
      event_code: testState.eventCode
    });
    
    // Process response
    console.log("Processing API response");
    if (response.status === 'need_name_only') {
      console.log("Need name only status received");
      
      // Two state updates that should trigger renders
      selectedEvent.setValue({ 
        id: response.event_id,
        title: response.event_title
      });
      
      loginStep.setValue('name-only');
    }
  } catch (error) {
    console.error("Error in login flow:", error);
  } finally {
    loading.setValue(false);
  }
  
  // Check final state
  console.log("\nFinal component state:", currentComponent);
  console.log("Total renders:", testState.formRenderCount);
  
  return {
    finalComponent: currentComponent,
    renderCount: testState.formRenderCount,
    selectedEvent: selectedEvent.getValue()
  };
}

// Run all the tests and report results
async function runAllTests() {
  console.log("\n======== RUNNING ALL TESTS ========\n");
  
  // Test 1: React state updates
  const stateTest = testReactStateUpdates();
  
  // Test 2: Event code submission
  const submissionTest = await testEventCodeSubmission();
  
  // Test 3: Full login flow
  const flowTest = await testFullLoginFlow();
  
  // Report results
  console.log("\n======== TEST RESULTS ========\n");
  
  console.log("Test 1: React State Update Test");
  console.log(`- Final step: ${stateTest.finalStep} (Expected: name-only)`);
  console.log(`- Render count: ${stateTest.renderCount}`);
  console.log(`- Event object set: ${stateTest.eventSet}`);
  console.log(`- Result: ${stateTest.finalStep === 'name-only' ? 'PASS' : 'FAIL'}`);
  
  console.log("\nTest 2: Event Code Submission Test");
  console.log(`- Final step: ${submissionTest.finalStep} (Expected: name-only)`);
  console.log(`- Has error: ${submissionTest.hasError}`);
  console.log(`- Event object set: ${submissionTest.eventSet}`);
  console.log(`- Result: ${submissionTest.finalStep === 'name-only' ? 'PASS' : 'FAIL'}`);
  
  console.log("\nTest 3: Full Login Flow Test");
  console.log(`- Final component: ${flowTest.finalComponent} (Expected: name-only)`);
  console.log(`- Render count: ${flowTest.renderCount}`);
  console.log(`- Selected event:`, flowTest.selectedEvent);
  console.log(`- Result: ${flowTest.finalComponent === 'name-only' ? 'PASS' : 'FAIL'}`);
  
  const allPassed = 
    stateTest.finalStep === 'name-only' && 
    submissionTest.finalStep === 'name-only' &&
    flowTest.finalComponent === 'name-only';
  
  console.log("\nOverall Result:", allPassed ? "ALL TESTS PASSED" : "TESTS FAILED");
  
  if (!allPassed) {
    console.log("\nPossible failure points:");
    if (stateTest.finalStep !== 'name-only') {
      console.log("- Basic React state management isn't working correctly");
    }
    if (submissionTest.finalStep !== 'name-only') {
      console.log("- Event form submission handler has issues");
    }
    if (flowTest.finalComponent !== 'name-only') {
      console.log("- Form transition logic or render conditions need fixing");
    }
  }
  
  return { allPassed, stateTest, submissionTest, flowTest };
}

// Execute all tests
runAllTests().then(results => {
  console.log("\n======== RECOMMENDATIONS ========\n");
  
  if (results.allPassed) {
    console.log("All tests passed in isolation. This suggests that the issue isn't in the state logic itself, but may be related to:");
    console.log("1. React's batched updates behavior");
    console.log("2. Event handling differences in the real environment");
    console.log("3. Potential race conditions with asynchronous operations");
  } else {
    console.log("Tests identified issues that need to be addressed:");
    
    if (results.stateTest.finalStep !== 'name-only') {
      console.log("- Fundamental issue with state updates in React components");
    }
    
    if (results.submissionTest.finalStep !== 'name-only') {
      console.log("- Event code handling logic might be incorrect");
    }
    
    if (results.flowTest.finalComponent !== 'name-only') {
      console.log("- Component rendering or transition logic has problems");
    }
  }
  
  console.log("\nRecommended fixes:");
  console.log("1. Use a React useReducer instead of multiple useState calls to ensure atomic state updates");
  console.log("2. Implement a dedicated effect specifically for handling form transitions");
  console.log("3. Consider splitting the form into completely separate components that mount/unmount");
  console.log("4. Try managing form visibility at the route level in react-router instead of component state");
});