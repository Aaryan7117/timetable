// Timetable Types

export type Day = 0 | 1 | 2 | 3 | 4 | 5; // Mon=0 to Sat=5
export type Period = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const DAY_SHORT_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export type SlotType = 'THEORY' | 'LAB' | 'BREAK' | 'LUNCH' | 'FREE';

export interface TimeSlot {
    day: Day;
    period: Period;
}

export interface TimetableEntry {
    id: string;
    slotId: string; // "day-period" format
    day: Day;
    period: Period;
    subjectId: string;
    facultyId: string;
    roomId: string; // Classroom or Lab ID
    batchId: string;
    subBatchId?: string; // Only for lab sessions
    isLabSession: boolean;
    labSlot?: 'A' | 'B'; // For lab sessions
    createdAt: number;
}

export interface Timetable {
    id: string;
    batchId: string;
    entries: TimetableEntry[];
    generatedAt: number;
    isValid: boolean;
}

// Lab Rotation Tracking
export interface LabRotation {
    batchId: string;
    subBatchId: string;
    sessionNumber: number;
    labId: string;
}

// Explanation Schema (LOCKED per architectural rules)
export type ExplanationLevel = 'INFO' | 'WARNING' | 'ERROR';
export type ExplanationSource = 'VALIDATOR' | 'LAB_ALLOCATOR' | 'SCHEDULER' | 'WORKLOAD';

export interface Explanation {
    level: ExplanationLevel;
    source: ExplanationSource;
    message: string;
    relatedEntityId?: string;
    step?: number; // Which generation step (1-10)
}

// Generation Result
export interface GenerationResult {
    success: boolean;
    timetable?: Timetable;
    explanations: Explanation[];
}

// Timetable State
export interface TimetableState {
    timetables: Timetable[];
    currentGeneration: {
        isGenerating: boolean;
        result: GenerationResult | null;
    };
    labRotations: LabRotation[];
}
