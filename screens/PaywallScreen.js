import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getCurrentOffering, purchasePackage } from '../lib/revenuecat';

export default function PaywallScreen() {
  const navigation = useNavigation();
  const [pkg, setPkg] = useState(null);
  const [loadingOffering, setLoadingOffering] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const loadOffering = useCallback(async () => {
    setLoadingOffering(true);
    try {
      const offering = await getCurrentOffering();
      setPkg(offering?.availablePackages?.[0] ?? null);
    } catch (error) {
      console.warn('Could not load offerings', error.message);
    } finally {
      setLoadingOffering(false);
    }
  }, []);

  useEffect(() => {
    loadOffering();
  }, [loadOffering]);

  const onPurchase = async () => {
    if (!pkg || purchasing) return;
    setPurchasing(true);
    try {
      const isPremium = await purchasePackage(pkg);
      if (isPremium) {
        Alert.alert('You are Premium!', 'Unlimited sessions and full history are now unlocked.');
        navigation.goBack();
      }
    } catch (error) {
      if (!error.userCancelled) {
        Alert.alert('Purchase failed', error.message || 'Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const priceLabel = pkg?.product?.priceString || '$4.99 / month';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Go Premium</Text>
      <Text style={styles.body}>
        Unlock full history, unlimited hint sessions, and the complete DSA Mentor
        experience.
      </Text>

      <View style={styles.card}>
        <Text style={styles.price}>{priceLabel}</Text>
        <Text style={styles.feature}>Unlimited problem sessions</Text>
        <Text style={styles.feature}>Full session history</Text>
        <Text style={styles.feature}>Deeper, multi-level hints</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, (purchasing || loadingOffering) && styles.buttonDisabled]}
        onPress={onPurchase}
        disabled={purchasing || loadingOffering}
      >
        {purchasing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {loadingOffering ? 'Loading...' : `Start Premium — ${priceLabel}`}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0D2B', padding: 24, justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', marginBottom: 10 },
  body: { color: '#C8C4E8', fontSize: 16, lineHeight: 24, marginBottom: 24 },
  card: {
    backgroundColor: '#1C1844',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#7C6AED',
  },
  price: { color: '#7C6AED', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  feature: { color: '#FFFFFF', fontSize: 15, marginBottom: 8 },
  button: { backgroundColor: '#7C6AED', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});