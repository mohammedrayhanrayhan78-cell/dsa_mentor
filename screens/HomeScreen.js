import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

function welcomeName(user) {
  const displayName = String(user?.user_metadata?.display_name ?? '').trim();
  if (displayName) {
    return displayName;
  }
  const email = user?.email ?? '';
  return email.split('@')[0] || '';
}

export default function HomeScreen({ navigation }) {
  const [greetingName, setGreetingName] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      supabase.auth.getUser().then(({ data }) => {
        if (isMounted) {
          setGreetingName(welcomeName(data.user));
        }
      });

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>DSA Mentor</Text>
      <Text style={styles.welcome}>Welcome{greetingName ? `, ${greetingName}` : ''}</Text>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Learn the pattern, not the answer.</Text>
        <Text style={styles.heroBody}>
          Paste a DSA problem and get layered hints — a subtle nudge first, then a
          bigger push, then the approach — without full solutions.
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Chat')}>
        <Text style={styles.primaryButtonText}>New Problem</Text>
        <Text style={styles.primaryButtonHint}>Start a hint session</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('History')}
      >
        <Text style={styles.secondaryButtonText}>My Progress</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onLogout} style={styles.logoutWrap}>
        <Text style={styles.logout}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F0D2B',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  brand: {
    color: '#A99CFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  welcome: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  hero: {
    backgroundColor: '#1C1844',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2E2860',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  heroBody: {
    color: '#C8C4E8',
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#7C6AED',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButtonHint: {
    color: '#E4DFFF',
    fontSize: 13,
    marginTop: 4,
  },
  secondaryButton: {
    borderColor: '#7C6AED',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#7C6AED',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutWrap: {
    marginTop: 'auto',
    paddingTop: 32,
    alignItems: 'center',
  },
  logout: {
    color: '#8B87B0',
    fontSize: 14,
    fontWeight: '600',
  },
});
