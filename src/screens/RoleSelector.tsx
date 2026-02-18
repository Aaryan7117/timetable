import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface, useTheme } from 'react-native-paper';
import { useAppDispatch } from '../store/hooks';
import { setRole, UserRole } from '../store/slices/appSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RoleSelectorProps {
    onRoleSelected?: () => void;
}

export default function RoleSelector({ onRoleSelected }: RoleSelectorProps) {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const handleSelectRole = (role: UserRole) => {
        dispatch(setRole(role));
        onRoleSelected?.();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <MaterialCommunityIcons name="calendar-clock" size={80} color={theme.colors.primary} />
                <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
                    Dynamic Timetable
                </Text>
                <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Intelligent Academic Scheduling System
                </Text>
            </View>

            <View style={styles.cardsContainer}>
                <Surface style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
                    <MaterialCommunityIcons name="shield-account" size={48} color={theme.colors.primary} />
                    <Text variant="titleLarge" style={{ color: theme.colors.onPrimaryContainer, marginTop: 12 }}>
                        Administrator
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, textAlign: 'center', marginVertical: 12 }}>
                        Configure infrastructure, academic settings, and generate timetables
                    </Text>
                    <Button
                        mode="contained"
                        onPress={() => handleSelectRole('admin')}
                        style={styles.button}
                    >
                        Enter as Admin
                    </Button>
                </Surface>

                <Surface style={[styles.card, { backgroundColor: theme.colors.secondaryContainer }]} elevation={2}>
                    <MaterialCommunityIcons name="school" size={48} color={theme.colors.secondary} />
                    <Text variant="titleLarge" style={{ color: theme.colors.onSecondaryContainer, marginTop: 12 }}>
                        Student
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer, textAlign: 'center', marginVertical: 12 }}>
                        View your class timetable and lab schedule
                    </Text>
                    <Button
                        mode="contained-tonal"
                        onPress={() => handleSelectRole('student')}
                        style={styles.button}
                    >
                        Enter as Student
                    </Button>
                </Surface>
            </View>

            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 24 }}>
                Production-Grade Academic Scheduling
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        marginTop: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        marginTop: 8,
        textAlign: 'center',
    },
    cardsContainer: {
        width: '100%',
        maxWidth: 360,
        gap: 16,
    },
    card: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    button: {
        width: '100%',
        marginTop: 8,
    },
});
