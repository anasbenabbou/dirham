import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import AmountKeypad from './AmountKeypad';
import { Colors } from '../constants/colors';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Category } from '../constants/categories';
import { useTransactionStore } from '../store/useTransactionStore';

interface Props { visible: boolean; onClose: () => void; }
type TxType = 'expense' | 'income';

export default function QuickAdd({ visible, onClose }: Props) {
  const [step, setStep] = useState<'amount' | 'category'>('amount');
  const [amount, setAmount] = useState('0');
  const [txType, setTxType] = useState<TxType>('expense');
  const addTransaction = useTransactionStore(s => s.addTransaction);

  function close() { setStep('amount'); setAmount('0'); setTxType('expense'); onClose(); }

  function selectCategory(cat: Category) {
    addTransaction({
      amount: parseFloat(amount),
      category: cat.key,
      note: '',
      date: new Date().toISOString().slice(0, 10),
      type: txType,
    });
    close();
  }

  const cats = txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={close}><Text style={s.cancel}>Annuler</Text></TouchableOpacity>
          <Text style={s.title}>{step === 'amount' ? 'Montant' : 'Catégorie'}</Text>
          <View style={{ width: 64 }} />
        </View>

        {step === 'amount' ? (
          <View style={s.body}>
            <View style={s.toggle}>
              {(['expense', 'income'] as TxType[]).map(t => (
                <TouchableOpacity key={t} style={[s.tBtn, txType === t && s.tBtnOn]} onPress={() => setTxType(t)}>
                  <Text style={[s.tBtnTxt, txType === t && s.tBtnTxtOn]}>
                    {t === 'expense' ? '💸 Dépense' : '💰 Revenu'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <AmountKeypad value={amount} onChange={setAmount} />
            <TouchableOpacity
              style={[s.next, parseFloat(amount) <= 0 && { opacity: 0.4 }]}
              onPress={() => parseFloat(amount) > 0 && setStep('category')}
            >
              <Text style={s.nextTxt}>Suivant →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.grid}>
            {cats.map(cat => (
              <TouchableOpacity key={cat.key} style={s.catItem} onPress={() => selectCategory(cat)}>
                <Text style={s.catEmoji}>{cat.emoji}</Text>
                <Text style={s.catLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cancel: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  body: { flex: 1, alignItems: 'center', paddingTop: 32, gap: 28 },
  toggle: {
    flexDirection: 'row', gap: 0, backgroundColor: Colors.border, borderRadius: 14, padding: 4,
  },
  tBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tBtnOn: { backgroundColor: Colors.card, shadowColor: '#9098B1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tBtnTxt: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },
  tBtnTxtOn: { color: Colors.text },
  next: {
    backgroundColor: Colors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  nextTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 10 },
  catItem: {
    width: '28%', aspectRatio: 1, backgroundColor: Colors.card, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', gap: 4,
    shadowColor: '#9098B1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  catEmoji: { fontSize: 26 },
  catLabel: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', fontWeight: '500' },
});
