import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    Timetable,
    TimetableEntry,
    TimetableState,
    GenerationResult,
    LabRotation,
} from '../../types';

const initialState: TimetableState = {
    timetables: [],
    currentGeneration: {
        isGenerating: false,
        result: null,
    },
    labRotations: [],
};

const timetableSlice = createSlice({
    name: 'timetable',
    initialState,
    reducers: {
        // Start generation
        startGeneration: (state) => {
            state.currentGeneration = {
                isGenerating: true,
                result: null,
            };
        },

        // Complete generation
        completeGeneration: (state, action: PayloadAction<GenerationResult>) => {
            state.currentGeneration = {
                isGenerating: false,
                result: action.payload,
            };

            // If successful, add to timetables
            if (action.payload.success && action.payload.timetable) {
                // Remove existing timetable for this batch
                state.timetables = state.timetables.filter(
                    t => t.batchId !== action.payload.timetable!.batchId
                );
                state.timetables.push(action.payload.timetable);
                // Sort by batch ID for deterministic ordering
                state.timetables.sort((a, b) => a.batchId.localeCompare(b.batchId));
            }
        },

        // Store a generated timetable directly
        setTimetable: (state, action: PayloadAction<Timetable>) => {
            const index = state.timetables.findIndex(t => t.batchId === action.payload.batchId);
            if (index !== -1) {
                state.timetables[index] = action.payload;
            } else {
                state.timetables.push(action.payload);
            }
            state.timetables.sort((a, b) => a.batchId.localeCompare(b.batchId));
        },

        // Delete a timetable
        deleteTimetable: (state, action: PayloadAction<string>) => {
            state.timetables = state.timetables.filter(t => t.id !== action.payload);
        },

        // Update lab rotations
        setLabRotations: (state, action: PayloadAction<LabRotation[]>) => {
            state.labRotations = action.payload;
        },

        // Add a single lab rotation
        addLabRotation: (state, action: PayloadAction<LabRotation>) => {
            state.labRotations.push(action.payload);
        },

        // Clear generation result
        clearGenerationResult: (state) => {
            state.currentGeneration = {
                isGenerating: false,
                result: null,
            };
        },

        // Reset entire timetable state
        resetTimetable: () => initialState,
    },
});

export const {
    startGeneration,
    completeGeneration,
    setTimetable,
    deleteTimetable,
    setLabRotations,
    addLabRotation,
    clearGenerationResult,
    resetTimetable,
} = timetableSlice.actions;

export default timetableSlice.reducer;
