import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Holding } from '../db/holdings';
import { StockQuote } from '../api/mansa';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD, fmtPct, fmtSigned } from '../lib/format';
import { holdingPrice } from '../lib/finance';
import { Card } from './ui';
import CompanyAvatar from './CompanyAvatar';

export default function StockRow({
  holding: h, quote, taxIfSold = 0, netValue,
}: {
  holding: Holding;
  quote: StockQuote | undefined;
  taxIfSold?: number;
  netValue?: number;
}) {
  const t = useTheme();
  const remove = usePortfolioStore(s => s.removeHolding);
  const price = holdingPrice(h, quote ? { [h.ticker]: quote } : {});
  const value = h.shares * price;
  const afterTaxValue = netValue ?? value - taxIfSold;
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
    info: { flex: 1, minWidth: 0 },
    name: { ...t.font.body, fontWeight: '600', color: t.colors.text },
    sub: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 3 },
    tax: { ...t.font.caption, color: t.colors.textTertiary, marginTop: 2 },
    right: { alignItems: 'flex-end', gap: 4 },
    value: { ...t.font.body, fontWeight: '700', color: t.colors.text },
    gainRow: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: positive ? t.colors.successSoft : t.colors.dangerSoft, borderRadius: t.radius.sm, paddingHorizontal: 6, paddingVertical: 3 },
    gain: { fontSize: 11, fontWeight: '700', color: tint },
  });

  return (
    <Card onPress={() => router.push(`/stock/${h.ticker}`)} onLongPress={onDelete} style={s.row} padded>
      <CompanyAvatar ticker={h.ticker} size={40} />
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{quote?.name ?? h.company_name ?? h.ticker}</Text>
        <Text style={s.sub}>{h.shares} act. × {fmtMAD(price, 2)}</Text>
        {taxIfSold > 0 && <Text style={s.tax}>Net après impôt: {fmtMAD(afterTaxValue)}</Text>}
      </View>
      <View style={s.right}>
        <Text style={s.value}>{fmtMAD(value, 2)}</Text>
        <View style={s.gainRow}>
          <Ionicons name={positive ? 'caret-up' : 'caret-down'} size={10} color={tint} />
          <Text style={s.gain}>{fmtPct(gainPct)}</Text>
        </View>
        {taxIfSold > 0 && <Text style={s.tax}>{fmtSigned(-taxIfSold)}</Text>}
      </View>
    </Card>
  );
}
