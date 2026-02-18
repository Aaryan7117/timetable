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
    addLab,
    updateLab,
    deleteLab
} from '../../../store/slices/infrastructureSlice';
import { Lab } from '../../../types';

export default function LabsScreen() {
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const departments = useAppSelector(state => state.infrastructure.departments);
    const labs = useAppSelector(state => state.infrastructure.labs);

    const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || '');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingLab, setEditingLab] = useState<Lab | null>(null);
    const [labName, setLabName] = useState('');
    const [capacity, setCapacity] = useState('');

    const filteredLabs = labs.filter(l => l.departmentId === selectedDeptId);

    const openAddDialog = () => {
        if (!selectedDeptId) {
            Alert.alert('Error', 'Please select a department first');
            return;
        }
        setEditingLab(null);
        setLabName('');
        setCapacity('');
        setDialogVisible(true);
    };

    const openEditDialog = (lab: Lab) => {
        setEditingLab(lab);
        setLabName(lab.name);
        setCapacity(lab.capacity.toString());
        setDialogVisible(true);
    };

    const handleSave = () => {
        if (!labName.trim()) {
            Alert.alert('Error', 'Lab name is required');
            return;
        }

        const capacityNum = parseInt(capacity, 10);
        if (isNaN(capacityNum) || capacityNum <= 0) {
            Alert.alert('Error', 'Valid capacity is required (must be > 0)');
            return;
        }

        if (editingLab) {
            dispatch(updateLab({
                ...editingLab,
                name: labName.trim(),
                capacity: capacityNum,
            }));
        } else {
            dispatch(addLab({
                name: labName.trim(),
                departmentId: selectedDeptId,
                capacity: capacityNum,
            }));
        }

        setDialogVisible(false);
        setLabName('');
        setCapacity('');
        setEditingLab(null);
    };

    const handleDelete = (lab: Lab) => {
        Alert.alert(
            'Delete Lab',
            `Are you sure you want to delete "${lab.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteLab(lab.id)) },
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
                <Card style={[styles.infoCard, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Card.Content>
                        <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                            💡 Lab capacity determines batch splitting. If batch size &gt; lab capacity, students are automatically split into sub-batches.
                        </Text>
                    </Card.Content>
                </Card>

                {filteredLabs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            No labs in this department
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                            Add a lab with capacity
                        </Text>
                    </View>
                ) : (
                    filteredLabs.map(lab => (
                        <Card key={lab.id} style={styles.card} mode="elevated">
                            <Card.Title
                                title={lab.name}
                                subtitle={`Capacity: ${lab.capacity} students`}
                                left={() => (
                                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondaryContainer }]}>
                                        <Text style={{ color: theme.colors.secondary, fontWeight: 'bold', fontSize: 12 }}>
                                            {lab.capacity}
                                        </Text>
                                    </View>
                                )}
                                right={() => (
                                    <View style={styles.actions}>
                                        <IconButton
                                            icon="pencil"
                                            size={20}
                                            onPress={() => openEditDialog(lab)}
                                        />
                                        <IconButton
                                            icon="delete"
                                            size={20}
                                            iconColor={theme.colors.error}
                                            onPress={() => handleDelete(lab)}
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
                    <Dialog.Title>{editingLab ? 'Edit Lab' : 'Add Lab'}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Lab Name"
                            value={labName}
                            onChangeText={setLabName}
                            mode="outlined"
                            placeholder="e.g., Computer Lab 1, Physics Lab"
                            style={{ marginBottom: 16 }}
                        />
                        <TextInput
                            label="Capacity"
                            value={capacity}
                            onChangeText={setCapacity}
                            mode="outlined"
                            keyboardType="numeric"
                            placeholder="e.g., 30"
                        />
                        <HelperText type="info">
                            Capacity determines how many students can attend a lab session. Batches larger than this capacity will be automatically split.
                        </HelperText>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
                        <Button onPress={handleSave} mode="contained">
                            {editingLab ? 'Update' : 'Add'}
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
    infoCard: {
        marginBottom: 16,
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
