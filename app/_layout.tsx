import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Slot } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    // Hydrate the auth store from the persisted session on launch. If the
    // stored refresh token is stale/revoked, getSession surfaces an
    // AuthApiError ("Invalid Refresh Token: Refresh Token Not Found") instead
    // of a session — clear it so the app starts clean rather than throwing.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        supabase.auth.signOut();
        setSession(null);
        return;
      }
      setSession(data.session);
    });

    // Keep the store in sync with future auth changes (refresh, sign-out, etc.).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Only auto-refresh tokens while the app is in the foreground; pausing in
    // the background avoids refresh attempts against an expired/stale token.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    supabase.auth.startAutoRefresh();

    return () => {
      sub.subscription.unsubscribe();
      appStateSub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, [setSession]);

  return (
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}
