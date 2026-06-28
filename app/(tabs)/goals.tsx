import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGoalsStore } from '../../store/useGoalsStore';
import GoalCard from '../../components/GoalCard';
import { useTheme } from '../../theme/ThemeProvider';
import { fmtMAD } from '../../lib/format';
import { AppHeader, HeaderIconButton, Card, EmptyState, Field, Button, Sheet } from '../../components/ui';

export default function GoalsScreen() {
  const t = useTheme();
  const { goals, load, addGoal } = useGoalsStore();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => { load(); }, []);

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTargets = goals.reduce((s, g) => s + g.target_amount, 0);
  const done = goals.filter(g => g.completed).length;

  function handleAdd() {
    const tg = parseFloat(target);
    if (!name.trim() || isNaN(tg) || tg <= 0) { Alert.alert('Erreur', 'Entrez un nom et un montant valide.'); return; }
    addGoal({ name: name.trim(), target_amount: tg, target_date: date.trim() || null });
    setName(''); setTarget(''); setDate(''); setShowNew(false);
  }

  const s = StyleSheet.create({
    summary: { flexDirection: 'row', alignItems: 'center', marginBottom: t.spacing.xs },
    item: { flex: 1, alignItems: 'center', gap: 3 },
    amt: { fontSize: 17, fontWeight: '800', color: t.colors.text },
    label: { ...t.font.micro, color: t.colors.textTertiary },
    divider: { width: 1, height: 34, backgroundColor: t.colors.border },
    list: { padding: t.spacing.lg, paddingBottom: 120, gap: t.spacing.md },
    sheetRow: { flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.lg },
    form: { gap: t.spacing.lg },
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title="Objectifs" large right={<HeaderIconButton icon="add" filled onPress={() => setShowNew(true)} />} />

      <FlatList
        data={goals}
        keyExtractor={g => String(g.id)}
        renderItem={({ item }) => <GoalCard goal={item} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
        ListHeaderComponent={
          goals.length > 0 ? (
            <Card style={s.summary as any}>
              <View style={s.item}>
                <Text style={s.amt}>{fmtMAD(totalSaved)}</Text>
                <Text style={s.label}>Épargné</Text>
              </View>
              <View style={s.divider} />
              <View style={s.item}>
                <Text style={s.amt}>{fmtMAD(totalTargets)}</Text>
                <Text style={s.label}>Objectifs</Text>
              </View>
              <View style={s.divider} />
              <View style={s.item}>
                <Text style={[s.amt, { color: t.colors.success }]}>{done}</Text>
                <Text style={s.label}>Complétés</Text>
              </View>
            </Card>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="flag-outline" size={30} color={t.colors.textSecondary} />}
            title="Aucun objectif"
            subtitle="Créez votre premier objectif d'épargne avec le bouton +."
          />
        }
      />

      <Sheet visible={showNew} onClose={() => setShowNew(false)} title="Nouvel objectif">
        <View style={s.form}>
          <Field label="Nom de l'objectif" placeholder="Vacances, Voiture, MacBook…" value={name} onChangeText={setName} autoFocus />
          <Field label="Montant cible (MAD)" placeholder="10 000" value={target} onChangeText={setTarget} keyboardType="decimal-pad" big />
          <Field label="Date cible (optionnel)" placeholder="2026-12-31" value={date} onChangeText={setDate} />
        </View>
        <View style={s.sheetRow}>
          <Button label="Annuler" variant="secondary" onPress={() => setShowNew(false)} style={{ flex: 1 }} full={false} />
          <Button label="Créer" icon="checkmark" onPress={handleAdd} style={{ flex: 2 }} full={false} />
        </View>
      </Sheet>
    </View>
  );
}
