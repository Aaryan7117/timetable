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
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
    addBlock,
    updateBlock,
    deleteBlock
} from '../../../store/slices/infrastructureSlice';
import { Block } from '../../../types';

export default function BlocksScreen() {
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const blocks = useAppSelector(state => state.infrastructure.blocks);
    const departments = useAppSelector(state => state.infrastructure.departments);

    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingBlock, setEditingBlock] = useState<Block | null>(null);
    const [blockName, setBlockName] = useState('');

    const openAddDialog = () => {
        setEditingBlock(null);
        setBlockName('');
        setDialogVisible(true);
    };

    const openEditDialog = (block: Block) => {
        setEditingBlock(block);
        setBlockName(block.name);
        setDialogVisible(true);
    };

    const handleSave = () => {
        if (!blockName.trim()) {
            Alert.alert('Error', 'Block name is required');
            return;
        }

        if (editingBlock) {
            dispatch(updateBlock({ ...editingBlock, name: blockName.trim() }));
        } else {
            dispatch(addBlock({ name: blockName.trim() }));
        }

        setDialogVisible(false);
        setBlockName('');
        setEditingBlock(null);
    };

    const handleDelete = (block: Block) => {
        const deptCount = departments.filter(d => d.blockId === block.id).length;
        const message = deptCount > 0
            ? `This will also delete ${deptCount} department(s) and all associated classrooms and labs.`
            : 'Are you sure you want to delete this block?';

        Alert.alert(
            'Delete Block',
            message,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteBlock(block.id)) },
            ]
        );
    };

    const getDepartmentCount = (blockId: string) => {
        return departments.filter(d => d.blockId === blockId).length;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {blocks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            No blocks defined yet
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                            Add your first block to get started
                        </Text>
                    </View>
                ) : (
                    blocks.map(block => (
                        <Card key={block.id} style={styles.card} mode="elevated">
                            <Card.Title
                                title={block.name}
                                subtitle={`${getDepartmentCount(block.id)} department(s)`}
                                left={(props) => (
                                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                                        <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                            {block.name.charAt(0)}
                                        </Text>
                                    </View>
                                )}
                                right={(props) => (
                                    <View style={styles.actions}>
                                        <IconButton
                                            icon="pencil"
                                            size={20}
                                            onPress={() => openEditDialog(block)}
                                        />
                                        <IconButton
                                            icon="delete"
                                            size={20}
                                            iconColor={theme.colors.error}
                                            onPress={() => handleDelete(block)}
                                        />
                                    </View>
                                )}
                            />
                            <Card.Actions>
                                <Button onPress={() => navigation.navigate('Departments')}>Departments</Button>
                                <Button onPress={() => navigation.navigate('Classrooms')}>Classrooms</Button>
                                <Button onPress={() => navigation.navigate('Labs')}>Labs</Button>
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
                    <Dialog.Title>{editingBlock ? 'Edit Block' : 'Add Block'}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Block Name"
                            value={blockName}
                            onChangeText={setBlockName}
                            mode="outlined"
                            placeholder="e.g., Block 1, Main Building"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
                        <Button onPress={handleSave} mode="contained">
                            {editingBlock ? 'Update' : 'Add'}
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
    scrollContent: {
        padding: 16,
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
        width: 40,
        height: 40,
        borderRadius: 20,
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
