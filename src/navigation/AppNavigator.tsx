import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import RoleSelector from '../screens/RoleSelector';
import AdminNavigator from './AdminNavigator';
import StudentNavigator from './StudentNavigator';

export default function AppNavigator() {
    const role = useAppSelector(state => state.app.role);

    return (
        <NavigationContainer>
            {role === null && <RoleSelector />}
            {role === 'admin' && <AdminNavigator />}
            {role === 'student' && <StudentNavigator />}
        </NavigationContainer>
    );
}
