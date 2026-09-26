import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHint } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { getPremiumStatus } from '../lib/revenuecat';

const DAILY_SESSION_LIMIT = 3;

function startOfTodayIso() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export default function ChatScreen({ navigation }) {
  const [problemText, setProblemText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeProblem, setActiveProblem] = useState('');
  const [hintLevel, setHintLevel] = useState(1);
  const [solved, setSolved] = useState(false);
  const [atDailyLimit, setAtDailyLimit] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const scrollRef = useRef(null);
  const sessionRef = useRef({
    id: null,
    problem: '',
    pattern: '',
    solved: false,
  });

  const checkDailyLimit = useCallback(async () => {
    if (isPremium) {
      setAtDailyLimit(false);
      return false;
    }

    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) {
      setAtDailyLimit(false);
      return false;
    }

    const { count, error } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfTodayIso());

    if (error) {
      return false;
    }

    const limited = (count ?? 0) >= DAILY_SESSION_LIMIT;
    setAtDailyLimit(limited);
    return limited;
  }, [isPremium]);

  const showDailyLimitAlert = () => {
    Alert.alert(
      "You've hit your daily limit — upgrade for unlimited",
      'Free accounts can start 3 hint sessions per day. Upgrade for unlimited access.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Upgrade', onPress: () => navigation.navigate('Paywall') },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      getPremiumStatus().then(setIsPremium);
      checkDailyLimit();
    }, [checkDailyLimit])
  );

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  // Creates the sessions row the moment the first hint for a problem arrives,
  // so it shows up in History immediately — no longer depends on leaving the screen.
  const createSessionRow = async (problemSnippet, pattern) => {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return null;

    const { data: inserted, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        problem_snippet: problemSnippet.slice(0, 100),
        pattern,
        solved: false,
      })
      .select('id')
      .single();

    if (error || !inserted) {
      console.warn('Session insert failed:', error?.message, error?.details, error?.hint);
      return null;
    }
    return inserted.id;
  };

  const updateSessionRow = async (fields) => {
    const id = sessionRef.current.id;
    if (!id) return;
    await supabase.from('sessions').update(fields).eq('id', id);
  };

  const requestHint = async (text, level, isNewProblem) => {
    if (!text.trim() || loading) {
      return;
    }

    setLoading(true);

    if (isNewProblem) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text: text.trim() },
      ]);
    }

    try {
      const result = await getHint(text.trim(), level);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: result.hint,
          pattern: result.pattern,
          hintLevel: level,
        },
      ]);
      setActiveProblem(text.trim());
      setHintLevel(level);

      if (isNewProblem) {
        setProblemText('');
        setSolved(false);
        sessionRef.current = {
          id: null,
          problem: text.trim(),
          pattern: result.pattern,
          solved: false,
        };
        const newId = await createSessionRow(text.trim(), result.pattern);
        sessionRef.current.id = newId;
      } else {
        sessionRef.current.pattern = result.pattern || sessionRef.current.pattern;
        updateSessionRow({ pattern: sessionRef.current.pattern });
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: `Could not get a hint. ${error.message}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  const onGetHint = async () => {
    if (loading) {
      return;
    }

    const limited = await checkDailyLimit();
    if (limited) {
      showDailyLimitAlert();
      return;
    }

    if (!problemText.trim()) {
      return;
    }

    requestHint(problemText, 1, true);
  };

  const onBiggerHint = (currentLevel) => {
    const nextLevel = Math.min((currentLevel || hintLevel) + 1, 3);
    if (!activeProblem || nextLevel > 3) {
      return;
    }
    requestHint(activeProblem, nextLevel, false);
  };

  const onToggleSolved = () => {
    if (!sessionRef.current.problem) {
      return;
    }
    const next = !sessionRef.current.solved;
    sessionRef.current.solved = next;
    setSolved(next);
    updateSessionRow({ solved: next });
  };

  const getHintDisabled = loading || (!problemText.trim() && !atDailyLimit);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        onContentSizeChange={scrollToEnd}
      >
        {atDailyLimit ? (
          <View style={styles.limitCard}>
            <Text style={styles.limitTitle}>Daily limit reached</Text>
            <Text style={styles.limitBody}>
              You've hit your daily limit — upgrade for unlimited
            </Text>
            <TouchableOpacity
              style={styles.limitButton}
              onPress={() => navigation.navigate('Paywall')}
            >
              <Text style={styles.limitButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {messages.length === 0 && !atDailyLimit ? (
          <Text style={styles.emptyText}>
            Paste a DSA problem below and tap Get Hint.
          </Text>
        ) : null}

        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.bubble,
              message.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {message.role === 'assistant' && message.pattern ? (
              <Text style={styles.pattern}>{message.pattern}</Text>
            ) : null}
            <Text style={styles.bubbleText}>{message.text}</Text>
            {message.role === 'assistant' && !message.isError ? (
              <TouchableOpacity
                style={styles.hintButton}
                onPress={() => onBiggerHint(message.hintLevel)}
                disabled={loading || (message.hintLevel || hintLevel) >= 3}
              >
                <Text style={styles.hintButtonText}>
                  {(message.hintLevel || hintLevel) >= 3
                    ? 'Max hint given'
                    : 'Give me a bigger hint'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}

        {activeProblem ? (
          <TouchableOpacity
            style={[styles.solvedButton, solved && styles.solvedButtonActive]}
            onPress={onToggleSolved}
          >
            <Text style={[styles.solvedButtonText, solved && styles.solvedButtonTextActive]}>
              {solved ? '✓ Marked as solved' : 'Mark as solved'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {loading ? <ActivityIndicator color="#7C6AED" style={styles.loader} /> : null}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Paste a DSA problem statement..."
          placeholderTextColor="#8B87B0"
          multiline
          value={problemText}
          onChangeText={setProblemText}
        />
        <TouchableOpacity
          style={[styles.sendButton, getHintDisabled && styles.sendButtonDisabled]}
          onPress={onGetHint}
          disabled={getHintDisabled}
        >
          <Text style={styles.sendButtonText}>Get Hint</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0D2B',
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyText: {
    color: '#C8C4E8',
    textAlign: 'center',
    marginTop: 40,
  },
  limitCard: {
    borderWidth: 1,
    borderColor: '#7C6AED',
    backgroundColor: '#1C1844',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  limitTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  limitBody: {
    color: '#C8C4E8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  limitButton: {
    backgroundColor: '#7C6AED',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  limitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#7C6AED',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1C1844',
  },
  pattern: {
    color: '#A99CFF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  hintButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderColor: '#7C6AED',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  hintButtonText: {
    color: '#B7ACFF',
    fontSize: 13,
    fontWeight: '600',
  },
  solvedButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#7CDBA8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  solvedButtonActive: {
    backgroundColor: '#1A3A2C',
  },
  solvedButtonText: {
    color: '#7CDBA8',
    fontSize: 13,
    fontWeight: '600',
  },
  solvedButtonTextActive: {
    color: '#7CDBA8',
  },
  loader: {
    marginVertical: 8,
  },
  composer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#241F4D',
    backgroundColor: '#0F0D2B',
  },
  input: {
    minHeight: 80,
    maxHeight: 140,
    backgroundColor: '#1C1844',
    color: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
  },
  sendButton: {
    marginTop: 10,
    backgroundColor: '#7C6AED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});