// Shift configuration constants
export const SHIFT_ENUM = {
    MORNING: 'morning',
    EVENING: 'evening',
    NIGHT: 'night'
};

export const SHIFT_LABELS = {
    [SHIFT_ENUM.MORNING]: 'Morning Shift (7:00 AM - 3:00 PM)',
    [SHIFT_ENUM.EVENING]: 'Evening Shift (3:00 PM - 11:00 PM)',
    [SHIFT_ENUM.NIGHT]: 'Night Shift (11:00 PM - 7:00 AM)'
};

export const SHIFT_TIMES = {
    [SHIFT_ENUM.MORNING]: {
        start: '07:00',
        end: '15:00',
        startHour: 7,
        endHour: 15,
        label: 'Morning Shift (7:00 AM - 3:00 PM)'
    },
    [SHIFT_ENUM.EVENING]: {
        start: '15:00',
        end: '23:00',
        startHour: 15,
        endHour: 23,
        label: 'Evening Shift (3:00 PM - 11:00 PM)'
    },
    [SHIFT_ENUM.NIGHT]: {
        start: '23:00',
        end: '07:00',
        startHour: 23,
        endHour: 7,
        label: 'Night Shift (11:00 PM - 7:00 AM)'
    }
};

export const SHIFT_OPTIONS = [
    { value: SHIFT_ENUM.MORNING, label: SHIFT_LABELS[SHIFT_ENUM.MORNING] },
    { value: SHIFT_ENUM.EVENING, label: SHIFT_LABELS[SHIFT_ENUM.EVENING] },
    { value: SHIFT_ENUM.NIGHT, label: SHIFT_LABELS[SHIFT_ENUM.NIGHT] }
];

// Helper function to get shift by time
export const getShiftByTime = (date) => {
    const hour = date.getHours();

    if (hour >= 7 && hour < 15) {
        return SHIFT_ENUM.MORNING;
    } else if (hour >= 15 && hour < 23) {
        return SHIFT_ENUM.EVENING;
    } else {
        return SHIFT_ENUM.NIGHT;
    }
};

// Helper function to validate shift
export const isValidShift = (shift) => {
    return Object.values(SHIFT_ENUM).includes(shift);
};

// Helper function to get shift label
export const getShiftLabel = (shift) => {
    return SHIFT_LABELS[shift] || 'Unknown Shift';
};
