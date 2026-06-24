import 'react-native-url-polyfill/auto';
   import { LogBox } from 'react-native';
   import AsyncStorage from '@react-native-async-storage/async-storage';
   import { createClient } from '@supabase/supabase-js';

   // On startup, the Supabase client tries to recover any persisted session
   // from AsyncStorage. If a device carries over a stale/revoked refresh
   // token (e.g. restored from another device's backup, or a token revoked
   // server-side), that recovery logs "AuthApiError: Invalid Refresh Token:
   // Refresh Token Not Found" to the console — harmless, since the client
   // still resolves to a null session and app/_layout.tsx's getSession()
   // check signs the stale session out. Silence the noisy log so it doesn't
   // surface as a scary red error screen in Expo Go.
   LogBox.ignoreLogs(['AuthApiError: Invalid Refresh Token']);

   export const supabase = createClient(
     process.env.EXPO_PUBLIC_SUPABASE_URL!,
     process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
     {
       auth: {
         storage: AsyncStorage,
         autoRefreshToken: true,
         persistSession: true,      // satisfies FR-1.4 (stay logged in)
         detectSessionInUrl: false, // not a web app
       },
     }
   );