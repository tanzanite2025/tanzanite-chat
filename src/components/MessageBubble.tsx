import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

type Props = {
  text: string;
  mine?: boolean;
  time?: string;
};

export default function MessageBubble({ text, mine, time }: Props) {
  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.text, mine && { color: colors.text }]}>{text}</Text>
        {!!time && <Text style={styles.time}>{time}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 6, paddingHorizontal: 12 },
  rowMine: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '84%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleMine: { backgroundColor: colors.bubbleMe },
  bubbleOther: { backgroundColor: colors.bubbleOther },
  text: { fontSize: 16, color: colors.text },
  time: { marginTop: 4, fontSize: 11, color: colors.muted, textAlign: 'right' },
});
