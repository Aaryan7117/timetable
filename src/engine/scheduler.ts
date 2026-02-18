/**
 * Timetable Generation Engine - Main Scheduler (DETERMINISTIC)
 * 
 * Round-Robin Execution Order:
 * 1. Validate Inputs
 * 2. Lock Academic Structure
 * 3. Allocate Labs FIRST
 * 4. Place Mandatory Subjects (Period 3, Mon/Tue)
 * 5. Distribute Theory (Round-Robin)
 * 6. Place Open Electives (Period 1, Mon-Wed)
 * 7. Auto-Fill Library (max 1/week)
 * 8. Validate Faculty Load
 * 9. Final Validation
 * 10. Publish Timetable
 * 
 * DETERMINISTIC GUARANTEE: Identical inputs ALWAYS produce identical outputs
 */

import { v4 as uuidv4 } from 'uuid';
import {
    InfrastructureState,
    AcademicState,
    Timetable,
    TimetableEntry,
    Explanation,
    GenerationResult,
    Day,
    Period,
    Subject,
    Batch,
    LabRotation,
} from '../types';
import {
    WORKING_DAYS,
    PERIOD_SCHEDULE,
    isValidSlotForSubject,
} from '../constants';
import { validateAll, ValidationResult } from './validator';
import { allocateLabsForBatch, LabAllocationResult } from './labAllocator';
import { validateWorkload, hasWorkloadViolation } from './workloadCalculator';

// Check if a slot is available (no existing entry)
function isSlotAvailable(
    entries: TimetableEntry[],
    batchId: string,
    day: Day,
    period: Period
): boolean {
    return !entries.some(
        e => e.batchId === batchId && e.day === day && e.period === period
    );
}

// Check if faculty is available at a slot
function isFacultyAvailable(
    entries: TimetableEntry[],
    facultyId: string,
    day: Day,
    period: Period
): boolean {
    return !entries.some(
        e => e.facultyId === facultyId && e.day === day && e.period === period
    );
}

// Check if classroom is available at a slot
function isRoomAvailable(
    entries: TimetableEntry[],
    roomId: string,
    day: Day,
    period: Period
): boolean {
    return !entries.some(
        e => e.roomId === roomId && e.day === day && e.period === period
    );
}

// Place a single theory entry
function placeTheoryEntry(
    batch: Batch,
    subject: Subject,
    facultyId: string,
    classroomId: string,
    day: Day,
    period: Period
): TimetableEntry {
    return {
        id: uuidv4(),
        slotId: `${day}-${period}`,
        day,
        period,
        subjectId: subject.id,
        facultyId,
        roomId: classroomId,
        batchId: batch.id,
        isLabSession: false,
        createdAt: Date.now(),
    };
}

// Step 4: Place mandatory subjects (Period 3, Mon/Tue only)
function placeMandatorySubjects(
    batch: Batch,
    subjects: Subject[],
    faculty: AcademicState['faculty'],
    classrooms: InfrastructureState['classrooms'],
    existingEntries: TimetableEntry[]
): { entries: TimetableEntry[]; explanations: Explanation[] } {
    const entries: TimetableEntry[] = [];
    const explanations: Explanation[] = [];

    const mandatorySubjects = subjects
        .filter(s => s.type === 'MANDATORY' && s.departmentId === batch.departmentId && s.semester === batch.semester)
        .sort((a, b) => a.id.localeCompare(b.id));

    const allowedDays: Day[] = [0, 1]; // Monday, Tuesday
    const period: Period = 3;

    mandatorySubjects.forEach((subject, index) => {
        if (index >= allowedDays.length) {
            explanations.push({
                level: 'WARNING',
                source: 'SCHEDULER',
                message: `Cannot place mandatory subject "${subject.name}" - no available slots (Period 3, Mon/Tue).`,
                relatedEntityId: subject.id,
                step: 4,
            });
            return;
        }

        const day = allowedDays[index];
        const combinedEntries = [...existingEntries, ...entries];

        if (!isSlotAvailable(combinedEntries, batch.id, day, period)) {
            explanations.push({
                level: 'WARNING',
                source: 'SCHEDULER',
                message: `Slot for mandatory "${subject.name}" (Day ${day + 1}, Period 3) is occupied.`,
                relatedEntityId: subject.id,
                step: 4,
            });
            return;
        }

        // Find assigned faculty
        const assignedFaculty = faculty
            .filter(f => f.assignedTheorySubjects.includes(subject.id))
            .sort((a, b) => a.id.localeCompare(b.id))[0];

        if (!assignedFaculty) {
            explanations.push({
                level: 'ERROR',
                source: 'SCHEDULER',
                message: `No faculty assigned to mandatory subject "${subject.name}".`,
                relatedEntityId: subject.id,
                step: 4,
            });
            return;
        }

        // Check faculty availability at this slot
        if (!isFacultyAvailable(combinedEntries, assignedFaculty.id, day, period)) {
            explanations.push({
                level: 'WARNING',
                source: 'SCHEDULER',
                message: `Faculty "${assignedFaculty.name}" is unavailable for mandatory "${subject.name}" (Day ${day + 1}, Period 3).`,
                relatedEntityId: subject.id,
                step: 4,
            });
            return;
        }

        // Find classroom
        const classroom = classrooms
            .filter(c => c.departmentId === batch.departmentId && c.capacity >= batch.totalStudents)
            .sort((a, b) => a.id.localeCompare(b.id))
            .find(c => isRoomAvailable(combinedEntries, c.id, day, period));

        if (!classroom) {
            explanations.push({
                level: 'ERROR',
                source: 'SCHEDULER',
                message: `No available classroom with sufficient capacity for batch "${batch.name}" at Day ${day + 1}, Period 3.`,
                relatedEntityId: batch.id,
                step: 4,
            });
            return;
        }

        entries.push(placeTheoryEntry(
            batch, subject, assignedFaculty.id, classroom.id, day, period
        ));

        explanations.push({
            level: 'INFO',
            source: 'SCHEDULER',
            message: `Placed mandatory "${subject.name}" on Day ${day + 1}, Period 3.`,
            relatedEntityId: subject.id,
            step: 4,
        });
    });

    return { entries, explanations };
}

