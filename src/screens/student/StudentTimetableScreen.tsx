import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import {
    Text,
    Surface,
    useTheme,
    Chip,
    Card,
} from 'react-native-paper';
import { useAppSelector } from '../../store/hooks';
import { DAY_SHORT_NAMES, Period, Day } from '../../types';
import { PERIOD_SCHEDULE } from '../../constants';
import { SUBJECT_TYPE_COLORS } from '../../constants/constraints';

const MIN_CELL_WIDTH = 80;
const MAX_CELL_WIDTH = 160;
const CELL_HEIGHT = 70;

export default function StudentTimetableScreen() {
    const theme = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const CELL_WIDTH = Math.min(MAX_CELL_WIDTH, Math.max(MIN_CELL_WIDTH, (windowWidth - 80) / 6));
    const batches = useAppSelector(state => state.academic.batches);
    const subjects = useAppSelector(state => state.academic.subjects);
    const faculty = useAppSelector(state => state.academic.faculty);
    const classrooms = useAppSelector(state => state.infrastructure.classrooms);
    const labs = useAppSelector(state => state.infrastructure.labs);
    const timetables = useAppSelector(state => state.timetable.timetables);
    const selectedBatchId = useAppSelector(state => state.app.selectedBatchId);

    const [localSelectedBatchId, setLocalSelectedBatchId] = useState<string>(
        selectedBatchId || batches[0]?.id || ''
    );

    const currentBatch = batches.find(b => b.id === localSelectedBatchId);
    const currentTimetable = useMemo(() => {
        return timetables.find(t => t.batchId === localSelectedBatchId);
    }, [timetables, localSelectedBatchId]);

    const getSubjectName = (id: string) => {
        const subject = subjects.find(s => s.id === id);
        return subject?.name || 'Unknown';
    };
    const getSubjectCode = (id: string) => subjects.find(s => s.id === id)?.code || '?';
    const getSubjectType = (id: string) => subjects.find(s => s.id === id)?.type || 'THEORY';
    const getFacultyName = (id: string) => faculty.find(f => f.id === id)?.name || '';
    const getRoomName = (id: string) => {
        const room = classrooms.find(c => c.id === id) || labs.find(l => l.id === id);
        return room?.name || '';
    };

    const getEntryForSlot = (day: Day, period: Period) => {
        if (!currentTimetable) return null;
        return currentTimetable.entries.find(e => e.day === day && e.period === period);
    };

    // Get today's schedule
    const todayIndex = new Date().getDay() - 1; // 0 = Monday
    const todaySchedule = useMemo(() => {
        if (!currentTimetable || todayIndex < 0 || todayIndex > 5) return [];
        return currentTimetable.entries
            .filter(e => e.day === todayIndex)
            .sort((a, b) => a.period - b.period);
    }, [currentTimetable, todayIndex]);

    if (batches.length === 0) {
        return (
            <View style={[styles.container, styles.emptyState, { backgroundColor: theme.colors.background }]}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    No batches available
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                    Please contact your administrator
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Batch Selector */}
            <View style={styles.batchSelector}>
                <Text variant="labelMedium" style={{ marginBottom: 8 }}>Select Your Batch:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {batches.map(batch => (
                        <Chip
                            key={batch.id}
                            selected={localSelectedBatchId === batch.id}
                            onPress={() => setLocalSelectedBatchId(batch.id)}
                            style={styles.chip}
                            mode="outlined"
                        >
                            {batch.name}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            {!currentTimetable ? (
                <View style={styles.emptyState}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Timetable not available
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                        Please check back later
                    </Text>
                </View>
            ) : (
                <ScrollView>
                    {/* Today's Schedule Card */}
                    {todaySchedule.length > 0 && (
                        <Card style={styles.todayCard}>
                            <Card.Title title={`Today's Schedule - ${DAY_SHORT_NAMES[todayIndex]}`} />
                            <Card.Content>
                                {todaySchedule.map((entry, idx) => {
                                    const periodInfo = PERIOD_SCHEDULE.find(p => p.period === entry.period);
                                    const subjectType = getSubjectType(entry.subjectId);

                                    return (
                                        <Surface
                                            key={idx}
                                            style={[
                                                styles.todayItem,
                                                {
                                                    borderLeftColor: SUBJECT_TYPE_COLORS[subjectType],
                                                    backgroundColor: SUBJECT_TYPE_COLORS[subjectType] + '15',
                                                }
                                            ]}
                                        >
                                            <View style={styles.todayTime}>
                                                <Text variant="labelMedium">{periodInfo?.startTime}</Text>
                                                <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                                                    P{entry.period}
                                                </Text>
                                            </View>
                                            <View style={styles.todayDetails}>
                                                <Text variant="titleSmall">{getSubjectName(entry.subjectId)}</Text>
                                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                    {getFacultyName(entry.facultyId)} • {getRoomName(entry.roomId)}
                                                </Text>
                                                {entry.isLabSession && (
                                                    <Chip compact style={styles.labBadge}>LAB</Chip>
                                                )}
                                            </View>
                                        </Surface>
                                    );
                                })}
                            </Card.Content>
                        </Card>
                    )}

                    {/* Full Week Grid */}
                    <Card style={styles.weekCard}>
                        <Card.Title title="Weekly Timetable" />
                        <Card.Content>
                            <ScrollView horizontal>
                                <View>
                                    {/* Header Row */}
                                    <View style={styles.row}>
                                        <Surface style={[styles.headerCell, { width: 50 }]}>
                                            <Text variant="labelSmall">Time</Text>
                                        </Surface>
                                        {DAY_SHORT_NAMES.map((day, idx) => (
                                            <Surface
                                                key={idx}
                                                style={[
                                                    styles.headerCell,
                                                    {
                                                        width: CELL_WIDTH,
                                                        backgroundColor: idx === todayIndex ? theme.colors.primaryContainer : undefined,
                                                    }
                                                ]}
                                            >
                                                <Text variant="labelMedium">{day}</Text>
                                            </Surface>
                                        ))}
                                    </View>

                                    {/* Period Rows */}
                                    {PERIOD_SCHEDULE.filter(p => p.period <= 7).map(periodInfo => (
                                        <View key={periodInfo.period} style={styles.row}>
                                            <Surface style={[styles.periodCell, { width: 50 }]}>
                                                <Text variant="labelSmall">{periodInfo.startTime}</Text>
                                            </Surface>

                                            {[0, 1, 2, 3, 4, 5].map(day => {
                                                const entry = getEntryForSlot(day as Day, periodInfo.period as Period);

                                                if (!entry) {
                                                    return (
                                                        <Surface key={day} style={[styles.emptyCell, { width: CELL_WIDTH }]}>
                                                            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>—</Text>
                                                        </Surface>
                                                    );
                                                }

                                                const subjectType = getSubjectType(entry.subjectId);
                                                const bgColor = SUBJECT_TYPE_COLORS[subjectType] + '25';

                                                return (
                                                    <Surface
                                                        key={day}
                                                        style={[styles.entryCell, { width: CELL_WIDTH, backgroundColor: bgColor }]}
                                                    >
                                                        <Text variant="labelSmall" numberOfLines={1} style={{ fontWeight: 'bold' }}>
                                                            {getSubjectCode(entry.subjectId)}
                                                        </Text>
                                                        {entry.isLabSession && (
                                                            <Text variant="labelSmall" style={{ color: SUBJECT_TYPE_COLORS.LAB, fontSize: 9 }}>
                                                                🔬 LAB
                                                            </Text>
                                                        )}
                                                    </Surface>
                                                );
                                            })}
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        </Card.Content>
                    </Card>

                    {/* Batch Info */}
                    {currentBatch && (
                        <Card style={styles.infoCard}>
                            <Card.Content>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    {currentBatch.name} • Semester {currentBatch.semester} • {currentBatch.totalStudents} students
                                </Text>
                            </Card.Content>
                        </Card>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    batchSelector: { padding: 16 },
    chip: { marginRight: 8 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    todayCard: { margin: 16, marginBottom: 8 },
    todayItem: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        marginBottom: 8,
    },
    todayTime: { width: 50, alignItems: 'center' },
    todayDetails: { flex: 1, marginLeft: 12 },
    labBadge: { alignSelf: 'flex-start', marginTop: 4 },
    weekCard: { margin: 16, marginTop: 8 },
    row: { flexDirection: 'row' },
    headerCell: {
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#ddd',
    },
    periodCell: {
        height: CELL_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#ddd',
    },
    emptyCell: {
        height: CELL_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#ddd',
    },
    entryCell: {
        height: CELL_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#ddd',
        padding: 4,
    },
    infoCard: { margin: 16, marginTop: 8 },
});
