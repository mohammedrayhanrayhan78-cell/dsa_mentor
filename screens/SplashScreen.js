import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    let isMounted = true;

    async function resolveSession() {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: data.session ? 'Home' : 'Login' }],
      });
    }

    resolveSession();

    return () => {
      isMounted = false;
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>DSA Mentor</Text>
      <Text style={styles.tagline}>Hints that teach, not answers that spoil.</Text>
      <ActivityIndicator color="#7C6AED" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0D2B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  tagline: {
    color: '#C8C4E8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 28,
  },
  loader: {
    marginTop: 8,
  },
});
