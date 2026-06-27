import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AmountKeypad from './AmountKeypad';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Category } from '../constants/categories';
import { useTransactionStore } from '../store/useTransactionStore';
import { useTheme } from '../theme/ThemeProvider';
import { Segmented, Button, CategoryIcon } from './ui';

interface Props { visible: boolean; onClose: () => void; }
type TxType = 'expense' | 'income';

export default function QuickAdd({ visible, onClose }: Props) {
  const t = useTheme();
  const [step, setStep] = useState<'amount' | 'category'>('amount');
  const [amount, setAmount] = useState('0');
  const [txType, setTxType] = useState<TxType>('expense');
  const addTransaction = useTransactionStore(s => s.addTransaction);

  function close() { setStep('amount'); setAmount('0'); setTxType('expense'); onClose(); }
  function selectCategory(cat: Category) {
    addTransaction({ amount: parseFloat(amount), category: cat.key, note: '', date: new Date().toISOString().slice(0, 10), type: txType });
    close();
  }

  const cats = txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const tint = txType === 'expense' ? t.colors.danger : t.colors.success;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: t.spacing.xl, paddingVertical: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    cancel: { ...t.font.body, color: t.colors.primary, fontWeight: '600' },
    title: { ...t.font.heading, color: t.colors.text },
    body: { flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.xl, gap: t.spacing.xl },
    grid: { flexDirection: 'row', flexWrap: 'wrap', padding: t.spacing.lg, gap: t.spacing.md },
    catItem: { width: '29%', aspectRatio: 0.92, backgroundColor: t.colors.card, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.colors.border, justifyContent: 'center', alignItems: 'center', gap: 8 },
    catLabel: { ...t.font.caption, color: t.colors.textSecondary, textAlign: 'center', paddingHorizontal: 4 },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={close} hitSlop={8}><Text style={s.cancel}>Annuler</Text></TouchableOpacity>
          <Text style={s.title}>{step === 'amount' ? 'Nouveau montant' : 'Catégorie'}</Text>
          <View style={{ width: 56 }} />
        </View>

        {step === 'amount' ? (
          <View style={s.body}>
            <Segmented
              value={txType}
              onChange={setTxType}
              options={[{ value: 'expense', label: '↓ Dépense' }, { value: 'income', label: '↑ Revenu' }]}
            />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <AmountKeypad value={amount} onChange={setAmount} tint={tint} />
            </View>
            <Button
              label="Suivant"
              icon="arrow-forward"
              disabled={parseFloat(amount) <= 0}
              onPress={() => parseFloat(amount) > 0 && setStep('category')}
              style={{ marginBottom: t.spacing.lg }}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity onPress={() => setStep('amount')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.md }}>
              <Ionicons name="chevron-back" size={18} color={t.colors.primary} />
              <Text style={s.cancel}>{parseFloat(amount).toLocaleString('fr-MA')} MAD</Text>
            </TouchableOpacity>
            <ScrollView contentContainerStyle={s.grid}>
              {cats.map(cat => (
                <TouchableOpacity key={cat.key} style={s.catItem} onPress={() => selectCategory(cat)} activeOpacity={0.8}>
                  <CategoryIcon category={cat} size={44} />
                  <Text style={s.catLabel} numberOfLines={1}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}
