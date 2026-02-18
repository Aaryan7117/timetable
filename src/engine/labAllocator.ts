/**
 * Timetable Generation Engine - Lab Allocator
 * 
 * Step 3: Allocate Labs FIRST
 * - Choose valid lab slots (A or B)
 * - Enforce minimum 2 labs/week
 * - Apply capacity-based batch splitting
 * - Apply lab rotation rule
 * 
 * DETERMINISTIC: This allocator produces identical output for identical input
 */

import { v4 as uuidv4 } from 'uuid';
import {
    Batch,
    Subject,
    Faculty,
    Lab,
    TimetableEntry,
    Explanation,
    Day,
    Period,
    LabRotation,
} from '../types';
import {
    LAB_SLOT_A,
    LAB_SLOT_B,
    WORKING_DAYS,
    MIN_LAB_SESSIONS_PER_WEEK,
} from '../constants';

// Import availability checkers
function isFacultyAvailableForSlot(
    entries: TimetableEntry[],
    facultyId: string,
    day: Day,
    periods: Period[]
): boolean {
    return !periods.some(period =>
        entries.some(e => e.facultyId === facultyId && e.day === day && e.period === period)
    );
}

export interface LabAllocationResult {
    entries: TimetableEntry[];
    rotations: LabRotation[];
    explanations: Explanation[];
    success: boolean;
}

interface LabSession {
    day: Day;
    slot: 'A' | 'B';
    periods: Period[];
}

// Get available lab slots for a batch (DETERMINISTIC)
function getAvailableLabSlots(
    existingEntries: TimetableEntry[],
    batchId: string
): LabSession[] {
    const slots: LabSession[] = [];

    // Iterate days in fixed order for determinism
    const sortedDays = [...WORKING_DAYS].sort((a, b) => a - b);

    for (const day of sortedDays) {
        // Check Slot A availability
        const slotAUsed = LAB_SLOT_A.some(period =>
            existingEntries.some(e =>
                e.batchId === batchId && e.day === day && e.period === period
            )
        );

        if (!slotAUsed) {
            slots.push({
                day: day as Day,
                slot: 'A',
                periods: LAB_SLOT_A as Period[],
            });
        }

        // Check Slot B availability
        const slotBUsed = LAB_SLOT_B.some(period =>
            existingEntries.some(e =>
                e.batchId === batchId && e.day === day && e.period === period
            )
        );

        if (!slotBUsed) {
            slots.push({
                day: day as Day,
                slot: 'B',
                periods: LAB_SLOT_B as Period[],
            });
        }
    }

    return slots;
}

