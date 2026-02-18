// Academic Types

export type FacultyDesignation = 'PROFESSOR' | 'ASSOCIATE_PROFESSOR' | 'ASSISTANT_PROFESSOR';

export type SubjectType =
    | 'THEORY'
    | 'LAB'
    | 'MANDATORY'      // Indian Constitution / Gender Sensitisation
    | 'OPEN_ELECTIVE'
    | 'LIBRARY';

export interface SubjectConstraints {
    // For MANDATORY: Period 3, Mon/Tue only
    // For OPEN_ELECTIVE: Period 1, Mon-Wed only
    // For LIBRARY: Max 1/week
    allowedPeriods?: number[];
    allowedDays?: number[];
    maxPerWeek?: number;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    type: SubjectType;
    periodsPerWeek: number;
    departmentId: string;
    semester: number;
    constraints: SubjectConstraints;
    createdAt: number;
}

export interface SubBatch {
    id: string;
    name: string; // e.g., "A1", "A2"
    studentCount: number;
}

export interface Batch {
    id: string;
    name: string; // e.g., "CSE-3A" (Department-Semester-Section)
    semester: number;
    section: string;
    departmentId: string;
    totalStudents: number;
    subBatches: SubBatch[]; // Auto-generated based on lab capacity
    createdAt: number;
}

export interface Faculty {
    id: string;
    name: string;
    employeeId: string;
    designation: FacultyDesignation;
    departmentId: string;
    // Assignment tracking
    assignedTheorySubjects: string[]; // Subject IDs
    assignedLabSubjects: string[];    // Subject IDs
    createdAt: number;
}

// Workload limits by designation
export const FACULTY_WORKLOAD_LIMITS: Record<FacultyDesignation, { theoryPeriods: number; labSessions: number }> = {
    PROFESSOR: { theoryPeriods: 5, labSessions: 1 },
    ASSOCIATE_PROFESSOR: { theoryPeriods: 5, labSessions: 1.5 },
    ASSISTANT_PROFESSOR: { theoryPeriods: 10, labSessions: 2 },
};

// Academic State
export interface AcademicState {
    batches: Batch[];
    subjects: Subject[];
    faculty: Faculty[];
}
