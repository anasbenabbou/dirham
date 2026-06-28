import { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { AppHeader, Card, SectionLabel, Bars, CategoryIcon, EmptyState } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import TransactionItem from '../../components/TransactionItem';
import { useTheme } from '../../theme/ThemeProvider';
import { fmtMAD } from '../../lib/format';
import { getTransactionsByCategory, Transaction } from '../../db/transactions';
import { getCategoryByKey } from '../../db/categories';

const monthShort = (m: string) => new Date(m + '-01T00:00:00').toLocaleDateString('fr-MA', { month: 'short' });

export default function CategoryScreen() {
  const t = useTheme();
  const { key } = useLocalSearchParams<{ key: string }>();
  const cat = getCategoryByKey(key);
  const W = Dimensions.get('window').width - 32 - 36;
  const [txs, setTxs] = useState<Transaction[]>([]);

  useFocusEffect(useCallback(() => { setTxs(getTransactionsByCategory(key)); }, [key]));

  const total = txs.reduce((s, x) => s + x.amount, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTotal = txs.filter(x => x.date.startsWith(thisMonth)).reduce((s, x) => s + x.amount, 0);

  const trend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const m = d.toISOString().slice(0, 7);
      return { value: txs.filter(x => x.date.startsWith(m)).reduce((s, x) => s + x.amount, 0), label: monthShort(m), color: cat.color };
    });
  }, [txs, cat.color]);

  const s = StyleSheet.create({
    body: { padding: t.spacing.lg, paddingBottom: 60, gap: t.spacing.md },
    head: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
    headInfo: { flex: 1 },
    total: { fontSize: 26, fontWeight: '800', color: t.colors.text },
    sub: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title={cat.label} showBack />
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={s.head}>
            <CategoryIcon category={cat} size={52} />
            <View style={s.headInfo}>
              <Text style={s.total}>{fmtMAD(total)}</Text>
              <Text style={s.sub}>{txs.length} transaction{txs.length > 1 ? 's' : ''} · {fmtMAD(monthTotal)} ce mois</Text>
            </View>
          </View>
        </Card>

        <Card>
          <SectionLabel>6 derniers mois</SectionLabel>
          <Bars width={W} data={trend} />
        </Card>

        <SectionLabel style={{ marginTop: t.spacing.xs, marginBottom: 0 }}>Transactions</SectionLabel>
        {txs.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="receipt-outline" size={28} color={t.colors.textSecondary} />}
            title="Aucune transaction"
          />
        ) : txs.map(x => <TransactionItem key={x.id} transaction={x} />)}
      </ScrollView>
    </View>
  );
}
