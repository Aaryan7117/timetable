/**
 * Timetable Generation Engine - Validator
 * 
 * Step 1: Validate all inputs before generation
 * - Infrastructure completeness
 * - Capacity verification
 * - Faculty assignment validation
 * - Subject requirement checks
 */

import {
    InfrastructureState,
    AcademicState,
    Explanation,
    Subject,
    Faculty,
    Batch,
    FACULTY_WORKLOAD_LIMITS,
} from '../types';
import { MIN_LAB_SESSIONS_PER_WEEK } from '../constants';

export interface ValidationResult {
    isValid: boolean;
    explanations: Explanation[];
}

// Step 1: Validate infrastructure
export function validateInfrastructure(state: InfrastructureState): Explanation[] {
    const errors: Explanation[] = [];

    // Check if blocks exist
    if (state.blocks.length === 0) {
        errors.push({
            level: 'ERROR',
            source: 'VALIDATOR',
            message: 'No blocks defined. At least one block is required.',
            step: 1,
        });
    }

    // Check if departments exist
    if (state.departments.length === 0) {
        errors.push({
            level: 'ERROR',
            source: 'VALIDATOR',
            message: 'No departments defined. At least one department is required.',
            step: 1,
        });
    }

    // Check if classrooms exist with valid capacity
    if (state.classrooms.length === 0) {
        errors.push({
            level: 'ERROR',
            source: 'VALIDATOR',
            message: 'No classrooms defined. At least one classroom is required.',
            step: 1,
        });
    }

    state.classrooms.forEach(classroom => {
        if (classroom.capacity <= 0) {
            errors.push({
                level: 'ERROR',
                source: 'VALIDATOR',
                message: `Classroom "${classroom.name}" has invalid capacity (${classroom.capacity}). Capacity must be > 0.`,
                relatedEntityId: classroom.id,
                step: 1,
            });
        }
    });

    // Check if labs exist with valid capacity
    if (state.labs.length === 0) {
        errors.push({
            level: 'ERROR',
            source: 'VALIDATOR',
            message: 'No labs defined. At least one lab is required.',
            step: 1,
        });
    }

    state.labs.forEach(lab => {
        if (lab.capacity <= 0) {
            errors.push({
                level: 'ERROR',
                source: 'VALIDATOR',
                message: `Lab "${lab.name}" has invalid capacity (${lab.capacity}). Capacity must be > 0.`,
                relatedEntityId: lab.id,
                step: 1,
            });
        }
    });

    return errors;
}

// Step 1: Validate academic configuration
export function validateAcademic(
    academic: AcademicState,
    infrastructure: InfrastructureState
): Explanation[] {
    const errors: Explanation[] = [];

    // Check if batches exist
    if (academic.batches.length === 0) {
        errors.push({
            level: 'ERROR',
            source: 'VALIDATOR',
            message: 'No batches defined. At least one batch is required.',
            step: 1,
        });
    }

    // Validate each batch
    academic.batches.forEach(batch => {
        if (batch.totalStudents <= 0) {
            errors.push({
                level: 'ERROR',
                source: 'VALIDATOR',
                message: `Batch "${batch.name}" has invalid student count (${batch.totalStudents}).`,
                relatedEntityId: batch.id,
                step: 1,
            });
        }

        // Check if department exists
        const dept = infrastructure.departments.find(d => d.id === batch.departmentId);
        if (!dept) {
            errors.push({
                level: 'ERROR',
                source: 'VALIDATOR',
                message: `Batch "${batch.name}" references non-existent department.`,
                relatedEntityId: batch.id,
                step: 1,
            });
        }
    });

    // Check if subjects exist
    if (academic.subjects.length === 0) {
        errors.push({
            level: 'ERROR',
            source: 'VALIDATOR',
            message: 'No subjects defined. At least one subject is required.',
            step: 1,
        });
    }

    // Validate lab subjects
    const labSubjects = academic.subjects.filter(s => s.type === 'LAB');
    if (labSubjects.length === 0) {
        errors.push({
            level: 'WARNING',
            source: 'VALIDATOR',
            message: 'No lab subjects defined. Students need at least 2 lab sessions per week.',
            step: 1,
        });
    }

    // Check if faculty exist
    if (academic.faculty.length === 0) {
        errors.push({
            level: 'ERROR',
            source: 'VALIDATOR',
            message: 'No faculty defined. At least one faculty is required.',
            step: 1,
        });
    }

    return errors;
}

// Validate faculty workload limits
export function validateFacultyWorkload(
    faculty: Faculty[],
    subjects: Subject[]
): Explanation[] {
    const errors: Explanation[] = [];

    faculty.forEach(f => {
        const limits = FACULTY_WORKLOAD_LIMITS[f.designation];

        // Count theory periods
        let theoryPeriods = 0;
        f.assignedTheorySubjects.forEach(subjectId => {
            const subject = subjects.find(s => s.id === subjectId);
            if (subject) {
                theoryPeriods += subject.periodsPerWeek;
            }
        });

        if (theoryPeriods > limits.theoryPeriods) {
            errors.push({
                level: 'ERROR',
                source: 'WORKLOAD',
                message: `${f.name} (${f.designation}) has ${theoryPeriods} theory periods assigned, exceeds limit of ${limits.theoryPeriods}.`,
                relatedEntityId: f.id,
                step: 8,
            });
        }

        // Count lab sessions
        const labSessions = f.assignedLabSubjects.length;
        if (labSessions > limits.labSessions) {
            errors.push({
                level: 'ERROR',
                source: 'WORKLOAD',
                message: `${f.name} (${f.designation}) has ${labSessions} lab sessions assigned, exceeds limit of ${limits.labSessions}.`,
                relatedEntityId: f.id,
                step: 8,
            });
        }
    });

    return errors;
}

// Validate subject-faculty assignments
export function validateSubjectAssignments(
    subjects: Subject[],
    faculty: Faculty[]
): Explanation[] {
    const errors: Explanation[] = [];

    // Check that all subjects have at least one faculty assigned
    subjects.forEach(subject => {
        let assigned = false;

        if (subject.type === 'LAB') {
            assigned = faculty.some(f => f.assignedLabSubjects.includes(subject.id));
        } else {
            assigned = faculty.some(f => f.assignedTheorySubjects.includes(subject.id));
        }

        if (!assigned) {
            errors.push({
                level: 'ERROR',
                source: 'VALIDATOR',
                message: `Subject "${subject.name}" (${subject.code}) has no faculty assigned.`,
                relatedEntityId: subject.id,
                step: 1,
            });
        }
    });

    return errors;
}

// Main validation function
export function validateAll(
    infrastructure: InfrastructureState,
    academic: AcademicState
): ValidationResult {
    const explanations: Explanation[] = [];

    // Step 1: Validate infrastructure
    explanations.push(...validateInfrastructure(infrastructure));

    // Step 1: Validate academic
    explanations.push(...validateAcademic(academic, infrastructure));

    // Step 1: Validate subject assignments
    if (academic.subjects.length > 0 && academic.faculty.length > 0) {
        explanations.push(...validateSubjectAssignments(academic.subjects, academic.faculty));
    }

    // Step 8: Validate faculty workload
    if (academic.faculty.length > 0 && academic.subjects.length > 0) {
        explanations.push(...validateFacultyWorkload(academic.faculty, academic.subjects));
    }

    const hasErrors = explanations.some(e => e.level === 'ERROR');

    return {
        isValid: !hasErrors,
        explanations,
    };
}
