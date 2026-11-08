import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';

import { colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Keep the splash screen visible until the fonts and login state are ready,
// so the app never flashes the wrong font or the wrong screen.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  return (
    <AuthProvider>
      <RootNavigator fontsReady={fontsLoaded || fontError !== null} />
    </AuthProvider>
  );
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { user, initializing, needsConsent } = useAuth();
  const ready = fontsReady && !initializing;
  const loggedIn = user !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />

        {/* Stack.Protected only allows its screens when `guard` is true.
            When someone logs in or out, the app moves to the right screens by itself. */}
        <Stack.Protected guard={!loggedIn}>
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/sign-up" />
          <Stack.Screen name="(auth)/forgot-password" />
        </Stack.Protected>

        <Stack.Protected guard={loggedIn && needsConsent}>
          <Stack.Screen name="consent" />
        </Stack.Protected>

        <Stack.Protected guard={loggedIn && !needsConsent}>
          <Stack.Screen name="(parent)" />
          <Stack.Screen name="see-images" />
          <Stack.Screen name="change-password" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
