import React, { useState, useEffect, useCallback, Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Platform, LogBox, TouchableOpacity } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import { createStackNavigator } from '@react-navigation/stack';
import { ShieldAlert, RefreshCw } from 'lucide-react-native';
import MainTabs from './navigation/MainTabs';
import AuthScreen from './screens/AuthScreen';
import AccountSetupScreen from './screens/AccountSetupScreen';
import WorkoutPlayerScreen from './screens/WorkoutPlayerScreen';
import TrainerDetailScreen from './screens/TrainerDetailScreen';
import VideoPlayerScreen from './screens/VideoPlayerScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import PremiumScreen from './screens/PremiumScreen';

import { supabase } from './supabaseClient';

const Stack = createStackNavigator();

// Static silencing for non-critical logs
LogBox.ignoreLogs(['Video component from `expo-av` is deprecated']);

// --- World-Class Error Boundary ---
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("Global Error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <View style={{ backgroundColor: '#FF572220', p: 20, borderRadius: 30, marginBottom: 20 }}>
             <ShieldAlert color="#FF5722" size={60} />
          </View>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', textAlign: 'center' }}>System Alert</Text>
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 10, fontSize: 16 }}>An unexpected architectural error occurred. We have been notified.</Text>
          <TouchableOpacity 
            onPress={() => this.setState({ hasError: false })}
            style={{ backgroundColor: '#FF5722', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 25, marginTop: 40, flexDirection: 'row', alignItems: 'center' }}
          >
            <RefreshCw color="white" size={20} style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontWeight: '900' }}>REBOOT SYSTEM</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [session, setSession] = useState(null);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        if (Platform.OS === 'android') {
          await NavigationBar.setBackgroundColorAsync('#FBFBFB');
          await NavigationBar.setButtonStyleAsync('dark');
        }

        const { data } = await supabase.auth.getSession();
        setSession(data?.session);

        if (data?.session) {
          const { data: profile } = await supabase.from('profiles').select('is_verified').eq('id', data.session.user.id).single();
          setSetupComplete(profile?.is_verified || false);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        supabase.from('profiles').select('is_verified').eq('id', newSession.user.id).single()
          .then(({ data }) => setSetupComplete(data?.is_verified || false));
      } else {
        setSetupComplete(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) await SplashScreen.hideAsync();
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <NavigationContainer>
            {!session ? (
              <AuthScreen />
            ) : !setupComplete ? (
              <AccountSetupScreen onComplete={() => setSetupComplete(true)} />
            ) : (
              <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: 'white' } }}>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="WorkoutPlayer" component={WorkoutPlayerScreen} />
                <Stack.Screen name="TrainerDetail" component={TrainerDetailScreen} />
                <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="Premium" component={PremiumScreen} />
              </Stack.Navigator>
            )}
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

