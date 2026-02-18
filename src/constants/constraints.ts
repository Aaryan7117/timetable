// Hard Constraints for Timetable Generation
// These constraints are NON-NEGOTIABLE

import { SubjectType, SubjectConstraints, Day, Period } from '../types';

// MANDATORY COURSES (Indian Constitution / Gender Sensitisation)
// - ONLY Period 3
// - ONLY Monday & Tuesday
// - NEVER during lab slots
export const MANDATORY_COURSE_CONSTRAINTS: SubjectConstraints = {
    allowedPeriods: [3],
    allowedDays: [0, 1], // Monday, Tuesday
};

// OPEN ELECTIVES
// - ONLY Period 1
// - ONLY Monday, Tuesday, Wednesday
export const OPEN_ELECTIVE_CONSTRAINTS: SubjectConstraints = {
    allowedPeriods: [1],
    allowedDays: [0, 1, 2], // Mon, Tue, Wed
};

// LIBRARY
// - Maximum 1 period per week
// - Auto-filled only (lowest priority)
// - Never replaces labs or mandatory subjects
export const LIBRARY_CONSTRAINTS: SubjectConstraints = {
    maxPerWeek: 1,
};

// Get default constraints for a subject type
export function getDefaultConstraints(type: SubjectType): SubjectConstraints {
    switch (type) {
        case 'MANDATORY':
            return { ...MANDATORY_COURSE_CONSTRAINTS };
        case 'OPEN_ELECTIVE':
            return { ...OPEN_ELECTIVE_CONSTRAINTS };
        case 'LIBRARY':
            return { ...LIBRARY_CONSTRAINTS };
        default:
            return {};
    }
}

// Validation helpers
export function isValidSlotForSubject(
    type: SubjectType,
    day: Day,
    period: Period,
    constraints: SubjectConstraints = getDefaultConstraints(type)
): boolean {
    // Check allowed periods
    if (constraints.allowedPeriods && !constraints.allowedPeriods.includes(period)) {
        return false;
    }

    // Check allowed days
    if (constraints.allowedDays && !constraints.allowedDays.includes(day)) {
        return false;
    }

    // Period 8 is only for Honors/Minors (excluded from core scheduling)
    if (period === 8) {
        return false;
    }

    return true;
}

// Subject type display names
export const SUBJECT_TYPE_LABELS: Record<SubjectType, string> = {
    THEORY: 'Theory',
    LAB: 'Laboratory',
    MANDATORY: 'Mandatory Course',
    OPEN_ELECTIVE: 'Open Elective',
    LIBRARY: 'Library',
};

// Subject type colors for UI
export const SUBJECT_TYPE_COLORS: Record<SubjectType, string> = {
    THEORY: '#4CAF50',      // Green
    LAB: '#2196F3',         // Blue
    MANDATORY: '#FF9800',   // Orange
    OPEN_ELECTIVE: '#9C27B0', // Purple
    LIBRARY: '#607D8B',     // Grey
};
