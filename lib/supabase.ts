import 'react-native-url-polyfill/auto';
   import * as SecureStore from 'expo-secure-store';
   import { createClient } from '@supabase/supabase-js';

   // SecureStore can't hold keys with certain chars or values > 2KB,
   // so we keep it simple. Fine for a demo session token.
   const SecureStoreAdapter = {
     getItem: (key: string) => SecureStore.getItemAsync(key),
     setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
     removeItem: (key: string) => SecureStore.deleteItemAsync(key),
   };

   export const supabase = createClient(
     process.env.EXPO_PUBLIC_SUPABASE_URL!,
     process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
     {
       auth: {
         storage: SecureStoreAdapter,
         autoRefreshToken: true,
         persistSession: true,      // satisfies FR-1.4 (stay logged in)
         detectSessionInUrl: false, // not a web app
       },
     }
   );