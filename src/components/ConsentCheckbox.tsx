import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { colors, fonts, radius } from '@/constants/theme';

type ConsentCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

// The green parent/guardian consent box on the sign-up screen.
// The whole box is tappable, not just the little square.
export function ConsentCheckbox({ checked, onChange }: ConsentCheckboxProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.box}
    >
      <View style={[styles.square, checked && styles.squareChecked]}>
        {checked && (
          <SymbolView
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={16}
            tintColor={colors.surface}
          />
        )}
      </View>
      <Text style={styles.text}>
        I&apos;m the parent or guardian, and I agree to the <Text style={styles.bold}>Terms</Text> and{' '}
        <Text style={styles.bold}>Privacy Policy</Text>.
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.greenSoft,
    borderWidth: 1.5,
    borderColor: colors.green,
  },
  square: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  bold: {
    fontFamily: fonts.bodyExtraBold,
    color: colors.primary,
  },
});