// Allocate labs for a single batch (DETERMINISTIC)
export function allocateLabsForBatch(
    batch: Batch,
    labSubjects: Subject[],
    labs: Lab[],
    faculty: Faculty[],
    existingEntries: TimetableEntry[],
    existingRotations: LabRotation[]
): LabAllocationResult {
    const entries: TimetableEntry[] = [];
    const rotations: LabRotation[] = [];
    const explanations: Explanation[] = [];

    // Sort lab subjects by ID for determinism
    const sortedLabSubjects = [...labSubjects]
        .filter(s => s.departmentId === batch.departmentId && s.semester === batch.semester)
        .sort((a, b) => a.id.localeCompare(b.id));

    if (sortedLabSubjects.length === 0) {
        explanations.push({
            level: 'ERROR',
            source: 'LAB_ALLOCATOR',
            message: `No lab subjects found for batch "${batch.name}".`,
            relatedEntityId: batch.id,
            step: 3,
        });
        return { entries, rotations, explanations, success: false };
    }

    // Get labs for this department (sorted for determinism)
    const deptLabs = [...labs]
        .filter(l => l.departmentId === batch.departmentId)
        .sort((a, b) => a.id.localeCompare(b.id));

    if (deptLabs.length === 0) {
        explanations.push({
            level: 'ERROR',
            source: 'LAB_ALLOCATOR',
            message: `No labs available for batch "${batch.name}" in its department.`,
            relatedEntityId: batch.id,
            step: 3,
        });
        return { entries, rotations, explanations, success: false };
    }

    // Get available slots
    const combinedEntries = [...existingEntries, ...entries];
    const availableSlots = getAvailableLabSlots(combinedEntries, batch.id);

    if (availableSlots.length < MIN_LAB_SESSIONS_PER_WEEK) {
        explanations.push({
            level: 'ERROR',
            source: 'LAB_ALLOCATOR',
            message: `Not enough lab slots available for batch "${batch.name}". Need ${MIN_LAB_SESSIONS_PER_WEEK}, found ${availableSlots.length}.`,
            relatedEntityId: batch.id,
            step: 3,
        });
        return { entries, rotations, explanations, success: false };
    }

    // Allocate labs (minimum 2 per week)
    let sessionNumber = 0;
    const usedSlots: Set<string> = new Set();
    let subjectIndex = 0;

    while (subjectIndex < sortedLabSubjects.length && sessionNumber < Math.max(sortedLabSubjects.length, MIN_LAB_SESSIONS_PER_WEEK)) {
        // Recompute available slots each iteration to avoid stale data
        const currentEntries = [...existingEntries, ...entries];
        const availableSlots = getAvailableLabSlots(currentEntries, batch.id);

        // Find next unused slot
        const slot = availableSlots.find(s => !usedSlots.has(`${s.day}-${s.slot}`));
        if (!slot) {
            break; // No more available slots
        }

        const slotKey = `${slot.day}-${slot.slot}`;
        usedSlots.add(slotKey);

        const subject = sortedLabSubjects[subjectIndex % sortedLabSubjects.length];

        // Find faculty for this lab subject
        const labFaculty = faculty
            .filter(f => f.assignedLabSubjects.includes(subject.id))
            .sort((a, b) => a.id.localeCompare(b.id));

        if (labFaculty.length === 0) {
            explanations.push({
                level: 'ERROR',
                source: 'LAB_ALLOCATOR',
                message: `No faculty assigned to lab subject "${subject.name}".`,
                relatedEntityId: subject.id,
                step: 3,
            });
            continue;
        }

        // Handle sub-batches (parallel labs with rotation)
        if (batch.subBatches.length > 1) {
            // Parallel lab allocation with rotation
            const sortedSubBatches = [...batch.subBatches].sort((a, b) => a.id.localeCompare(b.id));

            sortedSubBatches.forEach((subBatch, subBatchIndex) => {
                // Determine which lab this sub-batch uses (rotation)
                const previousRotation = existingRotations.find(
                    r => r.batchId === batch.id && r.subBatchId === subBatch.id
                );

                let labIndex: number;
                if (previousRotation) {
                    // Rotate to next lab
                    const prevLabIndex = deptLabs.findIndex(l => l.id === previousRotation.labId);
                    labIndex = (prevLabIndex + 1) % deptLabs.length;
                } else {
                    // Initial assignment: offset by sub-batch index
                    labIndex = subBatchIndex % deptLabs.length;
                }

                const lab = deptLabs[labIndex];
                const candidateFaculty = labFaculty[subBatchIndex % labFaculty.length];

                // Check faculty availability for this slot
                const currentEntriesForCheck = [...existingEntries, ...entries];
                const assignedFaculty = isFacultyAvailableForSlot(currentEntriesForCheck, candidateFaculty.id, slot.day, slot.periods)
                    ? candidateFaculty
                    : labFaculty.find(f => isFacultyAvailableForSlot(currentEntriesForCheck, f.id, slot.day, slot.periods));

                if (!assignedFaculty) {
                    explanations.push({
                        level: 'WARNING',
                        source: 'LAB_ALLOCATOR',
                        message: `No available faculty for ${subject.name} sub-batch ${subBatch.name} at Slot ${slot.slot}, Day ${slot.day + 1}.`,
                        relatedEntityId: subject.id,
                        step: 3,
                    });
                    return;
                }

                // Create entries for each period in the lab slot
                slot.periods.forEach(period => {
                    entries.push({
                        id: uuidv4(),
                        slotId: `${slot.day}-${period}`,
                        day: slot.day,
                        period: period,
                        subjectId: subject.id,
                        facultyId: assignedFaculty.id,
                        roomId: lab.id,
                        batchId: batch.id,
                        subBatchId: subBatch.id,
                        isLabSession: true,
                        labSlot: slot.slot,
                        createdAt: Date.now(),
                    });
                });

                // Record rotation
                rotations.push({
                    batchId: batch.id,
                    subBatchId: subBatch.id,
                    sessionNumber: sessionNumber,
                    labId: lab.id,
                });

                explanations.push({
                    level: 'INFO',
                    source: 'LAB_ALLOCATOR',
                    message: `Allocated ${subject.name} for ${batch.name}-${subBatch.name} in ${lab.name} (Slot ${slot.slot}, Day ${slot.day + 1}).`,
                    relatedEntityId: batch.id,
                    step: 3,
                });
            });
        } else {
            // Single batch (no split) - simple allocation
            const lab = deptLabs[0];
            const assignedFaculty = labFaculty[0];

            slot.periods.forEach(period => {
                entries.push({
                    id: uuidv4(),
                    slotId: `${slot.day}-${period}`,
                    day: slot.day,
                    period: period,
                    subjectId: subject.id,
                    facultyId: assignedFaculty.id,
                    roomId: lab.id,
                    batchId: batch.id,
                    isLabSession: true,
                    labSlot: slot.slot,
                    createdAt: Date.now(),
                });
            });

            explanations.push({
                level: 'INFO',
                source: 'LAB_ALLOCATOR',
                message: `Allocated ${subject.name} for ${batch.name} in ${lab.name} (Slot ${slot.slot}, Day ${slot.day + 1}).`,
                relatedEntityId: batch.id,
                step: 3,
            });
        }

        sessionNumber++;
        subjectIndex++;

        // Ensure minimum lab sessions
        if (sessionNumber >= MIN_LAB_SESSIONS_PER_WEEK && subjectIndex >= sortedLabSubjects.length) {
            break;
        }
    }

    // Validate minimum lab sessions
    if (sessionNumber < MIN_LAB_SESSIONS_PER_WEEK) {
        explanations.push({
            level: 'ERROR',
            source: 'LAB_ALLOCATOR',
            message: `Could only allocate ${sessionNumber} lab sessions for batch "${batch.name}". Minimum required: ${MIN_LAB_SESSIONS_PER_WEEK}.`,
            relatedEntityId: batch.id,
            step: 3,
        });
        return { entries, rotations, explanations, success: false };
    }

    return {
        entries,
        rotations,
        explanations,
        success: true
    };
}
