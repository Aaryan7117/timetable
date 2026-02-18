import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Infrastructure screens
import { BlocksScreen, DepartmentsScreen, ClassroomsScreen, LabsScreen } from '../screens/admin/infrastructure';

// Academic screens
import { BatchesScreen, SubjectsScreen, FacultyScreen } from '../screens/admin/academic';

// Generation screens
import { GenerateScreen, TimetableViewScreen } from '../screens/admin/generation';

const Tab = createBottomTabNavigator();
const InfraStack = createNativeStackNavigator();
const AcademicStack = createNativeStackNavigator();

function InfrastructureNavigator() {
    return (
        <InfraStack.Navigator>
            <InfraStack.Screen name="Blocks" component={BlocksScreen} />
            <InfraStack.Screen name="Departments" component={DepartmentsScreen} />
            <InfraStack.Screen name="Classrooms" component={ClassroomsScreen} />
            <InfraStack.Screen name="Labs" component={LabsScreen} />
        </InfraStack.Navigator>
    );
}

function AcademicNavigator() {
    return (
        <AcademicStack.Navigator>
            <AcademicStack.Screen name="Batches" component={BatchesScreen} />
            <AcademicStack.Screen name="Subjects" component={SubjectsScreen} />
            <AcademicStack.Screen name="Faculty" component={FacultyScreen} />
        </AcademicStack.Navigator>
    );
}

export default function AdminNavigator() {
    const theme = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#1976D2',
                tabBarInactiveTintColor: '#666666',
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Infrastructure"
                component={InfrastructureNavigator}
                options={{
                    title: 'Infra',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="office-building" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Academic"
                component={AcademicNavigator}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="school" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Generate"
                component={GenerateScreen}
                options={{
                    headerShown: true,
                    title: 'Generate Timetable',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="cog-play" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Timetable"
                component={TimetableViewScreen}
                options={{
                    headerShown: true,
                    title: 'View Timetable',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="calendar-check" color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
