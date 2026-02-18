/**
 * Timetable Generation Engine - Workload Calculator
 * 
 * Step 8: Validate Faculty Load
 * - Professor: 5 theory periods + 1 lab
 * - Associate Prof: 5 theory + 1.5 labs
 * - Assistant Prof: 10 theory + 2 labs
 */

import {
    Faculty,
    Subject,
    TimetableEntry,
    Explanation,
    FACULTY_WORKLOAD_LIMITS,
} from '../types';

export interface WorkloadStats {
    facultyId: string;
    facultyName: string;
    designation: string;
    theoryPeriods: number;
    theoryLimit: number;
    labSessions: number;
    labLimit: number;
    isOverloaded: boolean;
}

// Calculate workload for all faculty
export function calculateWorkload(
    faculty: Faculty[],
    subjects: Subject[],
    entries: TimetableEntry[]
): WorkloadStats[] {
    const stats: WorkloadStats[] = [];

    // Sort by ID for determinism
    const sortedFaculty = [...faculty].sort((a, b) => a.id.localeCompare(b.id));

    sortedFaculty.forEach(f => {
        const limits = FACULTY_WORKLOAD_LIMITS[f.designation];

        // Count theory periods from entries
        const theoryEntries = entries.filter(
            e => e.facultyId === f.id && !e.isLabSession
        );
        const theoryPeriods = theoryEntries.length;

        // Count lab sessions (each lab is 3 periods, so count unique sessions)
        const labEntries = entries.filter(
            e => e.facultyId === f.id && e.isLabSession
        );
        // Group by day and slot to count sessions
        const labSessionKeys = new Set(
            labEntries.map(e => `${e.day}-${e.labSlot}`)
        );
        const labSessions = labSessionKeys.size;

        stats.push({
            facultyId: f.id,
            facultyName: f.name,
            designation: f.designation,
            theoryPeriods,
            theoryLimit: limits.theoryPeriods,
            labSessions,
            labLimit: limits.labSessions,
            isOverloaded: theoryPeriods > limits.theoryPeriods || labSessions > limits.labSessions,
        });
    });

    return stats;
}

// Validate workload and generate explanations
export function validateWorkload(
    faculty: Faculty[],
    subjects: Subject[],
    entries: TimetableEntry[]
): Explanation[] {
    const explanations: Explanation[] = [];
    const stats = calculateWorkload(faculty, subjects, entries);

    stats.forEach(stat => {
        if (stat.theoryPeriods > stat.theoryLimit) {
            explanations.push({
                level: 'ERROR',
                source: 'WORKLOAD',
                message: `${stat.facultyName} (${stat.designation}) has ${stat.theoryPeriods} theory periods, exceeds limit of ${stat.theoryLimit}.`,
                relatedEntityId: stat.facultyId,
                step: 8,
            });
        }

        if (stat.labSessions > stat.labLimit) {
            explanations.push({
                level: 'ERROR',
                source: 'WORKLOAD',
                message: `${stat.facultyName} (${stat.designation}) has ${stat.labSessions} lab sessions, exceeds limit of ${stat.labLimit}.`,
                relatedEntityId: stat.facultyId,
                step: 8,
            });
        }

        // Info for valid assignments
        if (!stat.isOverloaded) {
            explanations.push({
                level: 'INFO',
                source: 'WORKLOAD',
                message: `${stat.facultyName}: ${stat.theoryPeriods}/${stat.theoryLimit} theory, ${stat.labSessions}/${stat.labLimit} labs.`,
                relatedEntityId: stat.facultyId,
                step: 8,
            });
        }
    });

    return explanations;
}

// Check if any faculty is overloaded
export function hasWorkloadViolation(
    faculty: Faculty[],
    subjects: Subject[],
    entries: TimetableEntry[]
): boolean {
    const stats = calculateWorkload(faculty, subjects, entries);
    return stats.some(s => s.isOverloaded);
}
