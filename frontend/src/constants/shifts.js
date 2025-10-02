// Shift configuration constants for frontend
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

export const SHIFT_OPTIONS = [
    { value: SHIFT_ENUM.MORNING, label: SHIFT_LABELS[SHIFT_ENUM.MORNING] },
    { value: SHIFT_ENUM.EVENING, label: SHIFT_LABELS[SHIFT_ENUM.EVENING] },
    { value: SHIFT_ENUM.NIGHT, label: SHIFT_LABELS[SHIFT_ENUM.NIGHT] }
];

export const SHIFT_COLORS = {
    [SHIFT_ENUM.MORNING]: 'orange',
    [SHIFT_ENUM.EVENING]: 'purple',
    [SHIFT_ENUM.NIGHT]: 'indigo'
};

export const SHIFT_ICONS = {
    [SHIFT_ENUM.MORNING]: 'Sun',
    [SHIFT_ENUM.EVENING]: 'Moon',
    [SHIFT_ENUM.NIGHT]: 'Zap'
};

// Helper function to get shift label
export const getShiftLabel = (shift) => {
    return SHIFT_LABELS[shift] || 'Unknown Shift';
};

// Helper function to get shift color
export const getShiftColor = (shift) => {
    return SHIFT_COLORS[shift] || 'gray';
};

// Helper function to validate shift
export const isValidShift = (shift) => {
    return Object.values(SHIFT_ENUM).includes(shift);
};
