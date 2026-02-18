// Must be imported first to polyfill crypto.getRandomValues for uuid
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, setupPersistence } from './src/store';
import { useAppSelector } from './src/store/hooks';
import { AppNavigator } from './src/navigation';

// Custom theme with timetable-appropriate colors
const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976D2',
    primaryContainer: '#BBDEFB',
    secondary: '#388E3C',
    secondaryContainer: '#C8E6C9',
    tertiary: '#F57C00',
    tertiaryContainer: '#FFE0B2',
    error: '#D32F2F',
    errorContainer: '#FFCDD2',
  },
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#64B5F6',
    primaryContainer: '#1565C0',
    secondary: '#81C784',
    secondaryContainer: '#2E7D32',
    tertiary: '#FFB74D',
    tertiaryContainer: '#E65100',
    error: '#EF5350',
    errorContainer: '#B71C1C',
  },
};

function ThemedApp() {
  const themeMode = useAppSelector(state => state.app.theme);
  const theme = themeMode === 'dark' ? customDarkTheme : customLightTheme;

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <AppNavigator />
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default function App() {
  useEffect(() => {
    // Setup persistence on mount
    setupPersistence();
  }, []);

  return (
    <ReduxProvider store={store}>
      <ThemedApp />
    </ReduxProvider>
  );
}
