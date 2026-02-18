import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import {
    Text,
    Surface,
    useTheme,
    Chip,
} from 'react-native-paper';
import { useAppSelector } from '../../../store/hooks';
import { DAY_SHORT_NAMES, Period, Day } from '../../../types';
import { PERIOD_SCHEDULE, formatPeriodTime } from '../../../constants';
import { SUBJECT_TYPE_COLORS } from '../../../constants/constraints';

const MIN_CELL_WIDTH = 80;
const MAX_CELL_WIDTH = 160;
const CELL_HEIGHT = 60;

export default function TimetableViewScreen() {
    const theme = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const CELL_WIDTH = Math.min(MAX_CELL_WIDTH, Math.max(MIN_CELL_WIDTH, (windowWidth - 80) / 6));
    const batches = useAppSelector(state => state.academic.batches);
    const subjects = useAppSelector(state => state.academic.subjects);
    const faculty = useAppSelector(state => state.academic.faculty);
    const classrooms = useAppSelector(state => state.infrastructure.classrooms);
    const labs = useAppSelector(state => state.infrastructure.labs);
    const timetables = useAppSelector(state => state.timetable.timetables);

    const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');

    const currentTimetable = useMemo(() => {
        return timetables.find(t => t.batchId === selectedBatchId);
    }, [timetables, selectedBatchId]);

    const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.code || '?';
    const getSubjectType = (id: string) => subjects.find(s => s.id === id)?.type || 'THEORY';
    const getFacultyName = (id: string) => {
        const f = faculty.find(f => f.id === id);
        return f?.name.split(' ')[0] || '';
    };
    const getRoomName = (id: string) => {
        const room = classrooms.find(c => c.id === id) || labs.find(l => l.id === id);
        return room?.name || '';
    };

    const getEntryForSlot = (day: Day, period: Period) => {
        if (!currentTimetable) return null;
        return currentTimetable.entries.find(e => e.day === day && e.period === period);
    };

    if (batches.length === 0) {
        return (
            <View style={[styles.container, styles.emptyState, { backgroundColor: theme.colors.background }]}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    No batches available
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Batch Selector */}
            <View style={styles.batchSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {batches.map(batch => (
                        <Chip
                            key={batch.id}
                            selected={selectedBatchId === batch.id}
                            onPress={() => setSelectedBatchId(batch.id)}
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
                        No timetable generated for this batch
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                        Go to Generate tab to create one
                    </Text>
                </View>
            ) : (
                <ScrollView>
                    <ScrollView horizontal>
                        <View>
                            {/* Header Row */}
                            <View style={styles.row}>
                                <Surface style={[styles.headerCell, { width: 60 }]}>
                                    <Text variant="labelSmall">Period</Text>
                                </Surface>
                                {DAY_SHORT_NAMES.map((day, idx) => (
                                    <Surface key={idx} style={[styles.headerCell, { width: CELL_WIDTH }]}>
                                        <Text variant="labelMedium">{day}</Text>
                                    </Surface>
                                ))}
                            </View>

                            {/* Period Rows */}
                            {PERIOD_SCHEDULE.filter(p => p.period <= 7).map(periodInfo => (
                                <View key={periodInfo.period} style={styles.row}>
                                    {/* Period Label */}
                                    <Surface style={[styles.periodCell, { width: 60 }]}>
                                        <Text variant="labelMedium">P{periodInfo.period}</Text>
                                        <Text variant="labelSmall" style={{ fontSize: 9 }}>
                                            {periodInfo.startTime}
                                        </Text>
                                    </Surface>

                                    {/* Day Cells */}
                                    {[0, 1, 2, 3, 4, 5].map(day => {
                                        const entry = getEntryForSlot(day as Day, periodInfo.period as Period);

                                        if (!entry) {
                                            return (
                                                <Surface key={day} style={[styles.emptyCell, { width: CELL_WIDTH }]}>
                                                    <Text variant="labelSmall" style={{ color: theme.colors.outline }}>-</Text>
                                                </Surface>
                                            );
                                        }

                                        const subjectType = getSubjectType(entry.subjectId);
                                        const bgColor = SUBJECT_TYPE_COLORS[subjectType] + '30';
                                        const textColor = SUBJECT_TYPE_COLORS[subjectType];

                                        return (
                                            <Surface
                                                key={day}
                                                style={[
                                                    styles.entryCell,
                                                    {
                                                        width: CELL_WIDTH,
                                                        backgroundColor: bgColor,
                                                        borderLeftColor: textColor,
                                                    }
                                                ]}
                                            >
                                                <Text
                                                    variant="labelMedium"
                                                    style={{ color: textColor, fontWeight: 'bold' }}
                                                    numberOfLines={1}
                                                >
                                                    {getSubjectName(entry.subjectId)}
                                                </Text>
                                                {entry.isLabSession && (
                                                    <Chip
                                                        compact
                                                        style={[styles.labChip, { backgroundColor: textColor }]}
                                                        textStyle={{ color: '#fff', fontSize: 8 }}
                                                    >
                                                        LAB {entry.labSlot}
                                                    </Chip>
                                                )}
                                                <Text
                                                    variant="labelSmall"
                                                    style={{ color: theme.colors.onSurfaceVariant, fontSize: 9 }}
                                                    numberOfLines={1}
                                                >
                                                    {getFacultyName(entry.facultyId)}
                                                </Text>
                                            </Surface>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Legend */}
                    <View style={styles.legend}>
                        <Text variant="labelMedium" style={{ marginBottom: 8 }}>Legend:</Text>
                        <View style={styles.legendItems}>
                            {Object.entries(SUBJECT_TYPE_COLORS).map(([type, color]) => (
                                <View key={type} style={styles.legendItem}>
                                    <View style={[styles.legendColor, { backgroundColor: color }]} />
                                    <Text variant="labelSmall">{type}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
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
    row: { flexDirection: 'row' },
    headerCell: {
        height: 40,
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
        borderLeftWidth: 3,
        padding: 2,
    },
    labChip: {
        marginTop: 2,
        height: 16,
    },
    legend: { padding: 16 },
    legendItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendColor: { width: 12, height: 12, borderRadius: 2 },
});
