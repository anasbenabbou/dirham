import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Transaction } from '../db/transactions';
import { getCategoryByKey } from '../constants/categories';
import { Colors } from '../constants/colors';
import { useTransactionStore } from '../store/useTransactionStore';

const fmt = (n: number) =>
  n.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });

export default function TransactionItem({ transaction: t }: { transaction: Transaction }) {
  const remove = useTransactionStore(s => s.removeTransaction);
  const cat = getCategoryByKey(t.category);
  const isIncome = t.type === 'income';

  function del() {
    Alert.alert('Supprimer?', `${cat.label} — ${fmt(t.amount)}`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => remove(t.id) },
    ]);
  }

  return (
    <TouchableOpacity style={s.row} onLongPress={del} activeOpacity={0.7}>
      <View style={s.iconWrap}>
        <Text style={s.emoji}>{cat.emoji}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.label} numberOfLines={1}>{cat.label}</Text>
        <Text style={s.date} numberOfLines={1}>{t.date}{t.note ? ` · ${t.note}` : ''}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[s.amount, { color: isIncome ? Colors.success : Colors.danger }]}>
          {isIncome ? '+' : '-'}{fmt(t.amount)}
        </Text>
        <View style={[s.typeBadge, { backgroundColor: isIncome ? Colors.successLight : Colors.dangerLight }]}>
          <Text style={[s.typeTxt, { color: isIncome ? Colors.success : Colors.danger }]}>
            {isIncome ? 'Entrée' : 'Sortie'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, padding: 14, borderRadius: 16, marginBottom: 8,
    shadowColor: '#9098B1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  iconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 22 },
  info: { flex: 1, minWidth: 0 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.text },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  amount: { fontSize: 16, fontWeight: '700', flexShrink: 0 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 },
  typeTxt: { fontSize: 10, fontWeight: '600' },
});
