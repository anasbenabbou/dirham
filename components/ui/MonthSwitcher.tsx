import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { haptic } from '../../lib/haptics';

/** `month` is "YYYY-MM". Steps backward/forward; forward disabled past current month. */
export function MonthSwitcher({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const t = useTheme();
  const thisMonth = new Date().toISOString().slice(0, 7);

  function shift(delta: number) {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    onChange(d.toISOString().slice(0, 7));
    haptic.select();
  }

  const [y, m] = month.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-MA', { month: 'long', year: 'numeric' });
  const atCurrent = month >= thisMonth;

  const s = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.spacing.lg, paddingVertical: t.spacing.sm },
    btn: { width: 34, height: 34, borderRadius: 17, backgroundColor: t.colors.surface, justifyContent: 'center', alignItems: 'center' },
    label: { ...t.font.label, color: t.colors.text, minWidth: 130, textAlign: 'center', textTransform: 'capitalize' },
  });

  return (
    <View style={s.wrap}>
      <TouchableOpacity style={s.btn} onPress={() => shift(-1)} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={18} color={t.colors.text} />
      </TouchableOpacity>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity style={[s.btn, atCurrent && { opacity: 0.35 }]} disabled={atCurrent} onPress={() => shift(1)} activeOpacity={0.7}>
        <Ionicons name="chevron-forward" size={18} color={t.colors.text} />
      </TouchableOpacity>
    </View>
  );
}
