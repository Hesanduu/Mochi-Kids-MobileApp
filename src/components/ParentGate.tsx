import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from 'react-native';

import { ChunkyButton } from '@/components/ChunkyButton';
import { TextField } from '@/components/TextField';
import { colors, fonts, radius } from '@/constants/theme';

type ParentGateProps = {
  onPass: () => void;
  onCancel: () => void;
};

function makeQuestion() {
  const pick = () => 3 + Math.floor(Math.random() * 7); // 3 to 9
  return { a: pick(), b: pick() };
}

// A quick sum that a grown-up can answer but a 3-to-5-year-old can't, shown before
// anything that only an adult should do. Show it by rendering it, and remove it
// when finished, so each visit gets a new question.
export function ParentGate({ onPass, onCancel }: ParentGateProps) {
  const [question, setQuestion] = useState(makeQuestion);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

  const check = () => {
    if (answer.trim() !== '' && Number(answer) === question.a * question.b) {
      onPass();
      return;
    }
    setQuestion(makeQuestion());
    setAnswer('');
    setWrong(true);
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title}>For grown-ups</Text>
          <Text style={styles.subtitle}>Please answer this to continue.</Text>
          <TextField
            label={`What is ${question.a} × ${question.b}?`}
            value={answer}
            onChangeText={setAnswer}
            keyboardType="number-pad"
            maxLength={3}
            autoFocus
            error={wrong ? 'That isn’t right. Try this one.' : undefined}
          />
          <ChunkyButton label="Continue" onPress={check} />
          <ChunkyButton label="Cancel" variant="fun" onPress={onCancel} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.overlay,
  },
  card: {
    padding: 22,
    gap: 14,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    lineHeight: 33,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    marginTop: -10,
  },
});
