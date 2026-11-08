import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

// The first route: sends each parent to the right place.
export default function Index() {
  const { user, needsConsent } = useAuth();
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={needsConsent ? '/consent' : '/home'} />;
}
