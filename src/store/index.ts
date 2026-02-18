import { configureStore, combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    infrastructureReducer,
    academicReducer,
    timetableReducer,
    appReducer,
} from './slices';

// Combine all reducers
const rootReducer = combineReducers({
    infrastructure: infrastructureReducer,
    academic: academicReducer,
    timetable: timetableReducer,
    app: appReducer,
});

// Create store
export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Disable for AsyncStorage
        }),
});

// Persistence key
const STORAGE_KEY = '@DynamicTimetable:state';

// Save state to AsyncStorage
export async function saveState(): Promise<void> {
    try {
        const state = store.getState();
        const serializedState = JSON.stringify({
            infrastructure: state.infrastructure,
            academic: state.academic,
            timetable: state.timetable,
            app: {
                ...state.app,
                // Don't persist role selection - require fresh selection each time
                // role: null, // Uncomment to require role selection on restart
            },
        });
        await AsyncStorage.setItem(STORAGE_KEY, serializedState);
    } catch (error) {
        console.error('Failed to save state:', error);
    }
}

// Load state from AsyncStorage
export async function loadState(): Promise<Partial<RootState> | undefined> {
    try {
        const serializedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (serializedState === null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch (error) {
        console.error('Failed to load state:', error);
        return undefined;
    }
}

// Initialize store with persisted state
export async function initializeStore(): Promise<void> {
    const persistedState = await loadState();
    if (persistedState) {
        // Dispatch actions to restore state
        if (persistedState.infrastructure) {
            // Clean restore - set entire state
            Object.assign(store.getState().infrastructure, persistedState.infrastructure);
        }
    }
}

// Subscribe to store changes and save
let saveTimeout: NodeJS.Timeout | null = null;
export function setupPersistence(): void {
    store.subscribe(() => {
        // Debounce saves to avoid excessive writes
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        saveTimeout = setTimeout(() => {
            saveState();
        }, 500);
    });
}

// Type exports
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
