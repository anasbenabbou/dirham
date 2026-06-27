import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoalsStore } from '../../store/useGoalsStore';
import GoalCard from '../../components/GoalCard';
import { Colors } from '../../constants/colors';

const fmt = (n: number) =>
  n.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });

export default function GoalsScreen() {
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');
  const { goals, load, addGoal } = useGoalsStore();

  useEffect(() => { load(); }, []);

  const totalSaved   = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTargets = goals.reduce((s, g) => s + g.target_amount, 0);
  const done = goals.filter(g => g.completed).length;

  function handleAdd() {
    const t = parseFloat(target);
    if (!name.trim() || isNaN(t) || t <= 0) {
      Alert.alert('Erreur', 'Entrez un nom et un montant valide.'); return;
    }
    addGoal({ name: name.trim(), target_amount: t, target_date: date.trim() || null });
    setName(''); setTarget(''); setDate('');
    setShowNew(false);
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Summary */}
      {goals.length > 0 && (
        <View style={s.summary}>
          <View style={s.sumItem}>
            <Text style={s.sumAmt}>{fmt(totalSaved)}</Text>
            <Text style={s.sumLabel}>Épargné</Text>
          </View>
          <View style={s.sumDivider} />
          <View style={s.sumItem}>
            <Text style={s.sumAmt}>{fmt(totalTargets)}</Text>
            <Text style={s.sumLabel}>Objectifs</Text>
          </View>
          <View style={s.sumDivider} />
          <View style={s.sumItem}>
            <Text style={[s.sumAmt, { color: Colors.success }]}>{done}</Text>
            <Text style={s.sumLabel}>Complétés</Text>
          </View>
        </View>
      )}

      <FlatList
        data={goals}
        keyExtractor={g => String(g.id)}
        renderItem={({ item }) => <GoalCard goal={item} />}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>🎯</Text>
            <Text style={s.emptyTitle}>Aucun objectif</Text>
            <Text style={s.emptyTxt}>Créez votre premier objectif d'épargne !</Text>
          </View>
        }
      />

      <TouchableOpacity style={s.fab} onPress={() => setShowNew(true)}>
        <Text style={s.fabTxt}>+</Text>
      </TouchableOpacity>

      <Modal visible={showNew} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Nouvel objectif</Text>
            <TouchableOpacity onPress={() => setShowNew(false)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Nom de l'objectif</Text>
            <TextInput style={s.input} placeholder="Vacances, Voiture, MacBook…" placeholderTextColor={Colors.textSecondary} value={name} onChangeText={setName} autoFocus />
          </View>
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Montant cible (MAD)</Text>
            <TextInput style={[s.input, s.bigInput]} placeholder="10 000" placeholderTextColor={Colors.textSecondary} value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
          </View>
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Date cible (optionnel)</Text>
            <TextInput style={s.input} placeholder="2025-12-31" placeholderTextColor={Colors.textSecondary} value={date} onChangeText={setDate} />
          </View>

          <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
            <Text style={s.addBtnTxt}>Créer l'objectif ✓</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
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
  sumItem: { flex: 1, alignItems: 'center' },
  sumAmt: { fontSize: 18, fontWeight: '800', color: Colors.text },
  sumLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  sumDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  list: { padding: 16, paddingBottom: 110 },
  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyTxt: { color: Colors.textSecondary, fontSize: 14 },
  fab: {
    position: 'absolute', bottom: 90, right: 20, width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  fabTxt: { color: '#fff', fontSize: 30, lineHeight: 34 },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  closeBtn: { fontSize: 18, color: Colors.textSecondary, padding: 4 },
  fieldGroup: { paddingHorizontal: 20, paddingTop: 20, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, padding: 14, fontSize: 16, backgroundColor: Colors.card, color: Colors.text },
  bigInput: { fontSize: 24, fontWeight: '700' },
  addBtn: { backgroundColor: Colors.success, margin: 20, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 32 },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
