import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Holding } from '../db/holdings';
import { StockQuote } from '../api/mansa';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD, fmtPct } from '../lib/format';
import { Card } from './ui';

export default function StockRow({ holding: h, quote }: { holding: Holding; quote: StockQuote | undefined }) {
  const t = useTheme();
  const remove = usePortfolioStore(s => s.removeHolding);
  const price = quote?.price ?? h.buy_price;
  const value = h.shares * price;
  const gainPct = ((price - h.buy_price) / h.buy_price) * 100;
  const positive = value - h.shares * h.buy_price >= 0;
  const tint = positive ? t.colors.success : t.colors.danger;

  function onDelete() {
    Alert.alert('Retirer de la liste ?', quote?.name ?? h.ticker, [
      { text: 'Retirer', style: 'destructive', onPress: () => remove(h.id) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  const s = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, marginBottom: t.spacing.sm },
    badge: { backgroundColor: t.colors.primarySoft, borderRadius: t.radius.md, paddingHorizontal: 10, paddingVertical: 8, minWidth: 58, alignItems: 'center' },
    ticker: { fontWeight: '800', color: t.colors.primary, fontSize: 13 },
    info: { flex: 1, minWidth: 0 },
    name: { ...t.font.body, fontWeight: '600', color: t.colors.text },
    sub: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 3 },
    right: { alignItems: 'flex-end', gap: 4 },
    value: { ...t.font.body, fontWeight: '700', color: t.colors.text },
    gainRow: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: positive ? t.colors.successSoft : t.colors.dangerSoft, borderRadius: t.radius.sm, paddingHorizontal: 6, paddingVertical: 3 },
    gain: { fontSize: 11, fontWeight: '700', color: tint },
  });

  return (
    <Card onLongPress={onDelete} style={s.row} padded>
      <View style={s.badge}><Text style={s.ticker}>{h.ticker.replace('.CS', '')}</Text></View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{quote?.name ?? h.ticker}</Text>
        <Text style={s.sub}>{h.shares} act. × {fmtMAD(price, 2)}</Text>
      </View>
      <View style={s.right}>
        <Text style={s.value}>{fmtMAD(value, 2)}</Text>
        <View style={s.gainRow}>
          <Ionicons name={positive ? 'caret-up' : 'caret-down'} size={10} color={tint} />
          <Text style={s.gain}>{fmtPct(gainPct)}</Text>
        </View>
      </View>
    </Card>
  );
}
