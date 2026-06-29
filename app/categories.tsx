import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, HeaderIconButton, Card, SectionLabel, Field, Button, Sheet, Segmented, CategoryIcon } from '../components/ui';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { Category, CategoryType, BudgetGroup, CATEGORY_ICONS, CATEGORY_COLORS, IconName } from '../constants/categories';
import { BUDGET_SECTIONS, BUDGET_ORDER, DEFAULT_PCT, BudgetType } from '../constants/budget';
import { useTheme } from '../theme/ThemeProvider';
import { haptic } from '../lib/haptics';

export default function CategoriesScreen() {
  const t = useTheme();
  const { categories, load, add, update, remove } = useCategoriesStore();

  const [editing, setEditing] = useState<Category | null>(null); // null = closed
  const [isNew, setIsNew] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [icon, setIcon] = useState<IconName>(CATEGORY_ICONS[0]);
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [budget, setBudget] = useState<BudgetGroup>('needs');

  useEffect(() => { load(); }, []);

  function openNew() {
    setIsNew(true);
    setEditing({ key: '', label: '', icon: CATEGORY_ICONS[0], color: CATEGORY_COLORS[0], type: 'expense' });
    setLabel(''); setType('expense'); setIcon(CATEGORY_ICONS[0]); setColor(CATEGORY_COLORS[0]); setBudget('needs');
  }
  function openEdit(c: Category) {
    setIsNew(false); setEditing(c);
    setLabel(c.label); setType(c.type); setIcon(c.icon); setColor(c.color); setBudget(c.budget ?? 'needs');
  }
  function save() {
    if (!label.trim()) { Alert.alert('Nom requis'); return; }
    const maxSort = categories.reduce((m, c) => Math.max(m, c.sort ?? 0), 0);
    const cat: Category = {
      key: isNew ? `cat_${Date.now().toString(36)}` : editing!.key,
      label: label.trim(), icon, color, type,
      budget: type === 'expense' ? budget : undefined,
      sort: isNew ? maxSort + 1 : editing!.sort,
    };
    isNew ? add(cat) : update(cat);
    haptic.success();
    setEditing(null);
  }
  function confirmRemove(c: Category) {
    Alert.alert('Supprimer la catégorie ?', `« ${c.label} » — les transactions déjà enregistrées sont conservées.`, [
      { text: 'Supprimer', style: 'destructive', onPress: () => remove(c.key) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  const expense = categories.filter(c => c.type === 'expense');
  const income = categories.filter(c => c.type === 'income');

  const s = StyleSheet.create({
    body: { padding: t.spacing.lg, paddingBottom: 60, gap: t.spacing.lg },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 10 },
    rowDivider: { borderTopWidth: 1, borderTopColor: t.colors.border },
    label: { ...t.font.body, fontWeight: '600', color: t.colors.text, flex: 1 },
    del: { width: 34, height: 34, borderRadius: 17, backgroundColor: t.colors.dangerSoft, justifyContent: 'center', alignItems: 'center' },
    formLabel: { ...t.font.micro, color: t.colors.textTertiary, marginBottom: 8, marginTop: t.spacing.lg },
    budgetRow: { flexDirection: 'row', gap: t.spacing.sm },
    budgetPill: { flex: 1, paddingVertical: 10, borderRadius: t.radius.md, alignItems: 'center', gap: 1, backgroundColor: t.colors.surface, borderWidth: 1.5, borderColor: t.colors.border },
    budgetTxt: { ...t.font.caption, fontWeight: '700' },
    budgetPct: { fontSize: 10, fontWeight: '600' },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
    iconTile: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: t.colors.border, backgroundColor: t.colors.surface },
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
    colorDot: { width: 38, height: 38, borderRadius: 19 },
    colorOn: { borderWidth: 3, borderColor: t.colors.text },
    preview: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, padding: t.spacing.md, backgroundColor: t.colors.surface, borderRadius: t.radius.md, marginTop: t.spacing.md },
    sheetRow: { flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.lg },
  });

  const previewCat: Category = { key: 'preview', label: label || 'Nouvelle catégorie', icon, color, type };

  const Group = ({ title, list }: { title: string; list: Category[] }) => (
    <Card>
      <SectionLabel>{title}</SectionLabel>
      {list.length === 0 ? (
        <Text style={{ ...t.font.caption, color: t.colors.textTertiary, paddingVertical: 6 }}>Aucune catégorie.</Text>
      ) : list.map((c, i) => (
        <View key={c.key} style={[s.row, i > 0 && s.rowDivider]}>
          <CategoryIcon category={c} size={38} />
          <TouchableOpacity style={{ flex: 1 }} onPress={() => openEdit(c)}>
            <Text style={s.label}>{c.label}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.del} onPress={() => confirmRemove(c)}>
            <Ionicons name="trash-outline" size={16} color={t.colors.danger} />
          </TouchableOpacity>
        </View>
      ))}
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title="Catégories" showBack right={<HeaderIconButton icon="add" filled onPress={openNew} />} />
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Group title="Dépenses" list={expense} />
        <Group title="Revenus" list={income} />
      </ScrollView>

      <Sheet visible={editing !== null} onClose={() => setEditing(null)} title={isNew ? 'Nouvelle catégorie' : 'Modifier la catégorie'}>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
          <Segmented value={type} onChange={setType}
            options={[{ value: 'expense', label: '↓ Dépense' }, { value: 'income', label: '↑ Revenu' }]} />

          <View style={{ marginTop: t.spacing.lg }}>
            <Field label="Nom" placeholder="Ex: Café, Loyer, Prime…" value={label} onChangeText={setLabel} autoFocus />
          </View>

          {type === 'expense' && (
            <>
              <Text style={s.formLabel}>Section budgétaire (40 / 20 / 40)</Text>
              <View style={s.budgetRow}>
                {BUDGET_ORDER.map(g => {
                  const on = budget === g;
                  return (
                    <TouchableOpacity key={g} style={[s.budgetPill, on && { backgroundColor: t.colors.primary, borderColor: t.colors.primary }]} onPress={() => setBudget(g)}>
                      <Text style={[s.budgetTxt, { color: on ? t.colors.onPrimary : t.colors.textSecondary }]}>{BUDGET_SECTIONS[g].label}</Text>
                      <Text style={[s.budgetPct, { color: on ? t.colors.onPrimary : t.colors.textTertiary }]}>{DEFAULT_PCT[g as BudgetType]}%</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <Text style={s.formLabel}>Icône</Text>
          <View style={s.iconGrid}>
            {CATEGORY_ICONS.map(ic => {
              const on = icon === ic;
              return (
                <TouchableOpacity key={ic} style={[s.iconTile, on && { borderColor: color, backgroundColor: color + '22' }]} onPress={() => setIcon(ic)}>
                  <Ionicons name={ic} size={22} color={on ? color : t.colors.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={s.formLabel}>Couleur</Text>
          <View style={s.colorRow}>
            {CATEGORY_COLORS.map(c => (
              <TouchableOpacity key={c} style={[s.colorDot, { backgroundColor: c }, color === c && s.colorOn]} onPress={() => setColor(c)} />
            ))}
          </View>

          <View style={s.preview}>
            <CategoryIcon category={previewCat} size={40} />
            <Text style={s.label}>{previewCat.label}</Text>
          </View>
        </ScrollView>

        <View style={s.sheetRow}>
          <Button label="Annuler" variant="secondary" onPress={() => setEditing(null)} style={{ flex: 1 }} full={false} />
          <Button label={isNew ? 'Créer' : 'Enregistrer'} icon="checkmark" onPress={save} style={{ flex: 2 }} full={false} />
        </View>
      </Sheet>
    </View>
  );
}
