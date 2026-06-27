import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Holding } from '../db/holdings';
import { StockQuote } from '../api/mansa';
import { Colors } from '../constants/colors';
import { usePortfolioStore } from '../store/usePortfolioStore';

const fmt = (n: number) =>
  n.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 2 });

export default function StockRow({ holding: h, quote }: { holding: Holding; quote: StockQuote | undefined }) {
  const remove = usePortfolioStore(s => s.removeHolding);
  const price = quote?.price ?? h.buy_price;
  const value = h.shares * price;
  const gain = value - h.shares * h.buy_price;
  const gainPct = ((price - h.buy_price) / h.buy_price) * 100;
  const isPositive = gain >= 0;

  function onDelete() {
    Alert.alert('Retirer de la liste?', `${quote?.name ?? h.ticker}`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: () => remove(h.id) },
    ]);
  }

  return (
    <TouchableOpacity style={s.row} onLongPress={onDelete} activeOpacity={0.75}>
      <View style={s.badge}>
        <Text style={s.ticker}>{h.ticker.replace('.CS', '')}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{quote?.name ?? h.ticker}</Text>
        <Text style={s.sub}>{h.shares} act. × {fmt(price)}</Text>
      </View>
      <View style={s.right}>
        <Text style={s.value}>{fmt(value)}</Text>
        <View style={[s.gainBadge, { backgroundColor: isPositive ? Colors.successLight : Colors.dangerLight }]}>
          <Text style={[s.gain, { color: isPositive ? Colors.success : Colors.danger }]}>
            {isPositive ? '▲' : '▼'} {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 8,
    shadowColor: '#9098B1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  badge: {
    backgroundColor: Colors.primaryLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6,
    minWidth: 56, alignItems: 'center',
  },
  ticker: { fontWeight: '800', color: Colors.primary, fontSize: 12 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.text },
  sub: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  right: { alignItems: 'flex-end', gap: 4 },
  value: { fontSize: 15, fontWeight: '700', color: Colors.text },
  gainBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  gain: { fontSize: 11, fontWeight: '700' },
});
