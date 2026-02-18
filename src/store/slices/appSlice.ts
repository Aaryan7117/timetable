import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'admin' | 'student' | null;

export interface AppState {
    role: UserRole;
    selectedBatchId: string | null; // For student view
    theme: 'light' | 'dark';
}

const initialState: AppState = {
    role: null,
    selectedBatchId: null,
    theme: 'light',
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setRole: (state, action: PayloadAction<UserRole>) => {
            state.role = action.payload;
        },
        setSelectedBatch: (state, action: PayloadAction<string | null>) => {
            state.selectedBatchId = action.payload;
        },
        toggleTheme: (state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
        },
        setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
            state.theme = action.payload;
        },
        resetApp: () => initialState,
    },
});

export const {
    setRole,
    setSelectedBatch,
    toggleTheme,
    setTheme,
    resetApp,
} = appSlice.actions;

export default appSlice.reducer;
