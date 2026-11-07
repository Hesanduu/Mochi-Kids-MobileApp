import { Redirect } from 'expo-router';

// The app opens on the login screen.
// Later, when we add Firebase, this is where we'll send logged-in parents
// straight to /home instead.
export default function Index() {
  return <Redirect href="/login" />;
}
