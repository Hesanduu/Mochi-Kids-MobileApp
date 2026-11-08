import { Platform, StyleSheet, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius } from '@/constants/theme';

// Builds the tab icon: SF Symbol on iOS, Material Symbol on Android.
function tabIcon(ios: SFSymbol, android: AndroidSymbol) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <SymbolView name={{ ios, android, web: android }} size={24} tintColor={color} />;
  };
}

const BAR_PADDING_TOP = 8;
const TAB_HEIGHT = 58;
const BAR_PADDING_BOTTOM_MIN = 8;
// iPhones report 34px at the bottom, but the home indicator only needs about half.
const IOS_BOTTOM_MAX = 16;

// Bottom tabs for the parent area: Home / Activities / Progress / Profile.
export default function ParentLayout() {
  const insets = useSafeAreaInsets();

  // The tab bar needs an explicit height, or it uses a small default and crops
  // the tabs. Android keeps its full inset so the tabs never sit under the
  // system buttons; iOS can sit closer to the edge.
  const bottomInset = Platform.OS === 'ios' ? Math.min(insets.bottom, IOS_BOTTOM_MAX) : insets.bottom;
  const paddingBottom = Math.max(bottomInset, BAR_PADDING_BOTTOM_MIN);
  const barHeight = BAR_PADDING_TOP + TAB_HEIGHT + paddingBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // The soft blue "pill" behind the active tab
        tabBarActiveBackgroundColor: colors.skySoft,
        tabBarStyle: [styles.bar, { height: barHeight, paddingBottom }],
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: tabIcon('house.fill', 'home') }} />
      <Tabs.Screen
        name="activities"
        options={{ title: 'Activities', tabBarIcon: tabIcon('square.grid.2x2.fill', 'apps') }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: tabIcon('chart.bar.fill', 'bar_chart') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: tabIcon('person.crop.circle.fill', 'account_circle') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    paddingTop: BAR_PADDING_TOP,
    paddingHorizontal: 12, // 4 tabs now, so a little less side padding
  },
  item: {
    height: TAB_HEIGHT,
    borderRadius: radius.md,
    overflow: 'hidden', // clips the blue highlight to the rounded corners
    marginHorizontal: 2,
    paddingVertical: 6,
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
  },
});
