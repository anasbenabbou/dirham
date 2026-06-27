import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

interface Props {
  value: string;
  onChange: (val: string) => void;
  tint?: string;
}

export default function AmountKeypad({ value, onChange, tint }: Props) {
  const t = useTheme();
  const accent = tint ?? t.colors.text;

  function press(key: string) {
    if (key === '⌫') { onChange(value.length > 1 ? value.slice(0, -1) : '0'); return; }
    if (key === '.' && value.includes('.')) return;
    const [, dec] = value.split('.');
    if (dec !== undefined && dec.length >= 2) return;
    onChange(value === '0' && key !== '.' ? key : value + key);
  }

  const s = StyleSheet.create({
    wrap: { alignItems: 'center', width: '100%' },
    display: { fontSize: 52, fontWeight: '800', color: accent, marginBottom: 4, letterSpacing: -1 },
    cur: { fontSize: 18, color: t.colors.textSecondary, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
    key: { width: '33.33%', height: 66, justifyContent: 'center', alignItems: 'center' },
    kt: { fontSize: 26, color: t.colors.text, fontWeight: '600' },
  });

  return (
    <View style={s.wrap}>
      <Text style={s.display}>{value}<Text style={s.cur}>  MAD</Text></Text>
      <View style={s.grid}>
        {KEYS.map(k => (
          <TouchableOpacity key={k} style={s.key} onPress={() => press(k)} activeOpacity={0.6}>
            {k === '⌫'
              ? <Ionicons name="backspace-outline" size={26} color={t.colors.danger} />
              : <Text style={s.kt}>{k}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
