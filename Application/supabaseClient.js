import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In a real app, you would load these from environment variables
const supabaseUrl = 'https://vsnvcwbltztstvagxdpe.supabase.co';
const supabaseAnonKey = 'sb_publishable_jhGGofItjzp11Gt30cQ-3w_vVGjRaDS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
