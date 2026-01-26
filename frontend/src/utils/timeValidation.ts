// Time validation utilities for restricting to 10AM - 7PM

export const validateTimeRange = (timeString: string): boolean => {
    const time = new Date(timeString);
    const hours = time.getHours();
    
    // Allow only 10AM (10:00) to 7PM (19:00)
    return hours >= 10 && hours <= 19;
};

export const validateTimeString = (timeString: string): boolean => {
    const [hours] = timeString.split(':').map(Number);
    
    // Allow only 10AM (10:00) to 7PM (19:00)
    return hours >= 10 && hours <= 19;
};

export const getRestrictedTimeMessage = (): string => {
    return 'Interview times are restricted to 10:00 AM - 7:00 PM only.';
};

export const restrictDateTimeInput = (value: string): string => {
    if (!value) return value;
    
    const date = new Date(value);
    const hours = date.getHours();
    
    // If time is outside 10AM-7PM, adjust to nearest valid time
    if (hours < 10) {
        date.setHours(10, 0, 0, 0);
    } else if (hours > 19) {
        date.setHours(19, 0, 0, 0);
    }
    
    // Format back to datetime-local string
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hoursFormatted = String(date.getHours()).padStart(2, '0');
    const minutesFormatted = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hoursFormatted}:${minutesFormatted}`;
};

export const restrictTimeInput = (value: string): string => {
    if (!value) return value;
    
    const [hours] = value.split(':').map(Number);
    
    // If time is outside 10AM-7PM, adjust to nearest valid time
    if (hours < 10) {
        return '10:00';
    } else if (hours > 19) {
        return '19:00';
    }
    
    return value;
};

export const validateDateForWorkingHours = (dateString: string): boolean => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    
    // Allow Monday to Friday (1-5), exclude weekends (0=Sunday, 6=Saturday)
    return dayOfWeek >= 1 && dayOfWeek <= 5;
};

export const getRestrictedDateMessage = (): string => {
    return 'Interview dates are restricted to weekdays only (Monday - Friday).';
};

export const restrictDateInput = (value: string): string => {
    if (!value) return value;
    
    const date = new Date(value);
    const dayOfWeek = date.getDay();
    
    // If weekend, adjust to next Monday
    if (dayOfWeek === 0) { // Sunday
        date.setDate(date.getDate() + 1);
    } else if (dayOfWeek === 6) { // Saturday
        date.setDate(date.getDate() + 2);
    }
    
    // Format back to date string
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};
