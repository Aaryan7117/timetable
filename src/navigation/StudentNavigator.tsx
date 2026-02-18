import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button, useTheme } from 'react-native-paper';

import { StudentTimetableScreen } from '../screens/student';
import { useAppDispatch } from '../store/hooks';
import { setRole } from '../store/slices/appSlice';

const Tab = createBottomTabNavigator();

function SettingsScreen() {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
            <Text style={{ color: theme.colors.onBackground, marginBottom: 20 }}>Student Settings</Text>
            <Button mode="outlined" onPress={() => dispatch(setRole(null))}>
                Switch Role
            </Button>
        </View>
    );
}

export default function StudentNavigator() {
    const theme = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#1976D2',
                tabBarInactiveTintColor: '#666666',
            }}
        >
            <Tab.Screen
                name="MyTimetable"
                component={StudentTimetableScreen}
                options={{
                    title: 'My Timetable',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="calendar-text" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="cog" color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
