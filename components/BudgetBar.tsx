import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryByKey } from '../db/categories';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD } from '../lib/format';
import { Card, CategoryIcon, ProgressBar } from './ui';

interface Props {
  category: string;
  label: string;
  spent: number;
  limit: number;
  accentColor?: string;
  custom?: boolean;
  onPress?: () => void;
}

export default function BudgetBar({ category, label, spent, limit, accentColor, custom, onPress }: Props) {
  const t = useTheme();
  const pct = limit > 0 ? Math.min(spent / limit, 1) : 0;
  const over = pct >= 1;
  const near = pct >= 0.85 && !over;
  const barColor = over ? t.colors.danger : near ? t.colors.warning : (accentColor ?? t.colors.primary);
  const cat = getCategoryByKey(category);

  const s = StyleSheet.create({
    card: { marginBottom: t.spacing.sm, gap: 10 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
    label: { ...t.font.body, fontWeight: '600', color: t.colors.text, flex: 1 },
    amounts: { ...t.font.label },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pctTxt: { ...t.font.caption, color: t.colors.textTertiary },
    warn: { ...t.font.caption, fontWeight: '700' },
    remaining: { ...t.font.caption, color: t.colors.textSecondary },
  });

  return (
    <Card style={s.card} onPress={onPress}>
      <View style={s.topRow}>
        <CategoryIcon category={cat} size={32} />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.label} numberOfLines={1}>{label}</Text>
          {custom && <Ionicons name="create-outline" size={13} color={t.colors.primary} />}
        </View>
        <Text style={s.amounts}>
          <Text style={{ color: over ? t.colors.danger : t.colors.text }}>{fmtMAD(spent)}</Text>
          <Text style={{ color: t.colors.textTertiary }}> / {fmtMAD(limit)}</Text>
        </Text>
      </View>
      <ProgressBar progress={pct} color={barColor} />
      <View style={s.bottomRow}>
        <Text style={s.pctTxt}>{Math.round(pct * 100)}% utilisé</Text>
        {over && <Text style={[s.warn, { color: t.colors.danger }]}>⚠ Limite dépassée</Text>}
        {near && <Text style={[s.warn, { color: t.colors.warning }]}>⚠ Proche de la limite</Text>}
        {!over && !near && limit > 0 && <Text style={s.remaining}>{fmtMAD(limit - spent)} restant</Text>}
      </View>
    </Card>
  );
}
