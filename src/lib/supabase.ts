import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://ayglatwzquqzrbulwslq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Z2xhdHd6cXVxenJidWx3c2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzcyMTQsImV4cCI6MjA5NDExMzIxNH0.6lqNNJZwPkpOPx2Fuy1j8yITWQAdfrQexMi8fZaafUg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