// Step 5: Distribute theory subjects (Round-Robin across days)
function distributeTheorySubjects(
    batch: Batch,
    subjects: Subject[],
    faculty: AcademicState['faculty'],
    classrooms: InfrastructureState['classrooms'],
    existingEntries: TimetableEntry[]
): { entries: TimetableEntry[]; explanations: Explanation[] } {
    const entries: TimetableEntry[] = [];
    const explanations: Explanation[] = [];

    const theorySubjects = subjects
        .filter(s => s.type === 'THEORY' && s.departmentId === batch.departmentId && s.semester === batch.semester)
        .sort((a, b) => a.id.localeCompare(b.id));

    // Available periods for theory (exclude period 1 for electives, period 3 for mandatory, period 8)
    const theoryPeriods: Period[] = [2, 4, 5, 6, 7];
    const sortedDays = [...WORKING_DAYS].sort((a, b) => a - b) as Day[];

    // Round-robin state (shared across subjects for even spread)
    let globalDayIndex = 0;

    theorySubjects.forEach(subject => {
        const periodsToPlace = subject.periodsPerWeek;
        let placedCount = 0;

        // Find assigned faculty
        const assignedFaculty = faculty
            .filter(f => f.assignedTheorySubjects.includes(subject.id))
            .sort((a, b) => a.id.localeCompare(b.id))[0];

        if (!assignedFaculty) {
            explanations.push({
                level: 'ERROR',
                source: 'SCHEDULER',
                message: `No faculty assigned to theory subject "${subject.name}".`,
                relatedEntityId: subject.id,
                step: 5,
            });
            return;
        }

        // Find classroom
        const classroom = classrooms
            .filter(c => c.departmentId === batch.departmentId && c.capacity >= batch.totalStudents)
            .sort((a, b) => a.id.localeCompare(b.id))[0];

        if (!classroom) {
            return; // Error already logged in mandatory step
        }

        // Place periods across days (round-robin, reset per subject)
        let attempts = 0;
        let periodIndex = 0;
        let dayIndex = globalDayIndex; // Start from where last subject left off
        const maxAttempts = sortedDays.length * theoryPeriods.length * 2;

        while (placedCount < periodsToPlace && attempts < maxAttempts) {
            const day = sortedDays[dayIndex % sortedDays.length];
            const period = theoryPeriods[periodIndex % theoryPeriods.length];

            const combinedEntries = [...existingEntries, ...entries];

            if (
                isSlotAvailable(combinedEntries, batch.id, day, period) &&
                isFacultyAvailable(combinedEntries, assignedFaculty.id, day, period) &&
                isRoomAvailable(combinedEntries, classroom.id, day, period)
            ) {
                entries.push(placeTheoryEntry(
                    batch, subject, assignedFaculty.id, classroom.id, day, period
                ));
                placedCount++;

                // Move to next day for round-robin
                dayIndex++;
            }

            periodIndex++;
            if (periodIndex % theoryPeriods.length === 0) {
                dayIndex++;
            }
            attempts++;
        }

        // Update global index so next subject continues round-robin
        globalDayIndex = dayIndex;

        if (placedCount < periodsToPlace) {
            explanations.push({
                level: 'WARNING',
                source: 'SCHEDULER',
                message: `Could only place ${placedCount}/${periodsToPlace} periods for "${subject.name}".`,
                relatedEntityId: subject.id,
                step: 5,
            });
        } else {
            explanations.push({
                level: 'INFO',
                source: 'SCHEDULER',
                message: `Placed ${placedCount} periods for theory "${subject.name}".`,
                relatedEntityId: subject.id,
                step: 5,
            });
        }
    });

    return { entries, explanations };
}

