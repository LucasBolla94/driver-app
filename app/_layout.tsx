import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Check for existing session on app startup
    const checkSession = async () => {
      try {
        const keepLoggedIn = await AsyncStorage.getItem('keepLoggedIn');

        if (keepLoggedIn === 'true') {
          // Get the current session
          const { data: { session: currentSession } } = await supabase.auth.getSession();

          if (currentSession) {
            // Verify user is a driver
            const { data: driverData, error } = await supabase
              .from('drivers_uk')
              .select('uid')
              .eq('uid', currentSession.user.id)
              .single();

            if (driverData && !error) {
              setSession(currentSession);
            } else {
              // User is not a driver, sign them out
              await supabase.auth.signOut();
              await AsyncStorage.removeItem('keepLoggedIn');
            }
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setInitializing(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (session && !inAuthGroup) {
      // User is signed in but not in protected route, redirect to tabs
      router.replace('/(tabs)');
    } else if (!session && inAuthGroup) {
      // User is not signed in but in protected route, redirect to login
      router.replace('/login');
    }
  }, [session, segments, initializing]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="recover-password" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
