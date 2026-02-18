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
    List,
    Checkbox,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
    addFaculty,
    updateFaculty,
    deleteFaculty,
    assignTheoryToFaculty,
    unassignTheoryFromFaculty,
    assignLabToFaculty,
    unassignLabFromFaculty,
} from '../../../store/slices/academicSlice';
import { Faculty, FacultyDesignation, FACULTY_WORKLOAD_LIMITS } from '../../../types';

const DESIGNATIONS: FacultyDesignation[] = ['PROFESSOR', 'ASSOCIATE_PROFESSOR', 'ASSISTANT_PROFESSOR'];
const DESIGNATION_LABELS: Record<FacultyDesignation, string> = {
    PROFESSOR: 'Professor',
    ASSOCIATE_PROFESSOR: 'Associate Professor',
    ASSISTANT_PROFESSOR: 'Assistant Professor',
};

export default function FacultyScreen() {
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const departments = useAppSelector(state => state.infrastructure.departments);
    const facultyList = useAppSelector(state => state.academic.faculty);
    const subjects = useAppSelector(state => state.academic.subjects);

    const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || '');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [assignDialogVisible, setAssignDialogVisible] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
    const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

    const [name, setName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [designation, setDesignation] = useState<FacultyDesignation>('ASSISTANT_PROFESSOR');

    const filteredFaculty = facultyList.filter(f => f.departmentId === selectedDeptId);
    const deptSubjects = subjects.filter(s => s.departmentId === selectedDeptId);

    const openAddDialog = () => {
        if (!selectedDeptId) {
            Alert.alert('Error', 'Please select a department first');
            return;
        }
        setEditingFaculty(null);
        setName('');
        setEmployeeId('');
        setDesignation('ASSISTANT_PROFESSOR');
        setDialogVisible(true);
    };

    const openEditDialog = (faculty: Faculty) => {
        setEditingFaculty(faculty);
        setName(faculty.name);
        setEmployeeId(faculty.employeeId);
        setDesignation(faculty.designation);
        setDialogVisible(true);
    };

    const openAssignDialog = (faculty: Faculty) => {
        setSelectedFaculty(faculty);
        setAssignDialogVisible(true);
    };

    const handleSave = () => {
        if (!name.trim() || !employeeId.trim()) {
            Alert.alert('Error', 'Name and Employee ID are required');
            return;
        }

        if (editingFaculty) {
            dispatch(updateFaculty({
                ...editingFaculty,
                name: name.trim(),
                employeeId: employeeId.trim(),
                designation,
            }));
        } else {
            dispatch(addFaculty({
                name: name.trim(),
                employeeId: employeeId.trim(),
                designation,
                departmentId: selectedDeptId,
            }));
        }

        setDialogVisible(false);
    };

    const handleDelete = (faculty: Faculty) => {
        Alert.alert(
            'Delete Faculty',
            `Are you sure you want to delete "${faculty.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteFaculty(faculty.id)) },
            ]
        );
    };

    const toggleTheoryAssignment = (subjectId: string) => {
        if (!selectedFaculty) return;

        if (selectedFaculty.assignedTheorySubjects.includes(subjectId)) {
            dispatch(unassignTheoryFromFaculty({ facultyId: selectedFaculty.id, subjectId }));
        } else {
            dispatch(assignTheoryToFaculty({ facultyId: selectedFaculty.id, subjectId }));
        }
    };

    const toggleLabAssignment = (subjectId: string) => {
        if (!selectedFaculty) return;

        if (selectedFaculty.assignedLabSubjects.includes(subjectId)) {
            dispatch(unassignLabFromFaculty({ facultyId: selectedFaculty.id, subjectId }));
        } else {
            dispatch(assignLabToFaculty({ facultyId: selectedFaculty.id, subjectId }));
        }
    };

    const getWorkloadLimits = (d: FacultyDesignation) => {
        const limits = FACULTY_WORKLOAD_LIMITS[d];
        return `${limits.theoryPeriods} theory + ${limits.labSessions} labs`;
    };

    if (departments.length === 0) {
        return (
            <View style={[styles.container, styles.emptyState, { backgroundColor: theme.colors.background }]}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    No departments available
                </Text>
            </View>
        );
    }

    // Update selectedFaculty reference when faculty list changes
    const currentSelectedFaculty = selectedFaculty
        ? facultyList.find(f => f.id === selectedFaculty.id)
        : null;

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
                {filteredFaculty.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            No faculty in this department
                        </Text>
                    </View>
                ) : (
                    filteredFaculty.map(faculty => (
                        <Card key={faculty.id} style={styles.card} mode="elevated">
                            <Card.Title
                                title={faculty.name}
                                subtitle={`${faculty.employeeId} | ${DESIGNATION_LABELS[faculty.designation]}`}
                            />
                            <Card.Content>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    Limit: {getWorkloadLimits(faculty.designation)}
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 4 }}>
                                    Assigned: {faculty.assignedTheorySubjects.length} theory, {faculty.assignedLabSubjects.length} labs
                                </Text>
                            </Card.Content>
                            <Card.Actions>
                                <Button onPress={() => openAssignDialog(faculty)}>Assign</Button>
                                <IconButton icon="pencil" onPress={() => openEditDialog(faculty)} />
                                <IconButton icon="delete" iconColor={theme.colors.error} onPress={() => handleDelete(faculty)} />
                            </Card.Actions>
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

            {/* Add/Edit Faculty Dialog */}
            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
                    <Dialog.Title>{editingFaculty ? 'Edit Faculty' : 'Add Faculty'}</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView>
                            <View style={styles.dialogContent}>
                                <TextInput
                                    label="Name"
                                    value={name}
                                    onChangeText={setName}
                                    mode="outlined"
                                    style={styles.input}
                                />
                                <TextInput
                                    label="Employee ID"
                                    value={employeeId}
                                    onChangeText={setEmployeeId}
                                    mode="outlined"
                                    style={styles.input}
                                />

                                <Text variant="labelMedium" style={styles.label}>Designation</Text>
                                {DESIGNATIONS.map(d => (
                                    <Chip
                                        key={d}
                                        selected={designation === d}
                                        onPress={() => setDesignation(d)}
                                        style={styles.designationChip}
                                    >
                                        {DESIGNATION_LABELS[d]} ({getWorkloadLimits(d)})
                                    </Chip>
                                ))}
                            </View>
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
                        <Button onPress={handleSave} mode="contained">
                            {editingFaculty ? 'Update' : 'Add'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Assignment Dialog */}
            <Portal>
                <Dialog visible={assignDialogVisible} onDismiss={() => setAssignDialogVisible(false)}>
                    <Dialog.Title>Assign Subjects to {currentSelectedFaculty?.name}</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView>
                            <List.Section>
                                <List.Subheader>Theory Subjects</List.Subheader>
                                {deptSubjects.filter(s => s.type !== 'LAB').map(subject => (
                                    <List.Item
                                        key={subject.id}
                                        title={subject.name}
                                        description={subject.code}
                                        left={() => (
                                            <Checkbox
                                                status={currentSelectedFaculty?.assignedTheorySubjects.includes(subject.id) ? 'checked' : 'unchecked'}
                                                onPress={() => toggleTheoryAssignment(subject.id)}
                                            />
                                        )}
                                        onPress={() => toggleTheoryAssignment(subject.id)}
                                    />
                                ))}

                                <List.Subheader>Lab Subjects</List.Subheader>
                                {deptSubjects.filter(s => s.type === 'LAB').map(subject => (
                                    <List.Item
                                        key={subject.id}
                                        title={subject.name}
                                        description={subject.code}
                                        left={() => (
                                            <Checkbox
                                                status={currentSelectedFaculty?.assignedLabSubjects.includes(subject.id) ? 'checked' : 'unchecked'}
                                                onPress={() => toggleLabAssignment(subject.id)}
                                            />
                                        )}
                                        onPress={() => toggleLabAssignment(subject.id)}
                                    />
                                ))}
                            </List.Section>
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setAssignDialogVisible(false)} mode="contained">Done</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    deptSelector: { padding: 16, paddingBottom: 8 },
    chip: { marginRight: 8 },
    scrollContent: { padding: 16, paddingTop: 0, paddingBottom: 80 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    card: { marginBottom: 12 },
    fab: { position: 'absolute', right: 16, bottom: 16 },
    dialogContent: { padding: 16 },
    input: { marginBottom: 12 },
    label: { marginBottom: 8 },
    designationChip: { marginBottom: 8 },
});
