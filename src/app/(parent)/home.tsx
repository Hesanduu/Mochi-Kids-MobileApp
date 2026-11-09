import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ChunkyButton } from '@/components/ChunkyButton';
import { Dots } from '@/components/Dots';
import { FeatureTiles } from '@/components/home/FeatureTiles';
import { SeeImagesBanner } from '@/components/home/SeeImagesBanner';
import { Mochi } from '@/components/Mochi';
import { AgentHomeCard } from '@/components/plan/AgentHomeCard';
import { colors, fonts, radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useChildren } from '@/context/ChildrenContext';

// Phones at least this tall get the bigger welcome card and banner.
const ROOMY_SCREEN_HEIGHT = 840;

// "Good morning" / "Good afternoon" / "Good evening" from the phone's clock.
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { user } = useAuth();
  const { children, selectedChild, loading } = useChildren();
  const [pageHeight, setPageHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const roomy = height >= ROOMY_SCREEN_HEIGHT;
  // Only a family with no child yet sees the "add your child" messages.
  const needsFirstChild = !loading && children.length === 0;
  // Once a child exists, greetings use the child's nickname, never the parent's name.
  const greetingName = loading ? ' ' : (selectedChild?.nickname ?? user?.displayName ?? 'Parent');

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        // Home fits on one screen and doesn't scroll. Only a very small phone or
        // very large system text can't fit it, and then scrolling beats cutting things off.
        scrollEnabled={contentHeight > pageHeight + 1}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}
        onContentSizeChange={(_, newHeight) => setContentHeight(newHeight)}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + (roomy ? 12 : 8) }]}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.name}>{greetingName}</Text>
          </View>

          {/* Yellow welcome card */}
          <View style={[styles.welcomeCard, roomy ? styles.welcomeRoomy : styles.welcomeTight]}>
            <Dots
              dots={[
                { size: 10, color: colors.green, right: 28, top: 14 },
                { size: 8, color: colors.sky, right: 118, bottom: 16 },
              ]}
            />
            <Text style={styles.welcomeTitle}>
              {needsFirstChild ? 'Mochi can\u2019t wait to meet your little one!' : 'Mochi is ready to play!'}
            </Text>
            {roomy || needsFirstChild ? (
              <Text style={styles.welcomeText}>
                {needsFirstChild ? 'Add your child\u2019s profile to start.' : 'Pick an activity to start learning.'}
              </Text>
            ) : null}
            <Mochi size={roomy ? 122 : 90} style={styles.welcomeMochi} />
          </View>
        </View>

        <View style={styles.body}>
          <AgentHomeCard />

          {/* First child only. After that, children are managed in the Profile tab. */}
          {needsFirstChild ? (
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
          ) : null}

          <SeeImagesBanner roomy={roomy} />
          <FeatureTiles />
        </View>
      </ScrollView>
      {/* Stops content running under the clock and battery icons if it ever scrolls. */}
      <View style={[styles.statusBarCover, { height: insets.top }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  statusBarCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.sky,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1, // lets the page fill the screen exactly
  },
  header: {
    backgroundColor: colors.sky,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 24,
    paddingBottom: 14,
    gap: 10,
  },
  greeting: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text, // the softer grey is too faint on this brighter blue
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
  },
  welcomeCard: {
    borderRadius: radius.xxl,
    backgroundColor: colors.yellowSoft,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    paddingLeft: 18,
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  welcomeRoomy: {
    minHeight: 112,
    paddingVertical: 12,
    paddingRight: 124, // room for Mochi on the right
  },
  welcomeTight: {
    minHeight: 80,
    paddingVertical: 10,
    paddingRight: 94,
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
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  emptyCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.sky,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