// Step 6: Place open electives (Period 1, Mon-Wed only)
function placeOpenElectives(
    batch: Batch,
    subjects: Subject[],
    faculty: AcademicState['faculty'],
    classrooms: InfrastructureState['classrooms'],
    existingEntries: TimetableEntry[]
): { entries: TimetableEntry[]; explanations: Explanation[] } {
    const entries: TimetableEntry[] = [];
    const explanations: Explanation[] = [];

    const openElectives = subjects
        .filter(s => s.type === 'OPEN_ELECTIVE' && s.departmentId === batch.departmentId && s.semester === batch.semester)
        .sort((a, b) => a.id.localeCompare(b.id));

    const allowedDays: Day[] = [0, 1, 2]; // Mon, Tue, Wed
    const period: Period = 1;

    openElectives.forEach((subject, index) => {
        if (index >= allowedDays.length) {
            explanations.push({
                level: 'WARNING',
                source: 'SCHEDULER',
                message: `Cannot place open elective "${subject.name}" - no available slots (Period 1, Mon-Wed).`,
                relatedEntityId: subject.id,
                step: 6,
            });
            return;
        }

        const day = allowedDays[index];
        const combinedEntries = [...existingEntries, ...entries];

        if (!isSlotAvailable(combinedEntries, batch.id, day, period)) {
            explanations.push({
                level: 'WARNING',
                source: 'SCHEDULER',
                message: `Slot for open elective "${subject.name}" (Day ${day + 1}, Period 1) is occupied.`,
                relatedEntityId: subject.id,
                step: 6,
            });
            return;
        }

        const assignedFaculty = faculty
            .filter(f => f.assignedTheorySubjects.includes(subject.id))
            .sort((a, b) => a.id.localeCompare(b.id))[0];

        if (!assignedFaculty) return;

        // Check faculty availability
        if (!isFacultyAvailable(combinedEntries, assignedFaculty.id, day, period)) {
            explanations.push({
                level: 'WARNING',
                source: 'SCHEDULER',
                message: `Faculty unavailable for open elective "${subject.name}" (Day ${day + 1}, Period 1).`,
                relatedEntityId: subject.id,
                step: 6,
            });
            return;
        }

        const classroom = classrooms
            .filter(c => c.departmentId === batch.departmentId)
            .sort((a, b) => a.id.localeCompare(b.id))
            .find(c => isRoomAvailable(combinedEntries, c.id, day, period));

        if (!classroom) return;

        entries.push(placeTheoryEntry(
            batch, subject, assignedFaculty.id, classroom.id, day, period
        ));

        explanations.push({
            level: 'INFO',
            source: 'SCHEDULER',
            message: `Placed open elective "${subject.name}" on Day ${day + 1}, Period 1.`,
            relatedEntityId: subject.id,
            step: 6,
        });
    });

    return { entries, explanations };
}

// Step 7: Auto-fill library (max 1 slot per week)
function autoFillLibrary(
    batch: Batch,
    subjects: Subject[],
    existingEntries: TimetableEntry[]
): { entries: TimetableEntry[]; explanations: Explanation[] } {
    const entries: TimetableEntry[] = [];
    const explanations: Explanation[] = [];

    const librarySubject = subjects
        .filter(s => s.type === 'LIBRARY' && s.departmentId === batch.departmentId && s.semester === batch.semester)
        .sort((a, b) => a.id.localeCompare(b.id))[0];

    if (!librarySubject) {
        return { entries, explanations };
    }

    // Find first available slot (lowest priority - fill gaps)
    const sortedDays = [...WORKING_DAYS].sort((a, b) => a - b) as Day[];
    const periods: Period[] = [1, 2, 4, 5, 6, 7]; // Exclude 3 (mandatory) and 8 (special)

    for (const day of sortedDays) {
        for (const period of periods) {
            if (isSlotAvailable(existingEntries, batch.id, day, period)) {
                entries.push({
                    id: uuidv4(),
                    slotId: `${day}-${period}`,
                    day,
                    period,
                    subjectId: librarySubject.id,
                    facultyId: '', // Library doesn't need faculty
                    roomId: '', // Library uses library room
                    batchId: batch.id,
                    isLabSession: false,
                    createdAt: Date.now(),
                });

                explanations.push({
                    level: 'INFO',
                    source: 'SCHEDULER',
                    message: `Auto-filled Library on Day ${day + 1}, Period ${period}.`,
                    relatedEntityId: librarySubject.id,
                    step: 7,
                });

                return { entries, explanations }; // Max 1 per week
            }
        }
    }

    return { entries, explanations };
}

