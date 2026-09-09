import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const FREE_SESSION_LIMIT = 3;
const isPremium = false;

function formatDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString();
}

export default function HistoryScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: queryError } = await supabase
      .from('sessions')
      .select('id, problem_snippet, pattern, created_at, solved')
      .order('created_at', { ascending: false });

    if (queryError) {
      setSessions([]);
      setError(queryError.message);
    } else {
      setSessions(data ?? []);
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const visibleSessions = isPremium
    ? sessions
    : sessions.slice(0, FREE_SESSION_LIMIT);
  const lockedCount = isPremium ? 0 : Math.max(sessions.length - FREE_SESSION_LIMIT, 0);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.snippet} numberOfLines={2}>
        {item.problem_snippet || 'Untitled problem'}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.pattern}>{item.pattern || 'Uncategorized'}</Text>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={[styles.solved, item.solved ? styles.solvedYes : styles.solvedNo]}>
        {item.solved ? 'Solved' : 'In progress'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color="#7C6AED" style={styles.loader} />
      ) : (
        <FlatList
          data={visibleSessions}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {error
                ? `Could not load history. ${error}`
                : 'No sessions yet. Start a problem from Home.'}
            </Text>
          }
          ListFooterComponent={
            !isPremium ? (
              <View style={styles.unlockCard}>
                <Text style={styles.unlockTitle}>Unlock full history</Text>
                <Text style={styles.unlockBody}>
                  Free users can view the last {FREE_SESSION_LIMIT} sessions
                  {lockedCount > 0 ? ` (${lockedCount} more hidden).` : '.'} Premium will
                  unlock the rest.
                </Text>
                <TouchableOpacity
                  style={styles.unlockButton}
                  onPress={() => navigation.navigate('Paywall')}
                >
                  <Text style={styles.unlockButtonText}>Unlock full history</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0D2B',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyText: {
    color: '#C8C4E8',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1C1844',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  snippet: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pattern: {
    color: '#A99CFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  date: {
    color: '#C8C4E8',
    fontSize: 12,
  },
  solved: {
    fontSize: 13,
    fontWeight: '600',
  },
  solvedYes: {
    color: '#7CDBA8',
  },
  solvedNo: {
    color: '#E0B36A',
  },
  unlockCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#7C6AED',
    borderRadius: 12,
    padding: 16,
  },
  unlockTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  unlockBody: {
    color: '#C8C4E8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  unlockButton: {
    backgroundColor: '#7C6AED',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
