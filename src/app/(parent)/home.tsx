import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ActivityCard } from '@/components/ActivityCard';
import { ChunkyButton } from '@/components/ChunkyButton';
import { Dots } from '@/components/Dots';
import { Mochi } from '@/components/Mochi';
import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';

// Placeholders until Firebase auth gives us the real parent.
const PARENT_NAME = 'Parent';
const PARENT_EMAIL = 'parent@example.com';

// "Good morning" / "Good afternoon" / "Good evening" from the phone's clock.
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // No auth yet: logging out just returns to the login screen.
  const handleLogout = () => router.replace('/login');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View style={styles.flex}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.name}>{PARENT_NAME}</Text>
          </View>
          <Pressable
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            style={styles.roundButton}
          >
            <SymbolView
              name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
              size={20}
              tintColor={colors.text}
            />
          </Pressable>
        </View>

        {/* Yellow welcome card */}
        <View style={styles.welcomeCard}>
          <Dots
            dots={[
              { size: 10, color: colors.green, right: 28, top: 14 },
              { size: 8, color: colors.sky, right: 118, bottom: 16 },
            ]}
          />
          <Text style={styles.welcomeTitle}>Mochi can&apos;t wait to meet your little one!</Text>
          <Text style={styles.welcomeText}>Add your child&apos;s profile to start.</Text>
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

      {/* Children */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your children</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No child profiles yet. Only a nickname and age are needed.</Text>
          {/* Adding a child is a later feature. */}
          <ChunkyButton
            label="Add a child"
            variant="fun"
            height={52}
            onPress={() => {}}
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

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.accountCard}>
          <View style={[styles.accountRow, styles.accountRowDivider]}>
            <View style={[styles.iconTile, { backgroundColor: colors.skySoft }]}>
              <SymbolView
                name={{ ios: 'envelope', android: 'mail', web: 'mail' }}
                size={20}
                tintColor={colors.primary}
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowCaption}>Signed in as</Text>
              <Text style={styles.rowTitle}>{PARENT_EMAIL}</Text>
            </View>
          </View>

          {/* Change password comes with auth. */}
          <Pressable style={styles.accountRow} accessibilityRole="button">
            <View style={[styles.iconTile, { backgroundColor: colors.greenSoft }]}>
              <SymbolView
                name={{ ios: 'lock', android: 'lock', web: 'lock' }}
                size={20}
                tintColor={colors.greenDark}
              />
            </View>
            <Text style={[styles.rowTitle, styles.flex]}>Change password</Text>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={18}
              tintColor={colors.textMuted}
            />
          </Pressable>
        </View>
      </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  roundButton: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    borderRadius: TAP_TARGET / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
  accountCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  accountRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerSoft,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCaption: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  rowTitle: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.text,
  },
});
