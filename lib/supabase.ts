import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ltwycjqicwjcjmitakcd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0d3ljanFpY3dqY2ptaXRha2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzIwODMsImV4cCI6MjA4Mjk0ODA4M30.k10vuW8dRFcgJIWZdQg_QZM87_1j8QcoGL0pN5AJ32w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
