/**
 * Notes Screen - View and manage notes
 */

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../api/client';

interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
}

export function NotesScreen() {
  const { notes, setNotes, notesLoading, setNotesLoading, addNote, removeNote } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newTags, setNewTags] = useState('');

  const loadNotes = async () => {
    setNotesLoading(true);
    try {
      const response = await apiClient.getNotes();
      if (response.result?.notes) {
        setNotes(response.result.notes);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const handleCreateNote = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Fejl', 'Titel er påkrævet');
      return;
    }

    try {
      const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
      const response = await apiClient.createNote(newTitle, newBody, tags);
      
      if (response.result?.note) {
        addNote(response.result.note);
      }
      
      setModalVisible(false);
      setNewTitle('');
      setNewBody('');
      setNewTags('');
    } catch (error) {
      Alert.alert('Fejl', 'Kunne ikke oprette note');
    }
  };

  const handleDeleteNote = (id: string) => {
    Alert.alert(
      'Slet note',
      'Er du sikker på at du vil slette denne note?',
      [
        { text: 'Annuller', style: 'cancel' },
        { 
          text: 'Slet', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteNote(id);
              removeNote(id);
            } catch (error) {
              Alert.alert('Fejl', 'Kunne ikke slette note');
            }
          }
        },
      ]
    );
  };

  const renderNote = ({ item }: { item: Note }) => (
    <Card style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Button
          title=""
          onPress={() => handleDeleteNote(item.id)}
          variant="ghost"
          size="sm"
          icon={<Ionicons name="trash-outline" size={18} color={colors.error.main} />}
        />
      </View>
      
      <Text style={styles.noteBody} numberOfLines={3}>
        {item.body}
      </Text>
      
      {item.tags?.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      
      <Text style={styles.noteDate}>
        {new Date(item.createdAt).toLocaleDateString('da-DK')}
      </Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mine noter</Text>
        <Button
          title="Ny"
          onPress={() => setModalVisible(true)}
          size="sm"
          icon={<Ionicons name="add" size={18} color="#fff" />}
        />
      </View>

      {notes.length === 0 && !notesLoading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.neutral[600]} />
          <Text style={styles.emptyText}>Ingen noter endnu</Text>
          <Text style={styles.emptySubtext}>Tryk på "Ny" for at oprette din første note</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent[400]}
            />
          }
        />
      )}

      {/* Create Note Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ny note</Text>
              <Button
                title=""
                onPress={() => setModalVisible(false)}
                variant="ghost"
                size="sm"
                icon={<Ionicons name="close" size={24} color={colors.text.primary} />}
              />
            </View>

            <ScrollView style={styles.modalBody}>
              <Input
                label="Titel"
                placeholder="Indtast titel..."
                value={newTitle}
                onChangeText={setNewTitle}
              />
              
              <Text style={styles.inputLabel}>Indhold</Text>
              <TextInput
                style={styles.bodyInput}
                placeholder="Skriv din note her..."
                placeholderTextColor={colors.neutral[500]}
                value={newBody}
                onChangeText={setNewBody}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              
              <Input
                label="Tags (kommasepareret)"
                placeholder="arbejde, idéer, vigtigt"
                value={newTags}
                onChangeText={setNewTags}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Annuller"
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Opret"
                onPress={handleCreateNote}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  notesList: {
    padding: 20,
    paddingTop: 10,
  },
  noteCard: {
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  noteBody: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: colors.accent[500] + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: colors.accent[400],
    fontWeight: '500',
  },
  noteDate: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  bodyInput: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 120,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  modalButton: {
    flex: 1,
  },
});

