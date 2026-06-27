import { useState } from 'react';
import { View, Text, Modal, TextInput, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../db/transactions';
import { getCategoryByKey, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import { useTransactionStore } from '../store/useTransactionStore';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD } from '../lib/format';
import { Card, CategoryIcon, Badge } from './ui';

type TxType = 'income' | 'expense';

export default function TransactionItem({ transaction: tx }: { transaction: Transaction }) {
  const theme = useTheme();
  const { editTransaction, removeTransaction } = useTransactionStore();
  const [showEdit, setShowEdit] = useState(false);

  // Edit form state
  const [amount, setAmount]   = useState('');
  const [note, setNote]       = useState('');
  const [date, setDate]       = useState('');
  const [type, setType]       = useState<TxType>('expense');
  const [category, setCategory] = useState('');

  const cat = getCategoryByKey(tx.category);
  const isIncome = tx.type === 'income';

  function openEdit() {
    setAmount(String(tx.amount));
    setNote(tx.note ?? '');
    setDate(tx.date);
    setType(tx.type);
    setCategory(tx.category);
    setShowEdit(true);
  }

  function handleSave() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Montant invalide'); return; }
    editTransaction({ id: tx.id, amount: amt, category, note, date, type });
    setShowEdit(false);
  }

  function handleDelete() {
    Alert.alert('Supprimer ?', `${cat.label} — ${fmtMAD(tx.amount)}`, [
      { text: 'Supprimer', style: 'destructive', onPress: () => removeTransaction(tx.id) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  const cats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const s = StyleSheet.create({
    row:    { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm },
    info:   { flex: 1, minWidth: 0 },
    label:  { ...theme.font.body, fontWeight: '600', color: theme.colors.text },
    date:   { ...theme.font.caption, color: theme.colors.textTertiary, marginTop: 2 },
    right:  { alignItems: 'flex-end', gap: 4 },
    amount: { fontSize: 16, fontWeight: '700' },

    // Edit modal
    modal:      { flex: 1, backgroundColor: theme.colors.bg },
    header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerTitle:{ fontSize: 17, fontWeight: '700', color: theme.colors.text },
    cancel:     { fontSize: 15, color: theme.colors.textSecondary },
    save:       { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
    body:       { padding: 20, gap: 20 },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
    input:      { backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, fontSize: 16, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
    amtInput:   { fontSize: 28, fontWeight: '800' },
    toggle:     { flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: 14, padding: 4, gap: 0 },
    toggleBtn:  { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
    toggleTxt:  { fontSize: 14, fontWeight: '600' },
    catGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catBtn:     { width: '30%', aspectRatio: 1, backgroundColor: theme.colors.card, borderRadius: 14, justifyContent: 'center', alignItems: 'center', gap: 4, borderWidth: 1.5 },
    catLabel:   { fontSize: 10, color: theme.colors.textSecondary, textAlign: 'center' },
    deleteBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, margin: 20, marginTop: 8, borderRadius: 16, backgroundColor: theme.colors.dangerSoft },
    deleteTxt:  { color: theme.colors.danger, fontWeight: '700', fontSize: 15 },
  });

  return (
    <>
      <Card onPress={openEdit} onLongPress={handleDelete} style={s.row} padded>
        <CategoryIcon category={cat} />
        <View style={s.info}>
          <Text style={s.label} numberOfLines={1}>{cat.label}</Text>
          <Text style={s.date} numberOfLines={1}>{tx.date}{tx.note ? ` · ${tx.note}` : ''}</Text>
        </View>
        <View style={s.right}>
          <Text style={[s.amount, { color: isIncome ? theme.colors.success : theme.colors.text }]}>
            {isIncome ? '+' : '−'}{fmtMAD(tx.amount)}
          </Text>
          <Badge tone={isIncome ? 'success' : 'danger'}>{isIncome ? 'Entrée' : 'Sortie'}</Badge>
        </View>
      </Card>

      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEdit(false)}>
        <SafeAreaView style={s.modal}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setShowEdit(false)}><Text style={s.cancel}>Annuler</Text></TouchableOpacity>
            <Text style={s.headerTitle}>Modifier</Text>
            <TouchableOpacity onPress={handleSave}><Text style={s.save}>Sauvegarder</Text></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            {/* Amount */}
            <View>
              <Text style={s.fieldLabel}>Montant (MAD)</Text>
              <TextInput style={[s.input, s.amtInput]} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={theme.colors.textTertiary} autoFocus />
            </View>

            {/* Type toggle */}
            <View>
              <Text style={s.fieldLabel}>Type</Text>
              <View style={s.toggle}>
                {(['expense', 'income'] as TxType[]).map(tp => {
                  const on = type === tp;
                  const color = tp === 'income' ? theme.colors.success : theme.colors.danger;
                  return (
                    <TouchableOpacity key={tp} style={[s.toggleBtn, on && { backgroundColor: tp === 'income' ? theme.colors.successSoft : theme.colors.dangerSoft }]} onPress={() => { setType(tp); setCategory(''); }}>
                      <Text style={[s.toggleTxt, { color: on ? color : theme.colors.textSecondary }]}>
                        {tp === 'expense' ? '↓ Dépense' : '↑ Revenu'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Category */}
            <View>
              <Text style={s.fieldLabel}>Catégorie</Text>
              <View style={s.catGrid}>
                {cats.map(c => {
                  const on = category === c.key;
                  return (
                    <TouchableOpacity key={c.key} style={[s.catBtn, { borderColor: on ? theme.colors.primary : theme.colors.border, backgroundColor: on ? theme.colors.primarySoft : theme.colors.card }]} onPress={() => setCategory(c.key)}>
                      <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                      <Text style={[s.catLabel, on && { color: theme.colors.primary }]} numberOfLines={1}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Note */}
            <View>
              <Text style={s.fieldLabel}>Note (optionnel)</Text>
              <TextInput style={s.input} value={note} onChangeText={setNote} placeholder="Ex: déjeuner avec collègues" placeholderTextColor={theme.colors.textTertiary} />
            </View>

            {/* Date */}
            <View>
              <Text style={s.fieldLabel}>Date</Text>
              <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textTertiary} />
            </View>

            {/* Delete */}
            <TouchableOpacity style={s.deleteBtn} onPress={() => { setShowEdit(false); setTimeout(handleDelete, 300); }}>
              <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
              <Text style={s.deleteTxt}>Supprimer cette transaction</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
