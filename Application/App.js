import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import { createStackNavigator } from '@react-navigation/stack';
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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  'Video component from `expo-av` is deprecated',
]);

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

        // Initial session check and resource pre-loading
        const { data, error } = await supabase.auth.getSession();
        const initialSession = data?.session;
        setSession(initialSession);

        if (initialSession) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_verified')
            .eq('id', initialSession.user.id)
            .single();

          if (profileData && profileData.is_verified) {
            setSetupComplete(true);
          }
        }
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        // This will trigger the app to render the navigator
        setAppIsReady(true);
      }
    }

    prepare();

    // Fallback: hide splash screen after 5 seconds no matter what
    const timeout = setTimeout(() => {
      setAppIsReady(true);
      SplashScreen.hideAsync().catch(() => { });
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        supabase.from('profiles')
          .select('is_verified')
          .eq('id', newSession.user.id)
          .single()
          .then(({ data }) => {
            setSetupComplete(data?.is_verified || false);
          });
      } else {
        setSetupComplete(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide the splash screen once the first layout is complete
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          {!session ? (
            <AuthScreen />
          ) : !setupComplete ? (
            <AccountSetupScreen onComplete={() => setSetupComplete(true)} />
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="WorkoutPlayer" component={WorkoutPlayerScreen} />
              <Stack.Screen name="TrainerDetail" component={TrainerDetailScreen} />
              <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
              <Stack.Screen name="QuickLog" component={WorkoutPlayerScreen} />
              <Stack.Screen name="Premium" component={PremiumScreen} />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

