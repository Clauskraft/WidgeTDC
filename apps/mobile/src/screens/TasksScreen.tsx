/**
 * Tasks Screen - TaskRecorder suggestions and automation
 */

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../api/client';

interface TaskSuggestion {
  id: string;
  taskSignature: string;
  taskType: string;
  description?: string;
  frequency: number;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
}

export function TasksScreen() {
  const { taskSuggestions, setTaskSuggestions, tasksLoading, setTasksLoading, updateTaskStatus } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadSuggestions = async () => {
    setTasksLoading(true);
    try {
      const response = await apiClient.getTaskSuggestions();
      if (response.result?.suggestions) {
        setTaskSuggestions(response.result.suggestions.map((s: any) => ({
          ...s,
          status: s.status || 'pending'
        })));
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSuggestions();
    setRefreshing(false);
  };

  const handleApprove = async (suggestion: TaskSuggestion) => {
    Alert.alert(
      'Godkend automatisering',
      `Er du sikker på at du vil godkende automatisering af "${suggestion.taskType}"?\n\nDenne handling vil blive udført automatisk næste gang.`,
      [
        { text: 'Annuller', style: 'cancel' },
        { 
          text: 'Godkend', 
          onPress: async () => {
            try {
              await apiClient.approveTask(suggestion.id);
              updateTaskStatus(suggestion.id, 'approved');
              Alert.alert('Succes', 'Automatisering godkendt!');
            } catch (error) {
              Alert.alert('Fejl', 'Kunne ikke godkende opgave');
            }
          }
        },
      ]
    );
  };

  const handleReject = async (suggestion: TaskSuggestion) => {
    try {
      await apiClient.rejectTask(suggestion.id, 'Afvist af bruger');
      updateTaskStatus(suggestion.id, 'rejected');
    } catch (error) {
      Alert.alert('Fejl', 'Kunne ikke afvise opgave');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return colors.success.main;
      case 'rejected': return colors.error.main;
      default: return colors.warning.main;
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      default: return 'time';
    }
  };

  const renderSuggestion = ({ item }: { item: TaskSuggestion }) => (
    <Card style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskTypeContainer}>
          <Ionicons name="flash" size={20} color={colors.accent[400]} />
          <Text style={styles.taskType}>{item.taskType}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status === 'pending' ? 'Afventer' : item.status === 'approved' ? 'Godkendt' : 'Afvist'}
          </Text>
        </View>
      </View>

      <Text style={styles.taskSignature} numberOfLines={2}>
        {item.taskSignature}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="repeat" size={16} color={colors.text.tertiary} />
          <Text style={styles.statText}>{item.frequency}x set</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="analytics" size={16} color={colors.text.tertiary} />
          <Text style={styles.statText}>{(item.confidence * 100).toFixed(0)}% sikkerhed</Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <Button
            title="Afvis"
            onPress={() => handleReject(item)}
            variant="outline"
            size="sm"
            style={styles.actionButton}
          />
          <Button
            title="Godkend"
            onPress={() => handleApprove(item)}
            size="sm"
            style={styles.actionButton}
          />
        </View>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Automatiserings-forslag</Text>
        <Text style={styles.headerSubtitle}>
          TaskRecorder har observeret dine handlinger
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color={colors.info.main} />
        <Text style={styles.infoText}>
          Agenter må aldrig udføre handlinger uden din godkendelse. 
          Gennemgå forslagene nedenfor.
        </Text>
      </View>

      {taskSuggestions.length === 0 && !tasksLoading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkbox-outline" size={64} color={colors.neutral[600]} />
          <Text style={styles.emptyText}>Ingen forslag endnu</Text>
          <Text style={styles.emptySubtext}>
            TaskRecorder lærer fra dine handlinger og foreslår automatiseringer
          </Text>
        </View>
      ) : (
        <FlatList
          data={taskSuggestions}
          renderItem={renderSuggestion}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tasksList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent[400]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info.main + '15',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.info.main,
    lineHeight: 18,
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
  tasksList: {
    padding: 20,
    paddingTop: 16,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskSignature: {
    fontSize: 13,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    backgroundColor: colors.background.tertiary,
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
  },
});

