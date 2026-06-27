import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const KEYS = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function AmountKeypad({ value, onChange }: Props) {
  function press(key: string) {
    if (key === '⌫') { onChange(value.length > 1 ? value.slice(0, -1) : '0'); return; }
    if (key === '.' && value.includes('.')) return;
    const [, dec] = value.split('.');
    if (dec !== undefined && dec.length >= 2) return;
    onChange(value === '0' && key !== '.' ? key : value + key);
  }

  return (
    <View style={s.wrap}>
      <Text style={s.display}>
        {value} <Text style={s.cur}>MAD</Text>
      </Text>
      <View style={s.grid}>
        {KEYS.map(k => (
          <TouchableOpacity key={k} style={s.key} onPress={() => press(k)}>
            <Text style={[s.kt, k === '⌫' && { color: Colors.danger }]}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center' },
  display: { fontSize: 42, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  cur: { fontSize: 18, color: Colors.textSecondary, fontWeight: '400' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 288 },
  key: { width: 96, height: 64, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: Colors.border },
  kt: { fontSize: 22, color: Colors.text, fontWeight: '500' },
});
