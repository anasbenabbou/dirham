import { useEffect } from 'react';
import { FlatList, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactionStore } from '../../store/useTransactionStore';
import TransactionItem from '../../components/TransactionItem';
import { useUIStore } from '../../store/useUIStore';
import { Colors } from '../../constants/colors';

const fmt = (n: number) =>
  n.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });

export default function TransactionsScreen() {
  const openQuickAdd = useUIStore(s => s.openQuickAdd);
  const { transactions, monthlyTotals, currentMonth, loadMonth } = useTransactionStore();

  useEffect(() => { loadMonth(currentMonth); }, []);

  return (
    <SafeAreaView style={s.container}>
      {/* Summary bar */}
      <View style={s.summary}>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Revenus</Text>
          <Text style={[s.summaryAmt, { color: Colors.success }]}>+{fmt(monthlyTotals.income)}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Dépenses</Text>
          <Text style={[s.summaryAmt, { color: Colors.danger }]}>-{fmt(monthlyTotals.expenses)}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Solde</Text>
          <Text style={[s.summaryAmt, { color: Colors.text }]}>
            {fmt(monthlyTotals.income - monthlyTotals.expenses)}
          </Text>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={t => String(t.id)}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>💸</Text>
            <Text style={s.emptyTitle}>Aucune transaction</Text>
            <Text style={s.emptyTxt}>Appuyez sur + pour enregistrer{'\n'}votre première transaction.</Text>
          </View>
        }
      />

      <TouchableOpacity style={s.fab} onPress={openQuickAdd}>
        <Text style={s.fabTxt}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summary: {
    flexDirection: 'row', backgroundColor: Colors.card, marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#9098B1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  summaryAmt: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  summaryDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  list: { padding: 16, paddingBottom: 110 },
  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyTxt: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute', bottom: 90, right: 20, width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  fabTxt: { color: '#fff', fontSize: 30, lineHeight: 34 },
});
