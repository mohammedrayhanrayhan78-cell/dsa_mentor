import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import HistoryScreen from './screens/HistoryScreen';
import PaywallScreen from './screens/PaywallScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0F0D2B',
    card: '#0F0D2B',
    text: '#FFFFFF',
    primary: '#7C6AED',
    border: '#241F4D',
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: '#0F0D2B' },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: '#0F0D2B' },
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Stack.Navigator initialRouteName="Splash" screenOptions={screenOptions}>
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'DSA Mentor' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'New Problem' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'My Progress' }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ title: 'Premium' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
