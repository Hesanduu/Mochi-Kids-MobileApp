import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { ScreenBanner } from '@/components/ScreenBanner';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { TextField } from '@/components/TextField';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';
import { addChild, MAX_NICKNAME_LENGTH, type AgeBand } from '@/lib/children';

const AGE_OPTIONS: { value: AgeBand; label: string }[] = [
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
];

export default function AddChildScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [nickname, setNickname] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand>('3');
  const [nicknameError, setNicknameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  const handleSave = async () => {
    const cleanNickname = nickname.trim();
    setFormError(undefined);
    if (!cleanNickname) {
      setNicknameError('Please enter a nickname.');
      return;
    }
    setNicknameError(undefined);
    if (!user) return;

    setLoading(true);
    try {
      await addChild(user.uid, cleanNickname, ageBand);
      goBack();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenBanner onBack={goBack} backLabel="Go back" />

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Add a child</Text>
          <Text style={styles.subtitle}>Use a nickname, not your child&apos;s full name.</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Nickname"
            placeholder="e.g. Mika"
            value={nickname}
            onChangeText={setNickname}
            error={nicknameError}
            maxLength={MAX_NICKNAME_LENGTH}
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="off"
          />

          <View style={styles.ageBlock}>
            <Text style={styles.label}>Age</Text>
            <SegmentedToggle options={AGE_OPTIONS} value={ageBand} onChange={setAgeBand} />
          </View>

          {formError ? (
            <Text style={styles.formError} accessibilityLiveRegion="polite">
              {formError}
            </Text>
          ) : null}

          <ChunkyButton label="Add child" onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    gap: 16,
    backgroundColor: colors.background,
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
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  form: {
    gap: 14,
  },
  ageBlock: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text,
  },
  formError: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.error,
    textAlign: 'center',
  },
});
