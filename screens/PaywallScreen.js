import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PaywallScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Go Premium</Text>
      <Text style={styles.body}>
        Unlock full history, unlimited hint sessions, and the complete DSA Mentor
        experience.
      </Text>

      <View style={styles.card}>
        <Text style={styles.price}>$4.99 / month</Text>
        <Text style={styles.feature}>Unlimited problem sessions</Text>
        <Text style={styles.feature}>Full session history</Text>
        <Text style={styles.feature}>Deeper, multi-level hints</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => {}}>
        <Text style={styles.buttonText}>Start Premium (coming soon)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0D2B',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 10,
  },
  body: {
    color: '#C8C4E8',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1C1844',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#7C6AED',
  },
  price: {
    color: '#7C6AED',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  feature: {
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#7C6AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
