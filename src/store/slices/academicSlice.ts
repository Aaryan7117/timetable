import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
    Batch,
    SubBatch,
    Subject,
    Faculty,
    AcademicState,
    SubjectType,
} from '../../types';
import { getDefaultConstraints } from '../../constants';

const initialState: AcademicState = {
    batches: [],
    subjects: [],
    faculty: [],
};

// Helper: Calculate sub-batches based on lab capacity
function calculateSubBatches(totalStudents: number, labCapacity: number): SubBatch[] {
    if (labCapacity >= totalStudents) {
        // No split needed
        return [{
            id: uuidv4(),
            name: 'A',
            studentCount: totalStudents,
        }];
    }

    // Calculate number of sub-batches needed
    const numSubBatches = Math.ceil(totalStudents / labCapacity);
    const subBatches: SubBatch[] = [];
    let remainingStudents = totalStudents;

    for (let i = 0; i < numSubBatches; i++) {
        const count = Math.min(labCapacity, remainingStudents);
        subBatches.push({
            id: uuidv4(),
            name: `A${i + 1}`,
            studentCount: count,
        });
        remainingStudents -= count;
    }

    return subBatches;
}

const academicSlice = createSlice({
    name: 'academic',
    initialState,
    reducers: {
        // Batch operations
        addBatch: (
            state,
            action: PayloadAction<{
                batch: Omit<Batch, 'id' | 'createdAt' | 'subBatches'>;
                labCapacity: number;
            }>
        ) => {
            const { batch, labCapacity } = action.payload;
            const newBatch: Batch = {
                ...batch,
                id: uuidv4(),
                createdAt: Date.now(),
                subBatches: calculateSubBatches(batch.totalStudents, labCapacity),
            };
            state.batches.push(newBatch);
            // Sort by name for deterministic ordering
            state.batches.sort((a, b) => a.name.localeCompare(b.name));
        },
        updateBatch: (
            state,
            action: PayloadAction<{
                batch: Batch;
                labCapacity: number;
            }>
        ) => {
            const { batch, labCapacity } = action.payload;
            const index = state.batches.findIndex(b => b.id === batch.id);
            if (index !== -1) {
                state.batches[index] = {
                    ...batch,
                    subBatches: calculateSubBatches(batch.totalStudents, labCapacity),
                };
                state.batches.sort((a, b) => a.name.localeCompare(b.name));
            }
        },
        deleteBatch: (state, action: PayloadAction<string>) => {
            state.batches = state.batches.filter(b => b.id !== action.payload);
        },

        // Subject operations
        addSubject: (state, action: PayloadAction<Omit<Subject, 'id' | 'createdAt' | 'constraints'>>) => {
            const subject: Subject = {
                ...action.payload,
                id: uuidv4(),
                createdAt: Date.now(),
                constraints: getDefaultConstraints(action.payload.type),
            };
            state.subjects.push(subject);
            state.subjects.sort((a, b) => a.name.localeCompare(b.name));
        },
        updateSubject: (state, action: PayloadAction<Subject>) => {
            const index = state.subjects.findIndex(s => s.id === action.payload.id);
            if (index !== -1) {
                state.subjects[index] = {
                    ...action.payload,
                    constraints: getDefaultConstraints(action.payload.type),
                };
                state.subjects.sort((a, b) => a.name.localeCompare(b.name));
            }
        },
        deleteSubject: (state, action: PayloadAction<string>) => {
            const subjectId = action.payload;
            // Remove from faculty assignments
            state.faculty.forEach(f => {
                f.assignedTheorySubjects = f.assignedTheorySubjects.filter(id => id !== subjectId);
                f.assignedLabSubjects = f.assignedLabSubjects.filter(id => id !== subjectId);
            });
            state.subjects = state.subjects.filter(s => s.id !== subjectId);
        },

        // Faculty operations
        addFaculty: (state, action: PayloadAction<Omit<Faculty, 'id' | 'createdAt' | 'assignedTheorySubjects' | 'assignedLabSubjects'>>) => {
            const faculty: Faculty = {
                ...action.payload,
                id: uuidv4(),
                createdAt: Date.now(),
                assignedTheorySubjects: [],
                assignedLabSubjects: [],
            };
            state.faculty.push(faculty);
            state.faculty.sort((a, b) => a.name.localeCompare(b.name));
        },
        updateFaculty: (state, action: PayloadAction<Faculty>) => {
            const index = state.faculty.findIndex(f => f.id === action.payload.id);
            if (index !== -1) {
                state.faculty[index] = action.payload;
                state.faculty.sort((a, b) => a.name.localeCompare(b.name));
            }
        },
        deleteFaculty: (state, action: PayloadAction<string>) => {
            state.faculty = state.faculty.filter(f => f.id !== action.payload);
        },

        // Faculty assignment operations
        assignTheoryToFaculty: (
            state,
            action: PayloadAction<{ facultyId: string; subjectId: string }>
        ) => {
            const faculty = state.faculty.find(f => f.id === action.payload.facultyId);
            if (faculty && !faculty.assignedTheorySubjects.includes(action.payload.subjectId)) {
                faculty.assignedTheorySubjects.push(action.payload.subjectId);
                faculty.assignedTheorySubjects.sort(); // Deterministic
            }
        },
        unassignTheoryFromFaculty: (
            state,
            action: PayloadAction<{ facultyId: string; subjectId: string }>
        ) => {
            const faculty = state.faculty.find(f => f.id === action.payload.facultyId);
            if (faculty) {
                faculty.assignedTheorySubjects = faculty.assignedTheorySubjects.filter(
                    id => id !== action.payload.subjectId
                );
            }
        },
        assignLabToFaculty: (
            state,
            action: PayloadAction<{ facultyId: string; subjectId: string }>
        ) => {
            const faculty = state.faculty.find(f => f.id === action.payload.facultyId);
            if (faculty && !faculty.assignedLabSubjects.includes(action.payload.subjectId)) {
                faculty.assignedLabSubjects.push(action.payload.subjectId);
                faculty.assignedLabSubjects.sort(); // Deterministic
            }
        },
        unassignLabFromFaculty: (
            state,
            action: PayloadAction<{ facultyId: string; subjectId: string }>
        ) => {
            const faculty = state.faculty.find(f => f.id === action.payload.facultyId);
            if (faculty) {
                faculty.assignedLabSubjects = faculty.assignedLabSubjects.filter(
                    id => id !== action.payload.subjectId
                );
            }
        },

        // Reset entire academic state
        resetAcademic: () => initialState,
    },
});

export const {
    addBatch,
    updateBatch,
    deleteBatch,
    addSubject,
    updateSubject,
    deleteSubject,
    addFaculty,
    updateFaculty,
    deleteFaculty,
    assignTheoryToFaculty,
    unassignTheoryFromFaculty,
    assignLabToFaculty,
    unassignLabFromFaculty,
    resetAcademic,
} = academicSlice.actions;

// Export helper for use in components
export { calculateSubBatches };

export default academicSlice.reducer;
