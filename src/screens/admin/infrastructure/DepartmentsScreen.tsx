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
    SegmentedButtons,
    Chip,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
    addDepartment,
    updateDepartment,
    deleteDepartment
} from '../../../store/slices/infrastructureSlice';
import { Department } from '../../../types';

export default function DepartmentsScreen() {
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const blocks = useAppSelector(state => state.infrastructure.blocks);
    const departments = useAppSelector(state => state.infrastructure.departments);
    const classrooms = useAppSelector(state => state.infrastructure.classrooms);
    const labs = useAppSelector(state => state.infrastructure.labs);

    const [selectedBlockId, setSelectedBlockId] = useState<string>(blocks[0]?.id || '');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [deptName, setDeptName] = useState('');

    const filteredDepartments = departments.filter(d => d.blockId === selectedBlockId);

    const openAddDialog = () => {
        if (!selectedBlockId) {
            Alert.alert('Error', 'Please select a block first');
            return;
        }
        setEditingDept(null);
        setDeptName('');
        setDialogVisible(true);
    };

    const openEditDialog = (dept: Department) => {
        setEditingDept(dept);
        setDeptName(dept.name);
        setDialogVisible(true);
    };

    const handleSave = () => {
        if (!deptName.trim()) {
            Alert.alert('Error', 'Department name is required');
            return;
        }

        if (editingDept) {
            dispatch(updateDepartment({ ...editingDept, name: deptName.trim() }));
        } else {
            dispatch(addDepartment({ name: deptName.trim(), blockId: selectedBlockId }));
        }

        setDialogVisible(false);
        setDeptName('');
        setEditingDept(null);
    };

    const handleDelete = (dept: Department) => {
        const classroomCount = classrooms.filter(c => c.departmentId === dept.id).length;
        const labCount = labs.filter(l => l.departmentId === dept.id).length;
        const hasChildren = classroomCount > 0 || labCount > 0;

        const message = hasChildren
            ? `This will also delete ${classroomCount} classroom(s) and ${labCount} lab(s).`
            : 'Are you sure you want to delete this department?';

        Alert.alert(
            'Delete Department',
            message,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteDepartment(dept.id)) },
            ]
        );
    };

    const getResourceCount = (deptId: string) => {
        const cr = classrooms.filter(c => c.departmentId === deptId).length;
        const lb = labs.filter(l => l.departmentId === deptId).length;
        return { classrooms: cr, labs: lb };
    };

    if (blocks.length === 0) {
        return (
            <View style={[styles.container, styles.emptyState, { backgroundColor: theme.colors.background }]}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    No blocks available
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                    Please add a block first
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.blockSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {blocks.map(block => (
                        <Chip
                            key={block.id}
                            selected={selectedBlockId === block.id}
                            onPress={() => setSelectedBlockId(block.id)}
                            style={styles.chip}
                            mode="outlined"
                        >
                            {block.name}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {filteredDepartments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            No departments in this block
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                            Add a department to continue
                        </Text>
                    </View>
                ) : (
                    filteredDepartments.map(dept => {
                        const counts = getResourceCount(dept.id);
                        return (
                            <Card key={dept.id} style={styles.card} mode="elevated">
                                <Card.Title
                                    title={dept.name}
                                    subtitle={`${counts.classrooms} classrooms, ${counts.labs} labs`}
                                    left={() => (
                                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondaryContainer }]}>
                                            <Text style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>
                                                {dept.name.substring(0, 3).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                    right={() => (
                                        <View style={styles.actions}>
                                            <IconButton
                                                icon="pencil"
                                                size={20}
                                                onPress={() => openEditDialog(dept)}
                                            />
                                            <IconButton
                                                icon="delete"
                                                size={20}
                                                iconColor={theme.colors.error}
                                                onPress={() => handleDelete(dept)}
                                            />
                                        </View>
                                    )}
                                />
                            </Card>
                        );
                    })
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
                    <Dialog.Title>{editingDept ? 'Edit Department' : 'Add Department'}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Department Name"
                            value={deptName}
                            onChangeText={setDeptName}
                            mode="outlined"
                            placeholder="e.g., Computer Science, ECE"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
                        <Button onPress={handleSave} mode="contained">
                            {editingDept ? 'Update' : 'Add'}
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
    blockSelector: {
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
