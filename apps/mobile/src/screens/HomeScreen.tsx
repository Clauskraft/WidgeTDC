/**
 * Home Screen - Dashboard Overview
 */

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Pressable 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../api/client';

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  screen: string;
}

const quickActions: QuickAction[] = [
  { id: 'search', title: 'Søg', icon: 'search', color: colors.primary[500], screen: 'Search' },
  { id: 'notes', title: 'Noter', icon: 'document-text', color: colors.accent[500], screen: 'Notes' },
  { id: 'tasks', title: 'Opgaver', icon: 'checkbox', color: colors.success.main, screen: 'Tasks' },
  { id: 'agents', title: 'Agenter', icon: 'hardware-chip', color: colors.warning.main, screen: 'Agents' },
];

export function HomeScreen({ navigation }: any) {
  const { isConnected, setConnection } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    tools: 0,
    notes: 0,
    tasks: 0,
  });

  const checkConnection = async () => {
    try {
      const health = await apiClient.healthCheck();
      setConnection(true);
      setStats({
        tools: health.registeredTools?.length || 0,
        notes: 0,
        tasks: 0,
      });
    } catch (error) {
      setConnection(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkConnection();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={colors.accent[400]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Velkommen tilbage</Text>
          <Text style={styles.title}>WidgeTDC</Text>
        </View>
        <View style={[
          styles.statusBadge,
          isConnected ? styles.statusOnline : styles.statusOffline
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isConnected ? colors.status.online : colors.status.offline }
          ]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Hurtig adgang</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <Pressable
            key={action.id}
            style={({ pressed }) => [
              styles.actionCard,
              pressed && styles.actionPressed,
            ]}
            onPress={() => navigation.navigate(action.screen)}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon} size={28} color={action.color} />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
          </Pressable>
        ))}
      </View>

      {/* Stats Cards */}
      <Text style={styles.sectionTitle}>Oversigt</Text>
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Ionicons name="construct" size={24} color={colors.primary[400]} />
          <Text style={styles.statValue}>{stats.tools}</Text>
          <Text style={styles.statLabel}>MCP Tools</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="document-text" size={24} color={colors.accent[400]} />
          <Text style={styles.statValue}>{stats.notes}</Text>
          <Text style={styles.statLabel}>Noter</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="checkbox" size={24} color={colors.success.main} />
          <Text style={styles.statValue}>{stats.tasks}</Text>
          <Text style={styles.statLabel}>Opgaver</Text>
        </Card>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Seneste aktivitet</Text>
      <Card>
        <View style={styles.activityItem}>
          <Ionicons name="flash" size={20} color={colors.accent[400]} />
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>System startet</Text>
            <Text style={styles.activityTime}>For nylig</Text>
          </View>
        </View>
        <View style={styles.activityItem}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Backend forbundet</Text>
            <Text style={styles.activityTime}>{isConnected ? 'Aktiv' : 'Afbrudt'}</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusOnline: {
    backgroundColor: colors.success.main + '20',
  },
  statusOffline: {
    backgroundColor: colors.neutral[700],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.card.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  actionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  activityTime: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});

