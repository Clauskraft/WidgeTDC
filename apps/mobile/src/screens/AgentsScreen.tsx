/**
 * Agents Screen - Monitor and trigger agents
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
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { apiClient } from '../api/client';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'error';
  lastRun?: string;
  description?: string;
}

const defaultAgents: Agent[] = [
  { id: 'hanspedder', name: 'HansPedder', role: 'Orchestrator', status: 'idle', description: 'Hovedorchestrator for autonome opgaver' },
  { id: 'data-agent', name: 'DataAgent', role: 'Data Specialist', status: 'idle', description: 'Håndterer datasøgning og -analyse' },
  { id: 'security-agent', name: 'SecurityAgent', role: 'Security', status: 'idle', description: 'Overvåger sikkerhed og compliance' },
  { id: 'memory-agent', name: 'MemoryAgent', role: 'Memory', status: 'idle', description: 'Administrerer hukommelsessystemer' },
  { id: 'pal-agent', name: 'PAL Agent', role: 'Personal Assistant', status: 'idle', description: 'Personlig assistent og coach' },
];

export function AgentsScreen() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const [triggering, setTriggering] = useState(false);

  const loadAgentStatus = async () => {
    try {
      const response = await apiClient.getAgentStatus();
      // Update agent status from response if available
      if (response.result?.agents) {
        setAgents(prev => prev.map(agent => {
          const updated = response.result.agents.find((a: any) => a.id === agent.id);
          return updated ? { ...agent, ...updated } : agent;
        }));
      }
    } catch (error) {
      console.error('Failed to load agent status:', error);
    }
  };

  useEffect(() => {
    loadAgentStatus();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAgentStatus();
    setRefreshing(false);
  };

  const handleTriggerAgent = async () => {
    if (!selectedAgent || !taskInput.trim()) {
      Alert.alert('Fejl', 'Indtast venligst en opgave');
      return;
    }

    setTriggering(true);
    try {
      // Update local state to show running
      setAgents(prev => prev.map(a => 
        a.id === selectedAgent.id ? { ...a, status: 'running' } : a
      ));

      const response = await apiClient.triggerAgent(selectedAgent.id, taskInput);
      
      Alert.alert(
        'Agent aktiveret',
        `${selectedAgent.name} er nu i gang med opgaven.`,
        [{ text: 'OK' }]
      );

      // Update status after completion
      setAgents(prev => prev.map(a => 
        a.id === selectedAgent.id ? { ...a, status: 'idle', lastRun: new Date().toISOString() } : a
      ));

      setModalVisible(false);
      setTaskInput('');
    } catch (error) {
      Alert.alert('Fejl', 'Kunne ikke aktivere agent');
      setAgents(prev => prev.map(a => 
        a.id === selectedAgent.id ? { ...a, status: 'error' } : a
      ));
    } finally {
      setTriggering(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return colors.success.main;
      case 'error': return colors.error.main;
      default: return colors.neutral[500];
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'running': return 'pulse';
      case 'error': return 'alert-circle';
      default: return 'ellipse';
    }
  };

  const renderAgent = ({ item }: { item: Agent }) => (
    <Card style={styles.agentCard}>
      <View style={styles.agentHeader}>
        <View style={styles.agentIcon}>
          <Ionicons name="hardware-chip" size={24} color={colors.primary[400]} />
        </View>
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{item.name}</Text>
          <Text style={styles.agentRole}>{item.role}</Text>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={12} color="#fff" />
        </View>
      </View>

      {item.description && (
        <Text style={styles.agentDescription}>{item.description}</Text>
      )}

      {item.lastRun && (
        <Text style={styles.lastRun}>
          Sidst kørt: {new Date(item.lastRun).toLocaleString('da-DK')}
        </Text>
      )}

      <Button
        title={item.status === 'running' ? 'Kører...' : 'Aktivér'}
        onPress={() => {
          setSelectedAgent(item);
          setModalVisible(true);
        }}
        disabled={item.status === 'running'}
        variant={item.status === 'running' ? 'ghost' : 'primary'}
        size="sm"
        icon={<Ionicons name="play" size={16} color={item.status === 'running' ? colors.neutral[500] : '#fff'} />}
        style={styles.triggerButton}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenter</Text>
        <Text style={styles.headerSubtitle}>
          {agents.filter(a => a.status === 'running').length} aktive
        </Text>
      </View>

      <FlatList
        data={agents}
        renderItem={renderAgent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.agentsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent[400]}
          />
        }
      />

      {/* Trigger Agent Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Aktivér {selectedAgent?.name}
              </Text>
              <Button
                title=""
                onPress={() => setModalVisible(false)}
                variant="ghost"
                size="sm"
                icon={<Ionicons name="close" size={24} color={colors.text.primary} />}
              />
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Beskriv opgaven</Text>
              <TextInput
                style={styles.taskInput}
                placeholder="F.eks. 'Analysér seneste salgsdata' eller 'Find relaterede dokumenter'"
                placeholderTextColor={colors.neutral[500]}
                value={taskInput}
                onChangeText={setTaskInput}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.warningBox}>
                <Ionicons name="shield-checkmark" size={20} color={colors.warning.main} />
                <Text style={styles.warningText}>
                  Agenten vil udføre opgaven autonomt, men kritiske handlinger kræver din godkendelse.
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Annuller"
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Aktivér"
                onPress={handleTriggerAgent}
                loading={triggering}
                style={styles.modalButton}
                icon={<Ionicons name="play" size={18} color="#fff" />}
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
  headerSubtitle: {
    fontSize: 14,
    color: colors.accent[400],
    fontWeight: '500',
  },
  agentsList: {
    padding: 20,
    paddingTop: 10,
  },
  agentCard: {
    marginBottom: 12,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  agentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[500] + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  agentRole: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  lastRun: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 12,
  },
  triggerButton: {
    alignSelf: 'flex-start',
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
  taskInput: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 100,
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.main + '15',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning.main,
    lineHeight: 18,
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

