import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
const ENTITLEMENT_ID = 'premium';

let configured = false;

export function initPurchases() {
  if (configured || !REVENUECAT_API_KEY) return;
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  configured = true;
}

export async function getPremiumStatus() {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch (error) {
    console.warn('Could not fetch premium status', error.message);
    return false;
  }
}

export async function getCurrentOffering() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
}