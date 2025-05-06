import { format, addMonths, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

/**
 * Format a date as YYYY-MM-DD
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateYMD = (date) => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Format a date for display
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateDisplay = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMMM d, yyyy');
};

/**
 * Format time for display
 * @param {number} hour - The hour (1-12)
 * @param {string} amPm - "AM" or "PM"
 * @returns {string} Formatted time string
 */
export const formatTimeDisplay = (hour, amPm) => {
  return `${hour} ${amPm}`;
};

/**
 * Format minute for display
 * @param {number} minute - The minute (0-59)
 * @returns {string} Formatted minute string
 */
export const formatMinuteDisplay = (minute) => {
  return minute < 10 ? `0${minute}` : `${minute}`;
};

/**
 * Get date range for calendar display (1 month before and after due date)
 * @param {string|Date} dueDate - The due date
 * @returns {Object} Date range information
 */
export const getDateRange = (dueDate) => {
  const dueDateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const startDate = subMonths(dueDateObj, 1);
  const endDate = addMonths(dueDateObj, 1);
  
  return {
    startDate,
    endDate,
    dueDateObj
  };
};

/**
 * Generate calendar days for a given month
 * @param {Date} month - The month to generate calendar for
 * @param {Date} dueDate - The due date
 * @param {Array} takenDates - Array of dates already guessed
 * @returns {Array} Array of day objects with date and status information
 */
export const generateCalendarDays = (month, dueDate, takenDates = []) => {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const dueDateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  
  const days = eachDayOfInterval({ start, end });
  
  return days.map(day => {
    const dateStr = formatDateYMD(day);
    const taken = takenDates.find(td => {
      const tdDate = typeof td.date === 'string' ? new Date(td.date) : td.date;
      return isSameDay(tdDate, day);
    });
    
    return {
      date: day,
      dateStr,
      isDueDate: isSameDay(day, dueDateObj),
      isAvailable: !taken,
      user: taken ? taken.user : null,
      paymentStatus: taken ? taken.payment_status : null,
      isCurrentUser: taken ? taken.is_current_user : false
    };
  });
};

/**
 * Generate hours array for time selection
 * @param {Array} takenHours - Array of hours already guessed
 * @returns {Array} Array of hour objects with availability information
 */
export const generateHours = (takenHours = []) => {
  const hours = [];
  
  for (let i = 1; i <= 12; i++) {
    const hourAM = {
      hour: i,
      amPm: 'AM',
      display: `${i} AM`,
      isAvailable: true,
      user: null,
      paymentStatus: null,
      isCurrentUser: false
    };
    
    const hourPM = {
      hour: i,
      amPm: 'PM',
      display: `${i} PM`,
      isAvailable: true,
      user: null,
      paymentStatus: null,
      isCurrentUser: false
    };
    
    // Check if hour is taken
    takenHours.forEach(taken => {
      if (taken.hour === i && taken.am_pm === 'AM') {
        hourAM.isAvailable = false;
        hourAM.user = taken.user;
        hourAM.paymentStatus = taken.payment_status;
        hourAM.isCurrentUser = taken.is_current_user || false;
      }
      
      if (taken.hour === i && taken.am_pm === 'PM') {
        hourPM.isAvailable = false;
        hourPM.user = taken.user;
        hourPM.paymentStatus = taken.payment_status;
        hourPM.isCurrentUser = taken.is_current_user || false;
      }
    });
    
    hours.push(hourAM);
    hours.push(hourPM);
  }
  
  return hours;
};

/**
 * Generate minutes array for time selection
 * @param {Array} takenMinutes - Array of minutes already guessed
 * @returns {Array} Array of minute objects with availability information
 */
export const generateMinutes = (takenMinutes = []) => {
  const minutes = [];
  
  for (let i = 0; i < 60; i++) {
    const minute = {
      minute: i,
      display: formatMinuteDisplay(i),
      isAvailable: true,
      user: null,
      paymentStatus: null,
      isCurrentUser: false
    };
    
    // Check if minute is taken
    const taken = takenMinutes.find(tm => tm.minute === i);
    if (taken) {
      minute.isAvailable = false;
      minute.user = taken.user;
      minute.paymentStatus = taken.payment_status;
      minute.isCurrentUser = taken.is_current_user || false;
    }
    
    minutes.push(minute);
  }
  
  return minutes;
};

/**
 * Calculate days remaining until a date
 * @param {string|Date} date - The target date
 * @returns {number} Number of days remaining (negative if date has passed)
 */
export const daysRemaining = (date) => {
  const today = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};
