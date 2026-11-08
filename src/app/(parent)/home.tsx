import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ActivityCard } from '@/components/ActivityCard';
import { ChunkyButton } from '@/components/ChunkyButton';
import { Dots } from '@/components/Dots';
import { Mochi } from '@/components/Mochi';
import { colors, fonts, radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useChildren } from '@/context/ChildrenContext';

// "Good morning" / "Good afternoon" / "Good evening" from the phone's clock.
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { children, selectedChild, loading } = useChildren();

  // Only a family with no child yet sees the "add your child" messages.
  const needsFirstChild = !loading && children.length === 0;
  // Once a child exists, greetings use the child's nickname, never the parent's name.
  const greetingName = loading ? ' ' : (selectedChild?.nickname ?? user?.displayName ?? 'Parent');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name}>{greetingName}</Text>
        </View>

        {/* Yellow welcome card */}
        <View style={styles.welcomeCard}>
          <Dots
            dots={[
              { size: 10, color: colors.green, right: 28, top: 14 },
              { size: 8, color: colors.sky, right: 118, bottom: 16 },
            ]}
          />
          <Text style={styles.welcomeTitle}>
            {needsFirstChild ? 'Mochi can\u2019t wait to meet your little one!' : 'Mochi is ready to play!'}
          </Text>
          <Text style={styles.welcomeText}>
            {needsFirstChild ? 'Add your child\u2019s profile to start.' : 'Pick an activity to start learning.'}
          </Text>
          <Mochi size={132} style={styles.welcomeMochi} />
        </View>
      </View>

      {/* Activities */}
      <View style={styles.section}>
        <ActivityCard
          title="See Images with Mochi"
          subtitle="Find photos and make pictures"
          icon={{ ios: 'photo.on.rectangle.angled', android: 'photo_library' }}
          onPress={() => router.push('/see-images')}
        />
      </View>

      {/* First child only. After that, children are managed in the Profile tab. */}
      {needsFirstChild ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your children</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No child profiles yet. Only a nickname and age are needed.</Text>
            <ChunkyButton
              label="Add a child"
              variant="fun"
              height={52}
              onPress={() => router.push('/add-child')}
              icon={
                <SymbolView
                  name={{ ios: 'plus', android: 'add', web: 'add' }}
                  size={18}
                  tintColor={colors.text}
                />
              }
            />
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: 20,
    paddingBottom: 24,
  },
  header: {
    backgroundColor: colors.skySoft,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 18,
  },
  greeting: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textMuted,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
  },
  welcomeCard: {
    minHeight: 128,
    borderRadius: radius.xxl,
    backgroundColor: colors.yellowSoft,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    paddingVertical: 18,
    paddingLeft: 18,
    paddingRight: 132, // room for Mochi on the right
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  welcomeTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    lineHeight: 25,
    color: colors.text,
  },
  welcomeText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textMuted,
  },
  welcomeMochi: {
    position: 'absolute',
    right: -2,
    bottom: -6,
  },
  section: {
    paddingHorizontal: 24,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 21,
    lineHeight: 28,
    color: colors.text,
  },
  emptyCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.sky,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 14,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
