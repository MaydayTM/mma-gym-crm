import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabase } from '../lib/supabase';

const AUTH_TIMEOUT_MS = 5000;

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let settled = false;

    const settle = (authenticated: boolean) => {
      if (settled) return;
      settled = true;
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    // Timeout: if getSession() hangs, send to login after 5s
    const timeout = setTimeout(() => {
      console.warn('[Auth] getSession() timed out after', AUTH_TIMEOUT_MS, 'ms');
      settle(false);
    }, AUTH_TIMEOUT_MS);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout);
        settle(!!session);
      })
      .catch((err) => {
        console.error('[Auth] getSession() error:', err);
        clearTimeout(timeout);
        settle(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!settled) {
        // If onAuthStateChange fires before getSession resolves, use it
        clearTimeout(timeout);
        settle(!!session);
      } else {
        // Normal auth state updates after initial load
        setIsAuthenticated(!!session);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: '#000' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile/edit"
          options={{
            title: 'Profiel bewerken',
            headerBackTitle: 'Terug',
          }}
        />
        <Stack.Screen
          name="profile/membership"
          options={{
            title: 'Lidmaatschap',
            headerBackTitle: 'Terug',
          }}
        />
      </Stack>
    </>
  );
}
