// Phone notifications for the weekly report. They need native code that Expo Go
// doesn't include, so the package is only loaded when it can work, the same way
// as Google sign-in. Notifications are a nudge: if anything fails here, the app
// carries on and the report is still waiting in the Plan tab.
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo, requireOptionalNativeModule } from 'expo';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { withTimeout } from '@/lib/children';
import { db } from '@/lib/firebase';

// A build made before this package was added has none of its native code. Loading
// the package there is a fatal error that try/catch can't stop, so check first.
const canUseNotifications = !isRunningInExpoGo() && requireOptionalNativeModule('ExpoPushTokenManager') !== null;

// Remembered so that logging out can remove this phone from the account.
let thisDeviceToken: string | null = null;

const deviceDoc = (uid: string, token: string) => doc(db, 'parents', uid, 'pushDevices', token);

// Registers this phone so the server can send it notifications. `ask` shows the
// phone's permission question. Only do that when a parent has just tapped something.
export async function registerForNotifications(uid: string, { ask }: { ask: boolean }) {
  if (!canUseNotifications) return;
  try {
    const Notifications = await import('expo-notifications');

    // Android needs a channel before it will ask for permission.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Mochi updates',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted && ask && current.canAskAgain) granted = (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await withTimeout(setDoc(deviceDoc(uid, token), { platform: Platform.OS, updatedAt: serverTimestamp() }));
    thisDeviceToken = token;
  } catch {
    // Expected on an iPhone without a paid Apple account, and in an older build.
    if (__DEV__) console.log('Phone notifications are not available in this build.');
  }
}

// Logging out stops this phone getting notifications for that account.
export async function forgetThisDevice(uid: string) {
  if (!thisDeviceToken) return;
  const token = thisDeviceToken;
  thisDeviceToken = null;
  await withTimeout(deleteDoc(deviceDoc(uid, token)), 5_000).catch(() => {});
}

// Used once, at the top of the app. `uid` is null until a parent is logged in.
export function useNotifications(uid: string | null, agentEnabled: boolean) {
  // Keeps this phone registered, without ever asking for permission here.
  useEffect(() => {
    if (uid && agentEnabled) registerForNotifications(uid, { ask: false });
  }, [uid, agentEnabled]);

  // Tapping a notification opens the Plan tab.
  useEffect(() => {
    if (!uid || !canUseNotifications) return;
    let active = true;
    let stopListening: (() => void) | undefined;

    import('expo-notifications')
      .then((Notifications) => {
        if (!active) return;

        // While the app is open the Plan tab updates by itself, so no banner
        // pops up over a child's game.
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: false,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });

        // The app may have been fully closed when the notification was tapped.
        if (Notifications.getLastNotificationResponse()) {
          Notifications.clearLastNotificationResponse();
          router.push('/plan');
        }

        const subscription = Notifications.addNotificationResponseReceivedListener(() => router.push('/plan'));
        stopListening = () => subscription.remove();
      })
      .catch(() => {});

    return () => {
      active = false;
      stopListening?.();
    };
  }, [uid]);
}
