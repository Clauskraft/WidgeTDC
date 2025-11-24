/**
 * Search Screen - Knowledge Archive Search
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../api/client';

interface SearchResult {
  id: string;
  content: string;
  metadata?: any;
  score?: number;
}

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const response = await apiClient.searchKnowledge(query, 10);
      if (response.result?.results) {
        setResults(response.result.results);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGraphRAG = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const response = await apiClient.queryGraphRAG(query, 5);
      if (response.result) {
        // Convert GraphRAG response to search results format
        const graphResults: SearchResult[] = response.result.nodes?.map((node: any, idx: number) => ({
          id: `graph-${idx}`,
          content: node.content || node.text || JSON.stringify(node),
          metadata: { type: 'graph-rag', ...node },
          score: node.score || 1,
        })) || [];
        
        // Add the synthesized answer as the first result
        if (response.result.answer) {
          graphResults.unshift({
            id: 'answer',
            content: response.result.answer,
            metadata: { type: 'synthesized-answer', confidence: response.result.confidence },
            score: 1,
          });
        }
        
        setResults(graphResults);
      }
    } catch (error) {
      console.error('GraphRAG failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <Card style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Ionicons 
          name={item.metadata?.type === 'synthesized-answer' ? 'bulb' : 'document'} 
          size={20} 
          color={item.metadata?.type === 'synthesized-answer' ? colors.accent[400] : colors.primary[400]} 
        />
        {item.score !== undefined && (
          <Text style={styles.scoreText}>
            {(item.score * 100).toFixed(0)}% match
          </Text>
        )}
      </View>
      <Text style={styles.resultContent} numberOfLines={6}>
        {item.content}
      </Text>
      {item.metadata?.type && (
        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>{item.metadata.type}</Text>
        </View>
      )}
    </Card>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.searchSection}>
        <Input
          placeholder="Søg i vidensarkiv..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          leftIcon={<Ionicons name="search" size={20} color={colors.neutral[400]} />}
        />
        
        <View style={styles.buttonRow}>
          <Button
            title="Søg"
            onPress={handleSearch}
            loading={loading}
            style={styles.searchButton}
          />
          <Button
            title="Graph RAG"
            onPress={handleGraphRAG}
            variant="secondary"
            loading={loading}
            style={styles.searchButton}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent[400]} />
          <Text style={styles.loadingText}>Søger...</Text>
        </View>
      ) : searched && results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={colors.neutral[600]} />
          <Text style={styles.emptyText}>Ingen resultater fundet</Text>
          <Text style={styles.emptySubtext}>Prøv en anden søgning</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  searchSection: {
    padding: 20,
    paddingBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
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
  },
  resultsList: {
    padding: 20,
    paddingTop: 10,
  },
  resultCard: {
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 12,
    color: colors.accent[400],
    fontWeight: '600',
  },
  resultContent: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  metaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[500] + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  metaText: {
    fontSize: 11,
    color: colors.primary[400],
    fontWeight: '500',
  },
});

