import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
    Text,
    FAB,
    Card,
    IconButton,
    Portal,
    Dialog,
    TextInput,
    Button,
    useTheme,
    Chip,
    HelperText,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
    addClassroom,
    updateClassroom,
    deleteClassroom
} from '../../../store/slices/infrastructureSlice';
import { Classroom } from '../../../types';

export default function ClassroomsScreen() {
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const departments = useAppSelector(state => state.infrastructure.departments);
    const classrooms = useAppSelector(state => state.infrastructure.classrooms);

    const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || '');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Classroom | null>(null);
    const [roomName, setRoomName] = useState('');
    const [capacity, setCapacity] = useState('');

    const filteredClassrooms = classrooms.filter(c => c.departmentId === selectedDeptId);

    const openAddDialog = () => {
        if (!selectedDeptId) {
            Alert.alert('Error', 'Please select a department first');
            return;
        }
        setEditingRoom(null);
        setRoomName('');
        setCapacity('');
        setDialogVisible(true);
    };

    const openEditDialog = (room: Classroom) => {
        setEditingRoom(room);
        setRoomName(room.name);
        setCapacity(room.capacity.toString());
        setDialogVisible(true);
    };

    const handleSave = () => {
        if (!roomName.trim()) {
            Alert.alert('Error', 'Classroom name is required');
            return;
        }

        const capacityNum = parseInt(capacity, 10);
        if (isNaN(capacityNum) || capacityNum <= 0) {
            Alert.alert('Error', 'Valid capacity is required (must be > 0)');
            return;
        }

        if (editingRoom) {
            dispatch(updateClassroom({
                ...editingRoom,
                name: roomName.trim(),
                capacity: capacityNum,
            }));
        } else {
            dispatch(addClassroom({
                name: roomName.trim(),
                departmentId: selectedDeptId,
                capacity: capacityNum,
            }));
        }

        setDialogVisible(false);
        setRoomName('');
        setCapacity('');
        setEditingRoom(null);
    };

    const handleDelete = (room: Classroom) => {
        Alert.alert(
            'Delete Classroom',
            `Are you sure you want to delete "${room.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteClassroom(room.id)) },
            ]
        );
    };

    if (departments.length === 0) {
        return (
            <View style={[styles.container, styles.emptyState, { backgroundColor: theme.colors.background }]}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    No departments available
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                    Please add a department first
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.deptSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {departments.map(dept => (
                        <Chip
                            key={dept.id}
                            selected={selectedDeptId === dept.id}
                            onPress={() => setSelectedDeptId(dept.id)}
                            style={styles.chip}
                            mode="outlined"
                        >
                            {dept.name}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {filteredClassrooms.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            No classrooms in this department
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                            Add a classroom with capacity
                        </Text>
                    </View>
                ) : (
                    filteredClassrooms.map(room => (
                        <Card key={room.id} style={styles.card} mode="elevated">
                            <Card.Title
                                title={room.name}
                                subtitle={`Capacity: ${room.capacity} students`}
                                left={() => (
                                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.tertiaryContainer }]}>
                                        <Text style={{ color: theme.colors.tertiary, fontWeight: 'bold', fontSize: 12 }}>
                                            {room.capacity}
                                        </Text>
                                    </View>
                                )}
                                right={() => (
                                    <View style={styles.actions}>
                                        <IconButton
                                            icon="pencil"
                                            size={20}
                                            onPress={() => openEditDialog(room)}
                                        />
                                        <IconButton
                                            icon="delete"
                                            size={20}
                                            iconColor={theme.colors.error}
                                            onPress={() => handleDelete(room)}
                                        />
                                    </View>
                                )}
                            />
                        </Card>
                    ))
                )}
            </ScrollView>

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={openAddDialog}
                color={theme.colors.onPrimary}
            />

            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
                    <Dialog.Title>{editingRoom ? 'Edit Classroom' : 'Add Classroom'}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Classroom Name"
                            value={roomName}
                            onChangeText={setRoomName}
                            mode="outlined"
                            placeholder="e.g., Room 101, Lecture Hall A"
                            style={{ marginBottom: 16 }}
                        />
                        <TextInput
                            label="Capacity"
                            value={capacity}
                            onChangeText={setCapacity}
                            mode="outlined"
                            keyboardType="numeric"
                            placeholder="e.g., 60"
                        />
                        <HelperText type="info">
                            Capacity is required and must be greater than 0
                        </HelperText>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
                        <Button onPress={handleSave} mode="contained">
                            {editingRoom ? 'Update' : 'Add'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    deptSelector: {
        padding: 16,
        paddingBottom: 8,
    },
    chip: {
        marginRight: 8,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 0,
        paddingBottom: 80,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    card: {
        marginBottom: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
    },
});
