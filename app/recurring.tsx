import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, HeaderIconButton, Card, EmptyState, Field, Pill, Button, Sheet, Segmented, CategoryIcon } from '../components/ui';
import { useRecurringStore } from '../store/useRecurringStore';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD } from '../lib/format';
import { usePrivacyMask } from '../lib/usePrivacyMask';
import { getCategoryByKey } from '../db/categories';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { Frequency } from '../db/recurring';
import { haptic } from '../lib/haptics';

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function computeNext(freq: Frequency, anchor: number): string {
  const now = new Date();
  if (freq === 'weekly') {
    const d = new Date(now);
    const delta = (anchor - now.getDay() + 7) % 7 || 7;
    d.setDate(now.getDate() + delta);
    return d.toISOString().slice(0, 10);
  }
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let day = Math.min(anchor, dim);
  let target = new Date(now.getFullYear(), now.getMonth(), day);
  if (target <= now) {
    const nextDim = new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate();
    target = new Date(now.getFullYear(), now.getMonth() + 1, Math.min(anchor, nextDim));
  }
  return target.toISOString().slice(0, 10);
}

export default function RecurringScreen() {
  const t = useTheme();
  const { rules, load, add, toggle, remove } = useRecurringStore();
  const allCats = useCategoriesStore(s => s.categories);

  const { maskMAD } = usePrivacyMask();

  const [show, setShow] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [freq, setFreq] = useState<Frequency>('monthly');
  const [day, setDay] = useState(String(new Date().getDate()));
  const [weekday, setWeekday] = useState(new Date().getDay());
  const [note, setNote] = useState('');

  useEffect(() => { load(); }, []);

  const cats = allCats.filter(c => c.type === type);

  function handleAdd() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Montant invalide'); return; }
    if (!category) { Alert.alert('Choisissez une catégorie'); return; }
    const anchor = freq === 'monthly' ? Math.min(Math.max(parseInt(day) || 1, 1), 31) : weekday;
    add({ amount: amt, category, note, type, frequency: freq, anchor_day: anchor, next_date: computeNext(freq, anchor) });
    haptic.success();
    setShow(false); setAmount(''); setCategory(''); setNote(''); setType('expense'); setFreq('monthly');
  }

  function confirmRemove(id: number, label: string) {
    Alert.alert('Supprimer la règle ?', label, [
      { text: 'Supprimer', style: 'destructive', onPress: () => remove(id) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  const s = StyleSheet.create({
    body: { padding: t.spacing.lg, paddingBottom: 60, gap: t.spacing.md },
    intro: { ...t.font.caption, color: t.colors.textSecondary, lineHeight: 19, marginBottom: t.spacing.xs },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
    info: { flex: 1, minWidth: 0 },
    name: { ...t.font.body, fontWeight: '600', color: t.colors.text },
    meta: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
    amt: { ...t.font.body, fontWeight: '800' },
    form: { gap: t.spacing.lg },
    pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
    label: { ...t.font.micro, color: t.colors.textTertiary, marginBottom: 8 },
    sheetRow: { flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.sm },
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title="Récurrents" subtitle="Salaire, loyer, abonnements" showBack
        right={<HeaderIconButton icon="add" filled onPress={() => setShow(true)} />} />

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.intro}>Les transactions récurrentes sont ajoutées automatiquement à leur échéance, à chaque ouverture de l'app.</Text>
        {rules.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="repeat" size={30} color={t.colors.textSecondary} />}
            title="Aucune règle"
            subtitle="Ajoutez un revenu ou une dépense qui se répète chaque mois ou semaine."
          />
        ) : rules.map(r => {
          const cat = getCategoryByKey(r.category);
          const freqLabel = r.frequency === 'monthly' ? `le ${r.anchor_day} du mois` : `chaque ${WEEKDAYS[r.anchor_day]}`;
          return (
            <Card key={r.id} style={[s.row, { opacity: r.active ? 1 : 0.5 }] as any} onLongPress={() => confirmRemove(r.id, `${cat.label} · ${fmtMAD(r.amount)}`)}>
              <CategoryIcon category={cat} />
              <View style={s.info}>
                <Text style={s.name} numberOfLines={1}>{cat.label}</Text>
                <Text style={s.meta}>{freqLabel} · prochaine : {r.next_date}</Text>
              </View>
              <Text style={[s.amt, { color: r.type === 'income' ? t.colors.success : t.colors.text }]}>
                {r.type === 'income' ? '+' : '−'}{maskMAD(r.amount)}
              </Text>
              <Switch
                value={!!r.active}
                onValueChange={(v) => { haptic.select(); toggle(r.id, v); }}
                trackColor={{ true: t.colors.primary, false: t.colors.border }}
                thumbColor="#fff"
              />
            </Card>
          );
        })}
      </ScrollView>

      <Sheet visible={show} onClose={() => setShow(false)} title="Nouvelle règle récurrente">
        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled" style={{ maxHeight: 460 }}>
          <Segmented value={type} onChange={(v) => { setType(v); setCategory(''); }}
            options={[{ value: 'expense', label: '↓ Dépense' }, { value: 'income', label: '↑ Revenu' }]} />
          <Field label="Montant (MAD)" placeholder="0" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" big />
          <View>
            <Text style={s.label}>Catégorie</Text>
            <View style={s.pillWrap}>
              {cats.map(c => <Pill key={c.key} label={c.label} selected={category === c.key} onPress={() => setCategory(c.key)} />)}
            </View>
          </View>
          <Segmented value={freq} onChange={setFreq}
            options={[{ value: 'monthly', label: 'Mensuel' }, { value: 'weekly', label: 'Hebdo' }]} />
          {freq === 'monthly' ? (
            <Field label="Jour du mois (1–31)" placeholder="1" value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} />
          ) : (
            <View>
              <Text style={s.label}>Jour de la semaine</Text>
              <View style={s.pillWrap}>
                {WEEKDAYS.map((w, i) => <Pill key={w} label={w} selected={weekday === i} onPress={() => setWeekday(i)} />)}
              </View>
            </View>
          )}
          <Field label="Note (optionnel)" placeholder="Ex: Loyer appartement" value={note} onChangeText={setNote} />
          <View style={s.sheetRow}>
            <Button label="Annuler" variant="secondary" onPress={() => setShow(false)} style={{ flex: 1 }} full={false} />
            <Button label="Créer" icon="checkmark" onPress={handleAdd} style={{ flex: 2 }} full={false} />
          </View>
        </ScrollView>
      </Sheet>
    </View>
  );
}
