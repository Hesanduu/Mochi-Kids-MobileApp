import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { hasPassword, logOut } from '@/lib/auth';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Account</Text>

      <View style={styles.card}>
        <View style={[styles.row, styles.rowDivider]}>
          <View style={[styles.iconTile, { backgroundColor: colors.yellowSoft }]}>
            <SymbolView
              name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }}
              size={22}
              tintColor={colors.text}
            />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.caption}>Name</Text>
            <Text style={styles.value}>{user?.displayName ?? 'Parent'}</Text>
          </View>
        </View>

        <View style={[styles.row, styles.rowDivider]}>
          <View style={[styles.iconTile, { backgroundColor: colors.skySoft }]}>
            <SymbolView name={{ ios: 'envelope', android: 'mail', web: 'mail' }} size={20} tintColor={colors.primary} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.caption}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
        </View>

        {user && hasPassword(user) ? (
          <Pressable
            onPress={() => router.push('/change-password')}
            accessibilityRole="button"
            accessibilityLabel="Change password"
            style={styles.row}
          >
            <View style={[styles.iconTile, { backgroundColor: colors.greenSoft }]}>
              <SymbolView name={{ ios: 'lock', android: 'lock', web: 'lock' }} size={20} tintColor={colors.greenDark} />
            </View>
            <Text style={[styles.value, styles.rowText]}>Change password</Text>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={18}
              tintColor={colors.textMuted}
            />
          </Pressable>
        ) : (
          <View style={styles.row}>
            <View style={[styles.iconTile, { backgroundColor: colors.greenSoft }]}>
              <SymbolView name={{ ios: 'lock', android: 'lock', web: 'lock' }} size={20} tintColor={colors.greenDark} />
            </View>
            <Text style={[styles.value, styles.rowText]}>You sign in with Google</Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={logOut}
        accessibilityRole="button"
        accessibilityLabel="Log out"
        style={[styles.card, styles.row]}
      >
        <View style={[styles.iconTile, { backgroundColor: colors.background }]}>
          <SymbolView
            name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
            size={20}
            tintColor={colors.error}
          />
        </View>
        <Text style={[styles.value, styles.rowText, styles.logOut]}>Log out</Text>
      </Pressable>
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
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
  },
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  rowDivider: {
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
  rowText: {
    flex: 1,
  },
  caption: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  value: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.text,
  },
  logOut: {
    color: colors.error,
  },
});
