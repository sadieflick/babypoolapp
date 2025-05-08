import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Include credentials in all requests
});

// Token refresh functionality
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add auth token to all requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is unauthorized and we haven't tried refreshing yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, add to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post('/auth/token/refresh', {}, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true
        });

        const { access_token } = response.data;
        localStorage.setItem('token', access_token);

        // Update authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

        // Process queued requests
        processQueue(null, access_token);

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // Clear auth data as token refresh failed
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('isHost');
        localStorage.removeItem('currentUser');

        // Redirect to login on token refresh failure
        if (window.location.pathname !== '/' && 
            !window.location.pathname.includes('/auth/') && 
            !window.location.pathname.includes('/google_login')) {
          window.location.href = '/';
        }

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API calls
export const registerHost = async (userData) => {
  try {
    const response = await axios.post('/auth/host/register', userData, {
      withCredentials: true  // Ensure cookies are sent with the request
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginHost = async (email, password) => {
  try {
    const response = await axios.post('/auth/host/login', { email, password }, {
      withCredentials: true  // Ensure cookies are sent with the request
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginGuest = async (loginData) => {
  try {
    const response = await axios.post('/auth/guest/login', loginData, {
      withCredentials: true  // Ensure cookies are sent with the request
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const selectEvent = async (eventData) => {
  try {
    const response = await axios.post('/auth/guest/select-event', eventData, {
      withCredentials: true  // Ensure cookies are sent with the request
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await axios.post('/auth/logout', {}, {
      withCredentials: true  // Ensure cookies are sent with the request
    });
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isHost');
    localStorage.removeItem('currentUser');
    console.log('🔵 FRONTEND: User logged out successfully.'); // Added console log for clarity
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local storage even if server logout fails
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isHost');
    localStorage.removeItem('currentUser');
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await axios.put('/auth/update-profile', profileData, {
      withCredentials: true  // Ensure cookies are sent with the request
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Event API calls
export const getEvents = async () => {
  try {
    const response = await api.get('/events');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getEvent = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await api.post('/events', eventData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadEventImage = async (eventId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await axios.post(`/api/events/${eventId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true  // Ensure cookies are sent with the request
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const findEventByCode = async (eventCode) => {
  try {
    const response = await axios.get(`/api/events/find-by-code/${eventCode}`, {
      withCredentials: true  // Ensure cookies are sent with the request
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchEventByMother = async (searchTerm) => {
  try {
    const response = await axios.get('/api/events/find-by-mother', {
      params: { name: searchTerm },
      withCredentials: true  // Ensure cookies are sent with the request
    });
    return {
      status: 'events_found',
      events: response.data,
    };
  } catch (error) {
    throw error;
  }
};

// Guest management API calls
export const getEventGuests = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/guests`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getGuestDetails = async (eventId, guestId) => {
  try {
    const response = await api.get(`/events/${eventId}/guests/${guestId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addGuest = async (eventId, email) => {
  try {
    const response = await api.post(`/events/${eventId}/add-guest`, { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateGuestPayment = async (eventId, guestId, paymentData) => {
  try {
    const response = await api.post(`/events/${eventId}/guests/${guestId}/payment`, paymentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeGuest = async (eventId, guestId) => {
  try {
    const response = await api.delete(`/events/${eventId}/guests/${guestId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Guess API calls
export const getDateGuesses = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/date-guesses`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createDateGuess = async (eventId, date) => {
  try {
    const response = await api.post(`/events/${eventId}/date-guesses`, { date });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getHourGuesses = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/hour-guesses`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createHourGuess = async (eventId, hour, amPm) => {
  try {
    const response = await api.post(`/events/${eventId}/hour-guesses`, { hour, am_pm: amPm });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMinuteGuesses = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/minute-guesses`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createMinuteGuess = async (eventId, minute) => {
  try {
    const response = await api.post(`/events/${eventId}/minute-guesses`, { minute });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getNameGuesses = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/name-guesses`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createNameGuess = async (eventId, name) => {
  try {
    const response = await api.post(`/events/${eventId}/name-guesses`, { name });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteGuess = async (eventId, guessType, guessId) => {
  try {
    const response = await api.delete(`/events/${eventId}/guesses/${guessType}/${guessId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserGuesses = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/user-guesses`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// User API calls
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (userData) => {
  try {
    const response = await api.put('/users/me', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};