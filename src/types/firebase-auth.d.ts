// Firebase includes getReactNativePersistence when the app runs on a phone,
// but its default TypeScript types leave it out. This tells TypeScript it exists.
import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