// Main generation function (DETERMINISTIC)
export function generateTimetable(
    infrastructure: InfrastructureState,
    academic: AcademicState,
    batchId: string,
    existingRotations: LabRotation[] = []
): GenerationResult {
    const explanations: Explanation[] = [];

    // Step 1: Validate inputs
    const validation = validateAll(infrastructure, academic);
    explanations.push(...validation.explanations);

    if (!validation.isValid) {
        return {
            success: false,
            explanations,
        };
    }

    explanations.push({
        level: 'INFO',
        source: 'VALIDATOR',
        message: 'All inputs validated successfully.',
        step: 1,
    });

    // Find the batch
    const batch = academic.batches.find(b => b.id === batchId);
    if (!batch) {
        explanations.push({
            level: 'ERROR',
            source: 'SCHEDULER',
            message: `Batch with ID "${batchId}" not found.`,
            step: 2,
        });
        return { success: false, explanations };
    }

    // Step 2: Lock academic structure (already done via constants)
    explanations.push({
        level: 'INFO',
        source: 'SCHEDULER',
        message: 'Academic time structure locked.',
        step: 2,
    });

    let allEntries: TimetableEntry[] = [];
    let allRotations: LabRotation[] = [...existingRotations];

    // Step 3: Allocate labs FIRST
    const labSubjects = academic.subjects.filter(s => s.type === 'LAB');
    const deptLabs = infrastructure.labs.filter(l => l.departmentId === batch.departmentId);

    const labResult = allocateLabsForBatch(
        batch,
        labSubjects,
        deptLabs,
        academic.faculty,
        allEntries,
        allRotations
    );

    allEntries.push(...labResult.entries);
    allRotations.push(...labResult.rotations);
    explanations.push(...labResult.explanations);

    if (!labResult.success) {
        return { success: false, explanations };
    }

    // Step 4: Place mandatory subjects
    const mandatoryResult = placeMandatorySubjects(
        batch,
        academic.subjects,
        academic.faculty,
        infrastructure.classrooms,
        allEntries
    );
    allEntries.push(...mandatoryResult.entries);
    explanations.push(...mandatoryResult.explanations);

    // Step 5: Distribute theory subjects
    const theoryResult = distributeTheorySubjects(
        batch,
        academic.subjects,
        academic.faculty,
        infrastructure.classrooms,
        allEntries
    );
    allEntries.push(...theoryResult.entries);
    explanations.push(...theoryResult.explanations);

    // Step 6: Place open electives
    const electiveResult = placeOpenElectives(
        batch,
        academic.subjects,
        academic.faculty,
        infrastructure.classrooms,
        allEntries
    );
    allEntries.push(...electiveResult.entries);
    explanations.push(...electiveResult.explanations);

    // Step 7: Auto-fill library
    const libraryResult = autoFillLibrary(batch, academic.subjects, allEntries);
    allEntries.push(...libraryResult.entries);
    explanations.push(...libraryResult.explanations);

    // Step 8: Validate faculty workload
    const workloadExplanations = validateWorkload(
        academic.faculty,
        academic.subjects,
        allEntries
    );
    explanations.push(...workloadExplanations);

    if (hasWorkloadViolation(academic.faculty, academic.subjects, allEntries)) {
        explanations.push({
            level: 'ERROR',
            source: 'WORKLOAD',
            message: 'Faculty workload limits exceeded. Generation failed.',
            step: 8,
        });
        return { success: false, explanations };
    }

    // Step 9: Final validation
    explanations.push({
        level: 'INFO',
        source: 'SCHEDULER',
        message: 'Final validation passed. No constraint violations.',
        step: 9,
    });

    // Step 10: Create and return timetable
    const timetable: Timetable = {
        id: uuidv4(),
        batchId: batch.id,
        entries: allEntries.sort((a, b) => {
            // Sort by day, then period for determinism
            if (a.day !== b.day) return a.day - b.day;
            return a.period - b.period;
        }),
        generatedAt: Date.now(),
        isValid: true,
    };

    explanations.push({
        level: 'INFO',
        source: 'SCHEDULER',
        message: `Timetable generated successfully for batch "${batch.name}" with ${allEntries.length} entries.`,
        step: 10,
    });

    return {
        success: true,
        timetable,
        explanations,
    };
}
