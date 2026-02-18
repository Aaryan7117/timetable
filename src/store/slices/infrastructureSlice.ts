import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
    Block,
    Department,
    Classroom,
    Lab,
    InfrastructureState
} from '../../types';

const initialState: InfrastructureState = {
    blocks: [],
    departments: [],
    classrooms: [],
    labs: [],
};

const infrastructureSlice = createSlice({
    name: 'infrastructure',
    initialState,
    reducers: {
        // Block operations
        addBlock: (state, action: PayloadAction<Omit<Block, 'id' | 'createdAt'>>) => {
            const block: Block = {
                ...action.payload,
                id: uuidv4(),
                createdAt: Date.now(),
            };
            state.blocks.push(block);
            // Sort by name for deterministic ordering
            state.blocks.sort((a, b) => a.name.localeCompare(b.name));
        },
        updateBlock: (state, action: PayloadAction<Block>) => {
            const index = state.blocks.findIndex(b => b.id === action.payload.id);
            if (index !== -1) {
                state.blocks[index] = action.payload;
                state.blocks.sort((a, b) => a.name.localeCompare(b.name));
            }
        },
        deleteBlock: (state, action: PayloadAction<string>) => {
            const blockId = action.payload;
            // Cascade delete: remove departments, classrooms, and labs in this block
            const deptIds = state.departments
                .filter(d => d.blockId === blockId)
                .map(d => d.id);

            state.classrooms = state.classrooms.filter(c => !deptIds.includes(c.departmentId));
            state.labs = state.labs.filter(l => !deptIds.includes(l.departmentId));
            state.departments = state.departments.filter(d => d.blockId !== blockId);
            state.blocks = state.blocks.filter(b => b.id !== blockId);
        },

        // Department operations
        addDepartment: (state, action: PayloadAction<Omit<Department, 'id' | 'createdAt'>>) => {
            const department: Department = {
                ...action.payload,
                id: uuidv4(),
                createdAt: Date.now(),
            };
            state.departments.push(department);
            state.departments.sort((a, b) => a.name.localeCompare(b.name));
        },
        updateDepartment: (state, action: PayloadAction<Department>) => {
            const index = state.departments.findIndex(d => d.id === action.payload.id);
            if (index !== -1) {
                state.departments[index] = action.payload;
                state.departments.sort((a, b) => a.name.localeCompare(b.name));
            }
        },
        deleteDepartment: (state, action: PayloadAction<string>) => {
            const deptId = action.payload;
            // Cascade delete classrooms and labs
            state.classrooms = state.classrooms.filter(c => c.departmentId !== deptId);
            state.labs = state.labs.filter(l => l.departmentId !== deptId);
            state.departments = state.departments.filter(d => d.id !== deptId);
        },

        // Classroom operations
        addClassroom: (state, action: PayloadAction<Omit<Classroom, 'id' | 'createdAt'>>) => {
            const classroom: Classroom = {
                ...action.payload,
                id: uuidv4(),
                createdAt: Date.now(),
            };
            state.classrooms.push(classroom);
            state.classrooms.sort((a, b) => a.name.localeCompare(b.name));
        },
        updateClassroom: (state, action: PayloadAction<Classroom>) => {
            const index = state.classrooms.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.classrooms[index] = action.payload;
                state.classrooms.sort((a, b) => a.name.localeCompare(b.name));
            }
        },
        deleteClassroom: (state, action: PayloadAction<string>) => {
            state.classrooms = state.classrooms.filter(c => c.id !== action.payload);
        },

        // Lab operations
        addLab: (state, action: PayloadAction<Omit<Lab, 'id' | 'createdAt'>>) => {
            const lab: Lab = {
                ...action.payload,
                id: uuidv4(),
                createdAt: Date.now(),
            };
            state.labs.push(lab);
            state.labs.sort((a, b) => a.name.localeCompare(b.name));
        },
        updateLab: (state, action: PayloadAction<Lab>) => {
            const index = state.labs.findIndex(l => l.id === action.payload.id);
            if (index !== -1) {
                state.labs[index] = action.payload;
                state.labs.sort((a, b) => a.name.localeCompare(b.name));
            }
        },
        deleteLab: (state, action: PayloadAction<string>) => {
            state.labs = state.labs.filter(l => l.id !== action.payload);
        },

        // Reset entire infrastructure
        resetInfrastructure: () => initialState,
    },
});

export const {
    addBlock,
    updateBlock,
    deleteBlock,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addClassroom,
    updateClassroom,
    deleteClassroom,
    addLab,
    updateLab,
    deleteLab,
    resetInfrastructure,
} = infrastructureSlice.actions;

export default infrastructureSlice.reducer;
