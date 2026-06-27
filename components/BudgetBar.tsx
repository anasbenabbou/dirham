import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const fmt = (n: number) =>
  n.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });

interface Props {
  label: string;
  emoji: string;
  spent: number;
  limit: number;
  accentColor?: string;
}

export default function BudgetBar({ label, emoji, spent, limit, accentColor = Colors.primary }: Props) {
  const pct = limit > 0 ? Math.min(spent / limit, 1) : 0;
  const barColor = pct >= 1 ? Colors.danger : pct >= 0.85 ? Colors.warning : accentColor;
  const overBudget = pct >= 1;
  const nearLimit = pct >= 0.85 && !overBudget;

  return (
    <View style={s.card}>
      <View style={s.topRow}>
        <View style={s.labelRow}>
          <Text style={s.emoji}>{emoji}</Text>
          <Text style={s.label}>{label}</Text>
        </View>
        <Text style={s.amounts}>
          <Text style={{ color: overBudget ? Colors.danger : Colors.text }}>{fmt(spent)}</Text>
          <Text style={{ color: Colors.textSecondary }}> / {fmt(limit)}</Text>
        </Text>
      </View>

      <View style={s.track}>
        <View style={[s.fill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
      </View>

      <View style={s.bottomRow}>
        <Text style={s.pctTxt}>{Math.round(pct * 100)}% utilisé</Text>
        {overBudget && <Text style={[s.warn, { color: Colors.danger }]}>⚠ Limite dépassée</Text>}
        {nearLimit && <Text style={[s.warn, { color: Colors.warning }]}>⚠ Proche de la limite</Text>}
        {!overBudget && !nearLimit && limit > 0 && (
          <Text style={s.remaining}>{fmt(limit - spent)} restant</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 8, gap: 10,
    shadowColor: '#9098B1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emoji: { fontSize: 18 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text },
  amounts: { fontSize: 13, fontWeight: '600' },
  track: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pctTxt: { fontSize: 11, color: Colors.textSecondary },
  warn: { fontSize: 11, fontWeight: '700' },
  remaining: { fontSize: 11, color: Colors.textSecondary },
});
