import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { ParentGate } from '@/components/ParentGate';
import { colors, fonts, radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useChildren } from '@/context/ChildrenContext';
import { disableAgent } from '@/lib/agent';
import { errorMessage } from '@/lib/api';
import { hasPassword, logOut } from '@/lib/auth';
import { MAX_CHILDREN } from '@/lib/children';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { children, selectedChild, selectChild, agentEnabled, loading } = useChildren();
  const [gateOpen, setGateOpen] = useState(false);

  // Switching on explains what is shared first. Both directions need a grown-up.
  const handleAgentSwitch = (on: boolean) => {
    if (on) router.push('/agent-consent');
    else setGateOpen(true);
  };

  const switchOff = async () => {
    setGateOpen(false);
    if (!user) return;
    try {
      await disableAgent(user.uid);
    } catch (err) {
      Alert.alert('Could not switch off', errorMessage(err));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Profile</Text>

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

      <Text style={styles.sectionTitle}>Children</Text>

      {children.length > 0 ? (
        <View style={styles.card}>
          {children.map((child, index) => {
            const selected = child.id === selectedChild?.id;
            return (
              <Pressable
                key={child.id}
                onPress={() => selectChild(child.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${child.nickname}, age ${child.ageBand}`}
                style={[styles.row, index < children.length - 1 && styles.rowDivider]}
              >
                <View style={[styles.iconTile, { backgroundColor: colors.yellowSoft }]}>
                  <SymbolView name={{ ios: 'face.smiling', android: 'mood', web: 'mood' }} size={22} tintColor={colors.text} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.value}>{child.nickname}</Text>
                  <Text style={styles.caption}>Age {child.ageBand}</Text>
                </View>
                {selected ? (
                  <SymbolView
                    name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                    size={24}
                    tintColor={colors.primary}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {!loading && children.length < MAX_CHILDREN ? (
        <ChunkyButton
          label="Add a child"
          variant="fun"
          height={52}
          onPress={() => router.push('/add-child')}
          icon={<SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={18} tintColor={colors.text} />}
        />
      ) : null}

      <View style={[styles.card, styles.row]}>
        <View style={[styles.iconTile, { backgroundColor: colors.skySoft }]}>
          <SymbolView
            name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
            size={20}
            tintColor={colors.primary}
          />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.value}>Mochi&apos;s weekly plans</Text>
          <Text style={styles.caption}>{agentEnabled ? 'On' : 'Off'}</Text>
        </View>
        <Switch
          value={agentEnabled}
          onValueChange={handleAgentSwitch}
          trackColor={{ true: colors.primary, false: colors.divider }}
          thumbColor={colors.surface}
          accessibilityLabel="Mochi's weekly plans"
        />
      </View>

      {gateOpen ? <ParentGate onPass={switchOff} onCancel={() => setGateOpen(false)} /> : null}

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
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 21,
    lineHeight: 28,
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
