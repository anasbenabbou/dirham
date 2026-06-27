import { View, Text, StyleSheet, Alert } from 'react-native';
import { Transaction } from '../db/transactions';
import { getCategoryByKey } from '../constants/categories';
import { useTransactionStore } from '../store/useTransactionStore';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD } from '../lib/format';
import { Card, CategoryIcon, Badge } from './ui';

export default function TransactionItem({ transaction: t }: { transaction: Transaction }) {
  const theme = useTheme();
  const remove = useTransactionStore(s => s.removeTransaction);
  const cat = getCategoryByKey(t.category);
  const isIncome = t.type === 'income';

  function del() {
    Alert.alert('Supprimer cette transaction ?', `${cat.label} — ${fmtMAD(t.amount)}`, [
      { text: 'Supprimer', style: 'destructive', onPress: () => remove(t.id) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  const s = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm },
    info: { flex: 1, minWidth: 0 },
    label: { ...theme.font.body, fontWeight: '600', color: theme.colors.text },
    date: { ...theme.font.caption, color: theme.colors.textTertiary, marginTop: 2 },
    right: { alignItems: 'flex-end', gap: 4 },
    amount: { fontSize: 16, fontWeight: '700' },
  });

  return (
    <Card onLongPress={del} style={s.row} padded>
      <CategoryIcon category={cat} />
      <View style={s.info}>
        <Text style={s.label} numberOfLines={1}>{cat.label}</Text>
        <Text style={s.date} numberOfLines={1}>{t.date}{t.note ? ` · ${t.note}` : ''}</Text>
      </View>
      <View style={s.right}>
        <Text style={[s.amount, { color: isIncome ? theme.colors.success : theme.colors.text }]}>
          {isIncome ? '+' : '−'}{fmtMAD(t.amount)}
        </Text>
        <Badge tone={isIncome ? 'success' : 'danger'}>{isIncome ? 'Entrée' : 'Sortie'}</Badge>
      </View>
    </Card>
  );
}
