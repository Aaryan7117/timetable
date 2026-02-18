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
    SegmentedButtons,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { addSubject, updateSubject, deleteSubject } from '../../../store/slices/academicSlice';
import { Subject, SubjectType } from '../../../types';
import { SUBJECT_TYPE_LABELS, SUBJECT_TYPE_COLORS } from '../../../constants';

const SUBJECT_TYPES: SubjectType[] = ['THEORY', 'LAB', 'MANDATORY', 'OPEN_ELECTIVE', 'LIBRARY'];

export default function SubjectsScreen() {
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const departments = useAppSelector(state => state.infrastructure.departments);
    const subjects = useAppSelector(state => state.academic.subjects);

    const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || '');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [type, setType] = useState<SubjectType>('THEORY');
    const [semester, setSemester] = useState('');
    const [periodsPerWeek, setPeriodsPerWeek] = useState('');

    const filteredSubjects = subjects.filter(s => s.departmentId === selectedDeptId);

    const openAddDialog = () => {
        if (!selectedDeptId) {
            Alert.alert('Error', 'Please select a department first');
            return;
        }
        setEditingSubject(null);
        setName('');
        setCode('');
        setType('THEORY');
        setSemester('');
        setPeriodsPerWeek('5');
        setDialogVisible(true);
    };

    const openEditDialog = (subject: Subject) => {
        setEditingSubject(subject);
        setName(subject.name);
        setCode(subject.code);
        setType(subject.type);
        setSemester(subject.semester.toString());
        setPeriodsPerWeek(subject.periodsPerWeek.toString());
        setDialogVisible(true);
    };

    const handleSave = () => {
        if (!name.trim() || !code.trim()) {
            Alert.alert('Error', 'Name and code are required');
            return;
        }

        const semesterNum = parseInt(semester, 10);
        if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
            Alert.alert('Error', 'Semester must be between 1 and 8');
            return;
        }

        const periods = parseInt(periodsPerWeek, 10);
        if (isNaN(periods) || periods < 1) {
            Alert.alert('Error', 'Valid periods per week is required');
            return;
        }

        if (editingSubject) {
            dispatch(updateSubject({
                ...editingSubject,
                name: name.trim(),
                code: code.trim(),
                type,
                semester: semesterNum,
                periodsPerWeek: periods,
            }));
        } else {
            dispatch(addSubject({
                name: name.trim(),
                code: code.trim(),
                type,
                semester: semesterNum,
                periodsPerWeek: periods,
                departmentId: selectedDeptId,
            }));
        }

        setDialogVisible(false);
    };

    const handleDelete = (subject: Subject) => {
        Alert.alert(
            'Delete Subject',
            `Are you sure you want to delete "${subject.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteSubject(subject.id)) },
            ]
        );
    };

    const getConstraintInfo = (subjectType: SubjectType): string => {
        switch (subjectType) {
            case 'MANDATORY': return 'Period 3, Mon/Tue only';
            case 'OPEN_ELECTIVE': return 'Period 1, Mon-Wed only';
            case 'LIBRARY': return 'Max 1/week, auto-filled';
            case 'LAB': return '3 consecutive periods';
            default: return '';
        }
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
                {filteredSubjects.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            No subjects in this department
                        </Text>
                    </View>
                ) : (
                    filteredSubjects.map(subject => (
                        <Card key={subject.id} style={styles.card} mode="elevated">
                            <Card.Title
                                title={`${subject.code} - ${subject.name}`}
                                subtitle={`Sem ${subject.semester} | ${subject.periodsPerWeek} periods/week`}
                                left={() => (
                                    <View style={[styles.typeIndicator, { backgroundColor: SUBJECT_TYPE_COLORS[subject.type] }]} />
                                )}
                            />
                            <Card.Content>
                                <View style={styles.tagRow}>
                                    <Chip compact style={[styles.typeChip, { backgroundColor: SUBJECT_TYPE_COLORS[subject.type] + '30' }]}>
                                        {SUBJECT_TYPE_LABELS[subject.type]}
                                    </Chip>
                                    {getConstraintInfo(subject.type) && (
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                            {getConstraintInfo(subject.type)}
                                        </Text>
                                    )}
                                </View>
                            </Card.Content>
                            <Card.Actions>
                                <IconButton icon="pencil" onPress={() => openEditDialog(subject)} />
                                <IconButton icon="delete" iconColor={theme.colors.error} onPress={() => handleDelete(subject)} />
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

            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
                    <Dialog.Title>{editingSubject ? 'Edit Subject' : 'Add Subject'}</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView>
                            <View style={styles.dialogContent}>
                                <TextInput
                                    label="Subject Name"
                                    value={name}
                                    onChangeText={setName}
                                    mode="outlined"
                                    style={styles.input}
                                />
                                <TextInput
                                    label="Subject Code"
                                    value={code}
                                    onChangeText={setCode}
                                    mode="outlined"
                                    placeholder="e.g., CS301"
                                    style={styles.input}
                                />

                                <Text variant="labelMedium" style={styles.label}>Subject Type</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                                    {SUBJECT_TYPES.map(t => (
                                        <Chip
                                            key={t}
                                            selected={type === t}
                                            onPress={() => setType(t)}
                                            style={styles.typeChipSelector}
                                        >
                                            {SUBJECT_TYPE_LABELS[t]}
                                        </Chip>
                                    ))}
                                </ScrollView>

                                {getConstraintInfo(type) && (
                                    <Text variant="bodySmall" style={[styles.constraintInfo, { color: theme.colors.primary }]}>
                                        ⚠️ {getConstraintInfo(type)}
                                    </Text>
                                )}

                                <TextInput
                                    label="Semester (1-8)"
                                    value={semester}
                                    onChangeText={setSemester}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={styles.input}
                                />
                                <TextInput
                                    label="Periods per Week"
                                    value={periodsPerWeek}
                                    onChangeText={setPeriodsPerWeek}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={styles.input}
                                />
                            </View>
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
                        <Button onPress={handleSave} mode="contained">
                            {editingSubject ? 'Update' : 'Add'}
                        </Button>
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
    typeIndicator: { width: 4, height: 40, borderRadius: 2 },
    tagRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    typeChip: { marginRight: 8 },
    fab: { position: 'absolute', right: 16, bottom: 16 },
    dialogContent: { padding: 16 },
    input: { marginBottom: 12 },
    label: { marginBottom: 8 },
    typeSelector: { marginBottom: 12 },
    typeChipSelector: { marginRight: 8 },
    constraintInfo: { marginBottom: 12 },
});
