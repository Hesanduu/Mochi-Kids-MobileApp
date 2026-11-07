import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/ActivityCard';
import { colors, fonts } from '@/constants/theme';

// List of things to do with Mochi. More activities will be added here.
export default function ActivitiesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
    >
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Activities</Text>
        <Text style={styles.subtitle}>Fun things to explore with Mochi.</Text>
      </View>

      <ActivityCard
        title="See Images"
        subtitle="Find photos and make pictures"
        icon={{ ios: 'photo.on.rectangle.angled', android: 'photo_library' }}
        onPress={() => router.push('/see-images')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  titleBlock: {
    gap: 2,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
  },
});
