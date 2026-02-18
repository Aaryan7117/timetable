import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
    Text,
    Button,
    Card,
    useTheme,
    List,
    Chip,
    Surface,
    ActivityIndicator,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { validateAll } from '../../../engine/validator';
import { generateTimetable } from '../../../engine/scheduler';
import { completeGeneration, startGeneration } from '../../../store/slices/timetableSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Explanation } from '../../../types';

export default function GenerateScreen() {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const infrastructure = useAppSelector(state => state.infrastructure);
    const academic = useAppSelector(state => state.academic);
    const { isGenerating, result } = useAppSelector(state => state.timetable.currentGeneration);
    const labRotations = useAppSelector(state => state.timetable.labRotations);

    const [selectedBatchId, setSelectedBatchId] = useState<string>(academic.batches[0]?.id || '');

    // Run validation
    const validation = useMemo(() => {
        return validateAll(infrastructure, academic);
    }, [infrastructure, academic]);

    const errors = validation.explanations.filter(e => e.level === 'ERROR');
    const warnings = validation.explanations.filter(e => e.level === 'WARNING');

    const canGenerate = validation.isValid && academic.batches.length > 0;

    const handleGenerate = async () => {
        if (!canGenerate || !selectedBatchId) return;

        dispatch(startGeneration());

        const genResult = generateTimetable(infrastructure, academic, selectedBatchId, labRotations);

        dispatch(completeGeneration(genResult));
    };

    const getStepIcon = (step?: number) => {
        const icons: Record<number, string> = {
            1: 'checkbox-marked-circle',
            2: 'lock',
            3: 'flask',
            4: 'book-open-variant',
            5: 'book-multiple',
            6: 'bookshelf',
            7: 'library',
            8: 'account-hard-hat',
            9: 'check-all',
            10: 'publish',
        };
        return icons[step || 0] || 'information';
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Validation Status */}
            <Card style={styles.card}>
                <Card.Title
                    title="Validation Status"
                    left={() => (
                        <MaterialCommunityIcons
                            name={validation.isValid ? 'check-circle' : 'alert-circle'}
                            size={28}
                            color={validation.isValid ? theme.colors.primary : theme.colors.error}
                        />
                    )}
                />
                <Card.Content>
                    {errors.length === 0 && warnings.length === 0 ? (
                        <Text style={{ color: theme.colors.primary }}>✓ All validations passed</Text>
                    ) : (
                        <>
                            {errors.map((err, idx) => (
                                <Surface key={idx} style={[styles.errorItem, { backgroundColor: theme.colors.errorContainer }]}>
                                    <MaterialCommunityIcons name="alert-circle" size={16} color={theme.colors.error} />
                                    <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>{err.message}</Text>
                                </Surface>
                            ))}
                            {warnings.map((warn, idx) => (
                                <Surface key={idx} style={[styles.warningItem, { backgroundColor: theme.colors.tertiaryContainer }]}>
                                    <MaterialCommunityIcons name="alert" size={16} color={theme.colors.tertiary} />
                                    <Text style={[styles.errorText, { color: theme.colors.onTertiaryContainer }]}>{warn.message}</Text>
                                </Surface>
                            ))}
                        </>
                    )}
                </Card.Content>
            </Card>

            {/* Quick Stats */}
            <Card style={styles.card}>
                <Card.Title title="Configuration Summary" />
                <Card.Content>
                    <View style={styles.statsGrid}>
                        <Chip icon="office-building">{infrastructure.blocks.length} Blocks</Chip>
                        <Chip icon="domain">{infrastructure.departments.length} Depts</Chip>
                        <Chip icon="door">{infrastructure.classrooms.length} Rooms</Chip>
                        <Chip icon="flask">{infrastructure.labs.length} Labs</Chip>
                        <Chip icon="account-group">{academic.batches.length} Batches</Chip>
                        <Chip icon="book">{academic.subjects.length} Subjects</Chip>
                        <Chip icon="account">{academic.faculty.length} Faculty</Chip>
                    </View>
                </Card.Content>
            </Card>

            {/* Batch Selector */}
            {academic.batches.length > 0 && (
                <Card style={styles.card}>
                    <Card.Title title="Select Batch to Generate" />
                    <Card.Content>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.batchChips}>
                                {academic.batches.map(batch => (
                                    <Chip
                                        key={batch.id}
                                        selected={selectedBatchId === batch.id}
                                        onPress={() => setSelectedBatchId(batch.id)}
                                        style={styles.batchChip}
                                        mode="outlined"
                                    >
                                        {batch.name}
                                    </Chip>
                                ))}
                            </View>
                        </ScrollView>
                    </Card.Content>
                </Card>
            )}

            {/* Generate Button */}
            <Card style={styles.card}>
                <Card.Content>
                    <Button
                        mode="contained"
                        onPress={handleGenerate}
                        disabled={!canGenerate || isGenerating}
                        icon={isGenerating ? undefined : 'calendar-plus'}
                        contentStyle={styles.generateButton}
                    >
                        {isGenerating ? (
                            <ActivityIndicator color={theme.colors.onPrimary} />
                        ) : (
                            'Generate Timetable'
                        )}
                    </Button>
                    {!canGenerate && (
                        <Text variant="bodySmall" style={[styles.disabledHint, { color: theme.colors.error }]}>
                            Fix validation errors above before generating
                        </Text>
                    )}
                </Card.Content>
            </Card>

            {/* Generation Result */}
            {result && (
                <Card style={styles.card}>
                    <Card.Title
                        title={result.success ? 'Generation Successful' : 'Generation Failed'}
                        left={() => (
                            <MaterialCommunityIcons
                                name={result.success ? 'check-circle' : 'close-circle'}
                                size={28}
                                color={result.success ? theme.colors.primary : theme.colors.error}
                            />
                        )}
                    />
                    <Card.Content>
                        <List.Section>
                            {result.explanations.slice(-10).map((exp, idx) => (
                                <List.Item
                                    key={idx}
                                    title={exp.message}
                                    titleNumberOfLines={3}
                                    left={() => (
                                        <MaterialCommunityIcons
                                            name={getStepIcon(exp.step)}
                                            size={20}
                                            color={
                                                exp.level === 'ERROR' ? theme.colors.error :
                                                    exp.level === 'WARNING' ? theme.colors.tertiary :
                                                        theme.colors.primary
                                            }
                                        />
                                    )}
                                    description={exp.step ? `Step ${exp.step}: ${exp.source}` : exp.source}
                                />
                            ))}
                        </List.Section>

                        {result.success && result.timetable && (
                            <Surface style={[styles.successBanner, { backgroundColor: theme.colors.primaryContainer }]}>
                                <MaterialCommunityIcons name="check-all" size={24} color={theme.colors.primary} />
                                <Text style={{ color: theme.colors.onPrimaryContainer, marginLeft: 12 }}>
                                    Timetable created with {result.timetable.entries.length} entries
                                </Text>
                            </Surface>
                        )}
                    </Card.Content>
                </Card>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { margin: 16, marginBottom: 0 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    errorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8
    },
    warningItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8
    },
    errorText: { marginLeft: 8, flex: 1 },
    generateButton: { paddingVertical: 8 },
    disabledHint: { marginTop: 8, textAlign: 'center' },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginTop: 12
    },
    batchChips: { flexDirection: 'row', gap: 8 },
    batchChip: { marginRight: 4 },
});
