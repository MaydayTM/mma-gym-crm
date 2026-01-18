import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get from expo-constants (app.config.js) or fallback to process.env
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
  || process.env.EXPO_PUBLIC_SUPABASE_URL
  || 'https://wiuzjpoizxeycrshsuqn.supabase.co';

const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey
  || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  || '';

if (!supabaseAnonKey) {
  console.warn('⚠️ Supabase anon key is missing. Check your .env file and restart Expo with --clear');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
