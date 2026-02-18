// Locked Academic Time Structure
// This file contains the immutable time structure for the timetable system

import { Period, Day } from '../types';

export interface PeriodInfo {
    period: Period;
    startTime: string;
    endTime: string;
    isBreak?: boolean;
    isLunch?: boolean;
    isSpecial?: boolean; // Period 8 - Honors/Minors only
}

// LOCKED: Period timings cannot be modified
export const PERIOD_SCHEDULE: PeriodInfo[] = [
    { period: 1, startTime: '08:30', endTime: '09:20' },
    { period: 2, startTime: '09:20', endTime: '10:10' },
    // Break: 10:10 - 10:25 (15 min)
    { period: 3, startTime: '10:25', endTime: '11:15' },
    { period: 4, startTime: '11:15', endTime: '12:05' },
    // Lunch: 12:05 - 12:45 (40 min)
    { period: 5, startTime: '12:45', endTime: '13:35' },
    { period: 6, startTime: '13:35', endTime: '14:25' },
    { period: 7, startTime: '14:25', endTime: '15:15' },
    { period: 8, startTime: '15:15', endTime: '16:15', isSpecial: true },
];

// Breaks and Lunch slots
export const BREAK_TIME = { startTime: '10:10', endTime: '10:25' };
export const LUNCH_TIME = { startTime: '12:05', endTime: '12:45' };

// LOCKED: Lab Slot Windows (ONLY VALID OPTIONS)
// Labs MUST use exactly 3 consecutive periods
// Labs CANNOT cross breaks or lunch
// Labs CANNOT use Period 1 or Period 8
export const LAB_SLOT_A: Period[] = [2, 3, 4]; // 9:20 - 12:05
export const LAB_SLOT_B: Period[] = [5, 6, 7]; // 12:45 - 15:15

// Working days
export const WORKING_DAYS: Day[] = [0, 1, 2, 3, 4, 5]; // Mon-Sat

// Minimum lab sessions per week per batch
export const MIN_LAB_SESSIONS_PER_WEEK = 2;

// Period 8 exclusion
export const PERIOD_8_EXCLUSION_REASON = 'Period 8 is reserved for Honors/Minors only';

// Helper functions
export function getPeriodInfo(period: Period): PeriodInfo | undefined {
    return PERIOD_SCHEDULE.find(p => p.period === period);
}

export function isLabSlotA(periods: Period[]): boolean {
    return periods.length === 3 &&
        periods[0] === LAB_SLOT_A[0] &&
        periods[1] === LAB_SLOT_A[1] &&
        periods[2] === LAB_SLOT_A[2];
}

export function isLabSlotB(periods: Period[]): boolean {
    return periods.length === 3 &&
        periods[0] === LAB_SLOT_B[0] &&
        periods[1] === LAB_SLOT_B[1] &&
        periods[2] === LAB_SLOT_B[2];
}

export function formatPeriodTime(period: Period): string {
    const info = getPeriodInfo(period);
    return info ? `${info.startTime} - ${info.endTime}` : '';
}

export function getLabSlotLabel(slot: 'A' | 'B'): string {
    const periods = slot === 'A' ? LAB_SLOT_A : LAB_SLOT_B;
    const start = getPeriodInfo(periods[0]);
    const end = getPeriodInfo(periods[periods.length - 1]);
    return start && end ? `${start.startTime} - ${end.endTime}` : '';
}
