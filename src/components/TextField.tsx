import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';

type TextFieldProps = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  // Hides the text and shows an eye button to reveal it.
  password?: boolean;
  height?: number;
  // Shown in red under the field.
  error?: string;
};

// A labelled text input. The border turns blue with a soft glow while you type.
export function TextField({ label, password = false, height = 54, error, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      {/* The glow is a slightly larger rounded box behind the input. */}
      <View style={[styles.ring, focused && styles.ringFocused]}>
        <View style={[styles.box, { height }, error ? styles.boxError : null, focused && styles.boxFocused]}>
          <TextInput
            {...inputProps}
            accessibilityLabel={label}
            secureTextEntry={password && hidden}
            placeholderTextColor={colors.border}
            onFocus={(e) => {
              setFocused(true);
              inputProps.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              inputProps.onBlur?.(e);
            }}
            style={styles.input}
          />

          {password && (
            <Pressable
              onPress={() => setHidden((h) => !h)}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
              style={styles.eye}
              hitSlop={4}
            >
              <SymbolView
                name={{
                  ios: hidden ? 'eye' : 'eye.slash',
                  android: hidden ? 'visibility' : 'visibility_off',
                  web: hidden ? 'visibility' : 'visibility_off',
                }}
                size={22}
                tintColor={colors.textMuted}
              />
            </Pressable>
          )}
        </View>
      </View>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const RING = 4; // width of the focus glow

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.text,
  },
  ring: {
    // Negative margin so the glow doesn't push the layout around.
    margin: -RING,
    padding: RING,
    borderRadius: radius.md + RING,
  },
  ringFocused: {
    backgroundColor: colors.focusRing,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingLeft: 16,
    paddingRight: 4,
  },
  boxFocused: {
    borderColor: colors.blue,
  },
  boxError: {
    borderColor: colors.error,
  },
  error: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.error,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.text,
  },
  eye: {
    width: TAP_TARGET,
    height: TAP_TARGET - 2,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
