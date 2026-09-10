import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      setError('Enter your preferred name, email, and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { display_name: trimmedName },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: trimmedName },
      });
      setLoading(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      return;
    }

    setLoading(false);
    setInfo('Account created. Check your email to confirm, then log in.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.kicker}>Get started</Text>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          Save your hint sessions and track progress across problems.
        </Text>

        <TextInput
          style={styles.input}
          autoCapitalize="words"
          autoComplete="name"
          placeholder="Preferred name"
          placeholderTextColor="#8B87B0"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#8B87B0"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoComplete="password-new"
          placeholder="Password"
          placeholderTextColor="#8B87B0"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Sign up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0D2B',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
  },
  kicker: {
    color: '#A99CFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#C8C4E8',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#1C1844',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  error: {
    color: '#F07178',
    marginBottom: 12,
  },
  info: {
    color: '#7CDBA8',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#7C6AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    color: '#A99CFF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 15,
    fontWeight: '600',
  },
});
