/**
 * Settings Screen - App configuration
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  Switch,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../api/client';

export function SettingsScreen() {
  const { apiUrl, setApiUrl, orgId, userId, setContext, isConnected } = useAppStore();
  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);
  const [localOrgId, setLocalOrgId] = useState(orgId);
  const [localUserId, setLocalUserId] = useState(userId);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const health = await apiClient.healthCheck();
      Alert.alert(
        'Forbindelse OK',
        `Server er online med ${health.registeredTools?.length || 0} MCP tools registreret.`
      );
    } catch (error) {
      Alert.alert('Forbindelse fejlede', 'Kunne ikke forbinde til serveren. Tjek URL og prøv igen.');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = () => {
    setApiUrl(localApiUrl);
    setContext(localOrgId, localUserId);
    Alert.alert('Gemt', 'Indstillinger er blevet gemt.');
  };

  const handleOpenDocs = () => {
    Linking.openURL('https://github.com/Clauskraft/WidgeTDC');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Connection Status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isConnected ? colors.status.online : colors.status.offline }
          ]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Forbundet til backend' : 'Ikke forbundet'}
          </Text>
        </View>
      </Card>

      {/* API Settings */}
      <Text style={styles.sectionTitle}>Server-indstillinger</Text>
      <Card>
        <Input
          label="API URL"
          placeholder="http://localhost:3001"
          value={localApiUrl}
          onChangeText={setLocalApiUrl}
          leftIcon={<Ionicons name="server" size={18} color={colors.neutral[400]} />}
        />
        
        <Button
          title="Test forbindelse"
          onPress={handleTestConnection}
          variant="outline"
          loading={testing}
          icon={<Ionicons name="wifi" size={18} color={colors.primary[500]} />}
          style={styles.testButton}
        />
      </Card>

      {/* User Context */}
      <Text style={styles.sectionTitle}>Bruger-kontekst</Text>
      <Card>
        <Input
          label="Organisation ID"
          placeholder="default"
          value={localOrgId}
          onChangeText={setLocalOrgId}
          leftIcon={<Ionicons name="business" size={18} color={colors.neutral[400]} />}
        />
        
        <Input
          label="Bruger ID"
          placeholder="mobile-user"
          value={localUserId}
          onChangeText={setLocalUserId}
          leftIcon={<Ionicons name="person" size={18} color={colors.neutral[400]} />}
        />
      </Card>

      {/* Preferences */}
      <Text style={styles.sectionTitle}>Præferencer</Text>
      <Card>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={20} color={colors.text.secondary} />
            <Text style={styles.settingLabel}>Notifikationer</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.neutral[600], true: colors.accent[500] }}
            thumbColor={notifications ? colors.accent[300] : colors.neutral[400]}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon" size={20} color={colors.text.secondary} />
            <Text style={styles.settingLabel}>Mørk tilstand</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.neutral[600], true: colors.accent[500] }}
            thumbColor={darkMode ? colors.accent[300] : colors.neutral[400]}
          />
        </View>
      </Card>

      {/* Save Button */}
      <Button
        title="Gem indstillinger"
        onPress={handleSaveSettings}
        fullWidth
        style={styles.saveButton}
        icon={<Ionicons name="save" size={18} color="#fff" />}
      />

      {/* About */}
      <Text style={styles.sectionTitle}>Om</Text>
      <Card>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Platform</Text>
          <Text style={styles.aboutValue}>WidgeTDC</Text>
        </View>
        <View style={styles.divider} />
        <Button
          title="Dokumentation"
          onPress={handleOpenDocs}
          variant="ghost"
          icon={<Ionicons name="book-outline" size={18} color={colors.primary[500]} />}
        />
      </Card>

      {/* Footer */}
      <Text style={styles.footer}>
        © 2025 WidgeTDC - Enterprise Widget Platform
      </Text>
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
    paddingBottom: 40,
  },
  statusCard: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  testButton: {
    marginTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 8,
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 8,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  aboutLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  aboutValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 24,
  },
});

