import { useEffect, useMemo } from 'react';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, HeaderIconButton, Card, EmptyState } from '../components/ui';
import TransactionItem from '../components/TransactionItem';
import { useTransactionStore } from '../store/useTransactionStore';
import { useUIStore } from '../store/useUIStore';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD, fmtSigned } from '../lib/format';
import { Transaction } from '../db/transactions';

function dateLabel(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date(iso + 'T00:00:00');
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today) return "Aujourd'hui";
  if (iso === yest) return 'Hier';
  return d.toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function TransactionsScreen() {
  const t = useTheme();
  const openQuickAdd = useUIStore(s => s.openQuickAdd);
  const { transactions, monthlyTotals, currentMonth, loadMonth } = useTransactionStore();

  useEffect(() => { loadMonth(currentMonth); }, []);

  const sections = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    transactions.forEach(tx => { (map[tx.date] ??= []).push(tx); });
    return Object.keys(map).sort((a, b) => (a < b ? 1 : -1)).map(date => ({ title: date, data: map[date] }));
  }, [transactions]);

  const balance = monthlyTotals.income - monthlyTotals.expenses;
  const monthLabel = new Date().toLocaleDateString('fr-MA', { month: 'long', year: 'numeric' });

  const s = StyleSheet.create({
    summary: { flexDirection: 'row', marginTop: t.spacing.sm, marginBottom: t.spacing.xs },
    cell: { flex: 1, alignItems: 'center', gap: 3 },
    cellLabel: { ...t.font.micro, color: t.colors.textTertiary },
    cellVal: { ...t.font.heading },
    divider: { width: 1, backgroundColor: t.colors.border, marginVertical: 4 },
    sectionHeader: { ...t.font.micro, color: t.colors.textTertiary, paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg, paddingBottom: t.spacing.sm, backgroundColor: t.colors.bg },
    list: { paddingHorizontal: t.spacing.lg, paddingBottom: 40 },
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader
        title="Transactions"
        subtitle={monthLabel}
        showBack
        right={<HeaderIconButton icon="add" filled onPress={openQuickAdd} />}
      />

      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <Card style={s.summary as any} padded>
            <View style={s.cell}>
              <Text style={s.cellLabel}>Revenus</Text>
              <Text style={[s.cellVal, { color: t.colors.success }]}>{fmtSigned(monthlyTotals.income)}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.cell}>
              <Text style={s.cellLabel}>Dépenses</Text>
              <Text style={[s.cellVal, { color: t.colors.danger }]}>{fmtSigned(-monthlyTotals.expenses)}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.cell}>
              <Text style={s.cellLabel}>Solde</Text>
              <Text style={[s.cellVal, { color: t.colors.text }]}>{fmtMAD(balance)}</Text>
            </View>
          </Card>
        }
        renderSectionHeader={({ section }) => <Text style={s.sectionHeader}>{dateLabel(section.title)}</Text>}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        contentContainerStyle={s.list}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="receipt-outline" size={30} color={t.colors.textSecondary} />}
            title="Aucune transaction"
            subtitle="Appuyez sur + pour enregistrer votre première transaction ce mois-ci."
          />
        }
      />
    </View>
  );
}
