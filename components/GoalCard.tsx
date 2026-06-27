import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Goal } from '../db/goals';
import { Colors } from '../constants/colors';
import { useGoalsStore } from '../store/useGoalsStore';

const fmt = (n: number) =>
  n.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });

function daysLeft(d: string | null): string | null {
  if (!d) return null;
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  return diff < 0 ? 'Échéance dépassée' : `${diff}j restants`;
}

export default function GoalCard({ goal: g }: { goal: Goal }) {
  const { deposit, removeGoal } = useGoalsStore();
  const [showDeposit, setShowDeposit] = useState(false);
  const [amount, setAmount] = useState('');

  const pct = Math.min(g.current_amount / g.target_amount, 1);
  const remaining = g.target_amount - g.current_amount;

  function handleDeposit() {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) {
      Alert.alert('Montant invalide', 'Entrez un montant positif.'); return;
    }
    deposit(g.id, n);
    setAmount('');
    setShowDeposit(false);
  }

  function onDelete() {
    Alert.alert('Supprimer?', g.name, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeGoal(g.id) },
    ]);
  }

  const progressColor = g.completed ? Colors.success : Colors.primary;

  return (
    <>
      <TouchableOpacity style={[s.card, g.completed && s.completedCard]} onLongPress={onDelete} activeOpacity={0.85}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.titleRow}>
            <Text style={s.icon}>{g.completed ? '✅' : '🎯'}</Text>
            <Text style={s.name} numberOfLines={1}>{g.name}</Text>
          </View>
          {g.target_date && (
            <View style={s.dateBadge}>
              <Text style={s.dateTxt}>{daysLeft(g.target_date)}</Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        <View style={s.trackWrap}>
          <View style={s.track}>
            <View style={[s.fill, { width: `${pct * 100}%` as any, backgroundColor: progressColor }]} />
          </View>
          <Text style={[s.pct, { color: progressColor }]}>{Math.round(pct * 100)}%</Text>
        </View>

        {/* Amounts */}
        <View style={s.amountRow}>
          <View>
            <Text style={s.currentAmt}>{fmt(g.current_amount)}</Text>
            <Text style={s.amtLabel}>sur {fmt(g.target_amount)}</Text>
          </View>
          {!g.completed && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.remaining}>{fmt(remaining)}</Text>
              <Text style={s.amtLabel}>restant</Text>
            </View>
          )}
        </View>

        {/* Deposit button */}
        {!g.completed && (
          <TouchableOpacity style={s.depositBtn} onPress={() => setShowDeposit(true)}>
            <Text style={s.depositTxt}>+ Verser</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Deposit modal — cross-platform (no Alert.prompt) */}
      <Modal visible={showDeposit} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={m.sheet}>
            <Text style={m.title}>Verser dans</Text>
            <Text style={m.goalName}>"{g.name}"</Text>
            <TextInput
              style={m.input}
              placeholder="Montant en MAD"
              placeholderTextColor={Colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={m.row}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => { setAmount(''); setShowDeposit(false); }}>
                <Text style={m.cancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={m.confirmBtn} onPress={handleDeposit}>
                <Text style={m.confirmTxt}>Verser ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 18, marginBottom: 12,
    shadowColor: '#9098B1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
    gap: 14,
  },
  completedCard: { opacity: 0.7 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  icon: { fontSize: 20 },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1, minWidth: 0 },
  dateBadge: { backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  dateTxt: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  trackWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  pct: { fontSize: 13, fontWeight: '700', minWidth: 36, textAlign: 'right' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  currentAmt: { fontSize: 22, fontWeight: '800', color: Colors.text },
  remaining: { fontSize: 18, fontWeight: '700', color: Colors.danger },
  amtLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  depositBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.primary + '40',
  },
  depositTxt: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: Colors.card, borderRadius: 24, padding: 24, gap: 12 },
  title: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  goalName: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, padding: 16,
    fontSize: 24, fontWeight: '700', color: Colors.text, textAlign: 'center',
    backgroundColor: Colors.background,
  },
  row: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelTxt: { color: Colors.textSecondary, fontWeight: '600' },
  confirmBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: 14, padding: 14, alignItems: 'center' },
  confirmTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
