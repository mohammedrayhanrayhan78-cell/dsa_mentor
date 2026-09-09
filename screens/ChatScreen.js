import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getHint } from '../lib/gemini';

export default function ChatScreen() {
  const [problemText, setProblemText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeProblem, setActiveProblem] = useState('');
  const [hintLevel, setHintLevel] = useState(1);
  const scrollRef = useRef(null);

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const requestHint = async (text, level, showUserBubble) => {
    if (!text.trim() || loading) {
      return;
    }

    setLoading(true);

    if (showUserBubble) {
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
      if (showUserBubble) {
        setProblemText('');
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

  const onGetHint = () => {
    requestHint(problemText, 1, true);
  };

  const onBiggerHint = (currentLevel) => {
    const nextLevel = Math.min((currentLevel || hintLevel) + 1, 3);
    if (!activeProblem || nextLevel > 3) {
      return;
    }
    requestHint(activeProblem, nextLevel, false);
  };

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
        {messages.length === 0 ? (
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
          style={[styles.sendButton, (!problemText.trim() || loading) && styles.sendButtonDisabled]}
          onPress={onGetHint}
          disabled={!problemText.trim() || loading}
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
