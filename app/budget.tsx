import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { AppHeader, Card, SectionLabel, Sheet, Field, Button, ProgressBar, CategoryIcon } from '../components/ui';
import { useBudgetStore } from '../store/useBudgetStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { BUDGET_SECTIONS, BUDGET_ORDER, BudgetType } from '../constants/budget';
import { getCategoryByKey } from '../db/categories';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD } from '../lib/format';
import { haptic } from '../lib/haptics';

export default function BudgetScreen() {
  const t = useTheme();
  const { budgets, loadMonth, currentMonth, setBudget } = useBudgetStore();
  const { byCategory, monthlyTotals } = useTransactionStore();
  const categories = useCategoriesStore(s => s.categories);
  const loadCats = useCategoriesStore(s => s.load);

  const [editCat, setEditCat] = useState<string | null>(null);
  const [limitVal, setLimitVal] = useState('');

  useEffect(() => { loadMonth(currentMonth); loadCats(); }, []);

  const budgetMap = Object.fromEntries(budgets.map(b => [b.category, b.monthly_limit]));
  const income = monthlyTotals.income;

  const SECTION_COLOR: Record<BudgetType, string> = {
    needs: t.colors.primary, wants: t.colors.gold, savings: t.colors.success,
  };

  const expenseCats = categories.filter(c => c.type === 'expense');
  const unclassified = expenseCats.filter(c => !c.budget && (byCategory[c.key] ?? 0) > 0);

  function openEdit(key: string) { setEditCat(key); setLimitVal(budgetMap[key] ? String(Math.round(budgetMap[key])) : ''); }
  function saveLimit() {
    if (!editCat) return;
    const v = parseFloat(limitVal);
    setBudget(editCat, isNaN(v) ? 0 : v, currentMonth);
    haptic.success();
    setEditCat(null);
  }

  const s = StyleSheet.create({
    body: { padding: t.spacing.lg, gap: t.spacing.lg, paddingBottom: 40 },
    heroLabel: { ...t.font.micro, color: t.colors.textTertiary },
    heroAmt: { ...t.font.display, color: t.colors.text },
    pillRow: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.md },
    pill: { flex: 1, borderRadius: t.radius.md, paddingVertical: 10, alignItems: 'center', gap: 2 },
    pillPct: { fontSize: 15, fontWeight: '800' },
    pillAmt: { fontSize: 11, fontWeight: '600' },
    secHead: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.sm },
    secBadge: { borderRadius: t.radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
    secBadgeTxt: { fontSize: 12, fontWeight: '800' },
    secTitle: { flex: 1, ...t.font.label, color: t.colors.text },
    secTotal: { ...t.font.caption, color: t.colors.textSecondary },
    catRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.colors.border },
    catLabel: { ...t.font.body, color: t.colors.text },
    catSub: { ...t.font.caption, color: t.colors.textTertiary, marginTop: 1 },
    catSpent: { ...t.font.label },
    hint: { ...t.font.caption, color: t.colors.textTertiary, paddingVertical: 8 },
  });

  const RULE_DESC: Record<BudgetType, string> = {
    needs: 'Besoins essentiels', wants: 'Envies & loisirs', savings: 'Épargne & investissement',
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title="Budget 40 / 20 / 40" showBack />
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        <Card>
          <Text style={s.heroLabel}>Revenus du mois</Text>
          <Text style={s.heroAmt}>{fmtMAD(income)}</Text>
          <View style={s.pillRow}>
            {BUDGET_ORDER.map(sec => {
              const { pct } = BUDGET_SECTIONS[sec];
              return (
                <View key={sec} style={[s.pill, { backgroundColor: SECTION_COLOR[sec] + '22' }]}>
                  <Text style={[s.pillPct, { color: SECTION_COLOR[sec] }]}>{pct}%</Text>
                  <Text style={[s.pillAmt, { color: SECTION_COLOR[sec] }]}>{fmtMAD(income * pct / 100)}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {BUDGET_ORDER.map(sec => {
          const cats = expenseCats.filter(c => c.budget === sec);
          const color = SECTION_COLOR[sec];
          const { label, pct } = BUDGET_SECTIONS[sec];
          const secSpent = cats.reduce((sum, c) => sum + (byCategory[c.key] ?? 0), 0);
          const secLimit = income * pct / 100;
          const ratio = secLimit > 0 ? secSpent / secLimit : 0;
          const over = ratio > 1;
          return (
            <Card key={sec}>
              <View style={s.secHead}>
                <View style={[s.secBadge, { backgroundColor: color + '22' }]}><Text style={[s.secBadgeTxt, { color }]}>{pct}%</Text></View>
                <Text style={s.secTitle}>{label}</Text>
                <Text style={[s.secTotal, over && { color: t.colors.danger }]}>{fmtMAD(secSpent)} / {fmtMAD(secLimit)}</Text>
              </View>
              <ProgressBar progress={ratio} color={over ? t.colors.danger : color} />
              <Text style={[s.hint, { marginTop: 2 }]}>{RULE_DESC[sec]}</Text>

              {cats.map(c => {
                const spent = byCategory[c.key] ?? 0;
                const lim = budgetMap[c.key];
                const catOver = lim != null && lim > 0 && spent > lim;
                return (
                  <TouchableOpacity key={c.key} style={s.catRow} onPress={() => openEdit(c.key)} activeOpacity={0.7}>
                    <CategoryIcon category={c} size={36} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.catLabel} numberOfLines={1}>{c.label}</Text>
                      <Text style={s.catSub}>{lim != null && lim > 0 ? `Plafond ${fmtMAD(lim)}` : 'Toucher pour un plafond'}</Text>
                    </View>
                    <Text style={[s.catSpent, { color: catOver ? t.colors.danger : t.colors.text }]}>{fmtMAD(spent)}</Text>
                  </TouchableOpacity>
                );
              })}
              {cats.length === 0 && <Text style={s.hint}>Aucune catégorie ici. Assignez-en dans Réglages → Catégories.</Text>}
            </Card>
          );
        })}

        {unclassified.length > 0 && (
          <Card>
            <SectionLabel>Non classé</SectionLabel>
            <Text style={s.hint}>Ces catégories n'ont pas de section budgétaire — assignez-les dans Catégories.</Text>
            {unclassified.map(c => (
              <View key={c.key} style={s.catRow}>
                <CategoryIcon category={c} size={36} />
                <Text style={[s.catLabel, { flex: 1 }]} numberOfLines={1}>{c.label}</Text>
                <Text style={s.catSpent}>{fmtMAD(byCategory[c.key] ?? 0)}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <Sheet visible={!!editCat} onClose={() => setEditCat(null)} title={editCat ? `Plafond · ${getCategoryByKey(editCat).label}` : ''}>
        <Text style={{ ...t.font.caption, color: t.colors.textSecondary, marginBottom: t.spacing.md }}>
          Plafond mensuel pour cette catégorie. Laissez vide ou 0 pour aucun plafond.
        </Text>
        <Field label="Plafond (MAD)" placeholder="0" value={limitVal} onChangeText={setLimitVal} keyboardType="decimal-pad" big autoFocus />
        <View style={{ flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.lg }}>
          <Button label="Annuler" variant="secondary" onPress={() => setEditCat(null)} style={{ flex: 1 }} full={false} />
          <Button label="Enregistrer" icon="checkmark" onPress={saveLimit} style={{ flex: 2 }} full={false} />
        </View>
      </Sheet>
    </View>
  );
}
