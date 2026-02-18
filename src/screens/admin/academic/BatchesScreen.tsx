import React, { useState, useMemo } from 'react';
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
    Surface,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { addBatch, updateBatch, deleteBatch } from '../../../store/slices/academicSlice';
import { Batch } from '../../../types';

export default function BatchesScreen() {
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const departments = useAppSelector(state => state.infrastructure.departments);
    const labs = useAppSelector(state => state.infrastructure.labs);
    const batches = useAppSelector(state => state.academic.batches);

    const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || '');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
    const [batchName, setBatchName] = useState('');
    const [semester, setSemester] = useState('');
    const [section, setSection] = useState('');
    const [totalStudents, setTotalStudents] = useState('');

    // Get lab capacity for the selected department
    const labCapacity = useMemo(() => {
        const deptLabs = labs.filter(l => l.departmentId === selectedDeptId);
        return deptLabs.length > 0 ? Math.max(...deptLabs.map(l => l.capacity)) : 30;
    }, [labs, selectedDeptId]);

    // Preview sub-batch splitting
    const previewSplit = useMemo(() => {
        const students = parseInt(totalStudents, 10);
        if (isNaN(students) || students <= 0) return null;

        if (students <= labCapacity) {
            return { count: 1, batches: ['A'] };
        }

        const numBatches = Math.ceil(students / labCapacity);
        const batchNames = [];
        for (let i = 0; i < numBatches; i++) {
            batchNames.push(`A${i + 1}`);
        }
        return { count: numBatches, batches: batchNames };
    }, [totalStudents, labCapacity]);

    const filteredBatches = batches.filter(b => b.departmentId === selectedDeptId);

    const openAddDialog = () => {
        if (!selectedDeptId) {
            Alert.alert('Error', 'Please select a department first');
            return;
        }
        setEditingBatch(null);
        setBatchName('');
        setSemester('');
        setSection('A');
        setTotalStudents('');
        setDialogVisible(true);
    };

    const openEditDialog = (batch: Batch) => {
        setEditingBatch(batch);
        setBatchName(batch.name);
        setSemester(batch.semester.toString());
        setSection(batch.section);
        setTotalStudents(batch.totalStudents.toString());
        setDialogVisible(true);
    };

    const handleSave = () => {
        if (!batchName.trim()) {
            Alert.alert('Error', 'Batch name is required');
            return;
        }

        const semesterNum = parseInt(semester, 10);
        if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
            Alert.alert('Error', 'Semester must be between 1 and 8');
            return;
        }

        const studentsNum = parseInt(totalStudents, 10);
        if (isNaN(studentsNum) || studentsNum <= 0) {
            Alert.alert('Error', 'Valid student count is required');
            return;
        }

        if (editingBatch) {
            dispatch(updateBatch({
                batch: {
                    ...editingBatch,
                    name: batchName.trim(),
                    semester: semesterNum,
                    section: section.trim() || 'A',
                    totalStudents: studentsNum,
                },
                labCapacity,
            }));
        } else {
            dispatch(addBatch({
                batch: {
                    name: batchName.trim(),
                    semester: semesterNum,
                    section: section.trim() || 'A',
                    departmentId: selectedDeptId,
                    totalStudents: studentsNum,
                },
                labCapacity,
            }));
        }

        setDialogVisible(false);
    };

    const handleDelete = (batch: Batch) => {
        Alert.alert(
            'Delete Batch',
            `Are you sure you want to delete "${batch.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteBatch(batch.id)) },
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
                    Please add infrastructure first
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

            {/* Quick Navigation to Subjects and Faculty */}
            <View style={styles.navButtons}>
                <Button
                    mode="contained-tonal"
                    icon="book"
                    onPress={() => navigation.navigate('Subjects')}
                    style={styles.navButton}
                >
                    Subjects
                </Button>
                <Button
                    mode="contained-tonal"
                    icon="account-tie"
                    onPress={() => navigation.navigate('Faculty')}
                    style={styles.navButton}
                >
                    Faculty
                </Button>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {filteredBatches.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            No batches in this department
                        </Text>
                    </View>
                ) : (
                    filteredBatches.map(batch => (
                        <Card key={batch.id} style={styles.card} mode="elevated">
                            <Card.Title
                                title={batch.name}
                                subtitle={`Semester ${batch.semester} | ${batch.totalStudents} students`}
                            />
                            <Card.Content>
                                {batch.subBatches.length > 1 && (
                                    <View style={styles.subBatchPreview}>
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                            Lab Sub-batches:
                                        </Text>
                                        <View style={styles.subBatchChips}>
                                            {batch.subBatches.map(sb => (
                                                <Chip key={sb.id} compact style={styles.subBatchChip}>
                                                    {sb.name}: {sb.studentCount}
                                                </Chip>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </Card.Content>
                            <Card.Actions>
                                <IconButton icon="pencil" onPress={() => openEditDialog(batch)} />
                                <IconButton icon="delete" iconColor={theme.colors.error} onPress={() => handleDelete(batch)} />
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
                    <Dialog.Title>{editingBatch ? 'Edit Batch' : 'Add Batch'}</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView>
                            <View style={styles.dialogContent}>
                                <TextInput
                                    label="Batch Name"
                                    value={batchName}
                                    onChangeText={setBatchName}
                                    mode="outlined"
                                    placeholder="e.g., CSE-3A"
                                    style={styles.input}
                                />
                                <TextInput
                                    label="Semester (1-8)"
                                    value={semester}
                                    onChangeText={setSemester}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={styles.input}
                                />
                                <TextInput
                                    label="Section"
                                    value={section}
                                    onChangeText={setSection}
                                    mode="outlined"
                                    placeholder="A"
                                    style={styles.input}
                                />
                                <TextInput
                                    label="Total Students"
                                    value={totalStudents}
                                    onChangeText={setTotalStudents}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={styles.input}
                                />

                                {previewSplit && (
                                    <Surface style={[styles.splitPreview, { backgroundColor: theme.colors.secondaryContainer }]}>
                                        <Text variant="labelMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                                            Lab Capacity: {labCapacity} | Sub-batches: {previewSplit.count}
                                        </Text>
                                        <View style={styles.subBatchChips}>
                                            {previewSplit.batches.map(name => (
                                                <Chip key={name} compact>{name}</Chip>
                                            ))}
                                        </View>
                                        {previewSplit.count > 1 && (
                                            <HelperText type="info">
                                                Batch will be split for lab sessions. This is automatic and cannot be overridden.
                                            </HelperText>
                                        )}
                                    </Surface>
                                )}
                            </View>
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
                        <Button onPress={handleSave} mode="contained">
                            {editingBatch ? 'Update' : 'Add'}
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
    navButtons: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
    navButton: { flex: 1 },
    scrollContent: { padding: 16, paddingTop: 0, paddingBottom: 80 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    card: { marginBottom: 12 },
    subBatchPreview: { marginTop: 8 },
    subBatchChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    subBatchChip: { marginRight: 4 },
    fab: { position: 'absolute', right: 16, bottom: 16 },
    dialogContent: { padding: 16 },
    input: { marginBottom: 12 },
    splitPreview: { padding: 12, borderRadius: 8, marginTop: 8 },
});
