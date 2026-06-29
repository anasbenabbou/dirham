import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AppHeader, Card, SectionLabel, Sheet, Field, Button, ProgressBar, CategoryIcon } from '../components/ui';
import { useBudgetStore } from '../store/useBudgetStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { BUDGET_SECTIONS, BUDGET_ORDER, BudgetType, DEFAULT_PCT, GOAL_CATEGORIES, computeAdjustedLimits } from '../constants/budget';
import { getCategoryByKey } from '../db/categories';
import { getBudgetIncome } from '../db/transactions';
import { getSetting, setSetting } from '../db/settings';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD } from '../lib/format';
import { usePrivacyMask } from '../lib/usePrivacyMask';
import { haptic } from '../lib/haptics';
import { Ionicons } from '@expo/vector-icons';

function loadPct(): Record<BudgetType, number> {
  return {
    needs:   parseFloat(getSetting('budget_pct_needs')   ?? '') || DEFAULT_PCT.needs,
    wants:   parseFloat(getSetting('budget_pct_wants')   ?? '') || DEFAULT_PCT.wants,
    savings: parseFloat(getSetting('budget_pct_savings') ?? '') || DEFAULT_PCT.savings,
  };
}

export default function BudgetScreen() {
  const t = useTheme();
  const { budgets, loadMonth, currentMonth, setBudget } = useBudgetStore();
  const { byCategory } = useTransactionStore();
  const categories = useCategoriesStore(s => s.categories);
  const loadCats = useCategoriesStore(s => s.load);

  const { maskMAD } = usePrivacyMask();

  const [pct, setPct] = useState<Record<BudgetType, number>>(loadPct);
  const [editCat, setEditCat] = useState<string | null>(null);
  const [limitVal, setLimitVal] = useState('');
  const [editPct, setEditPct] = useState(false);
  const [draftPct, setDraftPct] = useState({ needs: '', wants: '', savings: '' });

  useEffect(() => { loadMonth(currentMonth); loadCats(); }, []);

  const budgetMap = Object.fromEntries(budgets.map(b => [b.category, b.monthly_limit]));
  const income = getBudgetIncome(currentMonth);

  const SECTION_COLOR: Record<BudgetType, string> = {
    needs: t.colors.primary, wants: t.colors.gold, savings: t.colors.success,
  };

  const expenseCats = categories.filter(c => c.type === 'expense');
  const unclassified = expenseCats.filter(c => !c.budget && (byCategory[c.key] ?? 0) > 0);

  // Spending per section
  const spentBySec: Record<BudgetType, number> = { needs: 0, wants: 0, savings: 0 };
  for (const c of expenseCats) {
    if (c.budget && c.budget in spentBySec) {
      spentBySec[c.budget as BudgetType] += byCategory[c.key] ?? 0;
    }
  }

  const limits = computeAdjustedLimits(income, pct, spentBySec);
  const totalSpent = Object.values(spentBySec).reduce((a, b) => a + b, 0);
  const totalOverflow = BUDGET_ORDER.reduce((s, sec) => s + limits[sec].overflow, 0);

  function renderCatRow(c: { key: string; label: string; icon: any; color: string; type: any; budget?: any }) {
    const spent = byCategory[c.key] ?? 0;
    const catLim = budgetMap[c.key];
    const catOver = catLim != null && catLim > 0 && spent > catLim;
    return (
      <TouchableOpacity key={c.key} style={s.catRow} onPress={() => openEdit(c.key)} activeOpacity={0.7}>
        <CategoryIcon category={c as any} size={36} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.catLabel} numberOfLines={1}>{c.label}</Text>
          <Text style={s.catSub}>
            {catLim != null && catLim > 0 ? `Plafond ${maskMAD(catLim)}` : 'Toucher pour fixer un plafond'}
          </Text>
        </View>
        <Text style={[s.catSpent, { color: catOver ? t.colors.danger : t.colors.text }]}>
          {maskMAD(spent)}
        </Text>
      </TouchableOpacity>
    );
  }

  function openEdit(key: string) {
    setEditCat(key);
    setLimitVal(budgetMap[key] ? String(Math.round(budgetMap[key])) : '');
  }
  function saveLimit() {
    if (!editCat) return;
    const v = parseFloat(limitVal);
    setBudget(editCat, isNaN(v) ? 0 : v, currentMonth);
    haptic.success();
    setEditCat(null);
  }

  function openEditPct() {
    setDraftPct({ needs: String(pct.needs), wants: String(pct.wants), savings: String(pct.savings) });
    setEditPct(true);
  }
  function savePct() {
    const n = parseFloat(draftPct.needs) || 0;
    const w = parseFloat(draftPct.wants) || 0;
    const sv = parseFloat(draftPct.savings) || 0;
    const sum = n + w + sv;
    if (Math.round(sum) !== 100) {
      Alert.alert('Total invalide', `Les pourcentages doivent totaliser 100%. Actuellement : ${sum.toFixed(0)}%.`);
      return;
    }
    const next = { needs: n, wants: w, savings: sv };
    setSetting('budget_pct_needs',   String(n));
    setSetting('budget_pct_wants',   String(w));
    setSetting('budget_pct_savings', String(sv));
    setPct(next);
    haptic.success();
    setEditPct(false);
  }

  const s = StyleSheet.create({
    body:        { padding: t.spacing.lg, gap: t.spacing.lg, paddingBottom: 40 },
    heroLabel:   { ...t.font.micro, color: t.colors.textTertiary },
    heroAmt:     { ...t.font.display, color: t.colors.text },
    heroSub:     { ...t.font.caption, color: t.colors.textSecondary, marginTop: 4 },
    pillRow:     { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.md },
    pill:        { flex: 1, borderRadius: t.radius.md, paddingVertical: 10, alignItems: 'center', gap: 2 },
    pillPct:     { fontSize: 15, fontWeight: '800' },
    pillAmt:     { fontSize: 11, fontWeight: '600' },
    editPctBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: t.spacing.sm },
    editPctTxt:  { ...t.font.caption, color: t.colors.primary },
    secHead:     { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.sm },
    secBadge:    { borderRadius: t.radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
    secBadgeTxt: { fontSize: 12, fontWeight: '800' },
    secTitle:    { flex: 1, ...t.font.label, color: t.colors.text },
    secMeta:     { alignItems: 'flex-end', gap: 2 },
    secSpent:    { ...t.font.caption, color: t.colors.textSecondary },
    secAdj:      { ...t.font.micro, color: t.colors.textTertiary },
    catRow:      { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.colors.border },
    catLabel:    { ...t.font.body, color: t.colors.text },
    catSub:      { ...t.font.caption, color: t.colors.textTertiary, marginTop: 1 },
    catSpent:    { ...t.font.label },
    hint:        { ...t.font.caption, color: t.colors.textTertiary, paddingVertical: 8 },
    rebalRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, padding: 8, borderRadius: t.radius.sm, backgroundColor: t.colors.cardAlt },
    rebalTxt:    { ...t.font.caption, color: t.colors.textSecondary, flex: 1 },
    totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: t.colors.border },
    totalLabel:  { ...t.font.body, color: t.colors.textSecondary },
    totalAmt:    { ...t.font.label, color: t.colors.text },
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title="Budget mensuel" showBack />
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* Income hero */}
        <Card>
          <Text style={s.heroLabel}>Revenus (Salaire + Freelance)</Text>
          <Text style={s.heroAmt}>{maskMAD(income)}</Text>
          {totalOverflow > 0 && (
            <Text style={[s.heroSub, { color: t.colors.danger }]}>
              Dépassement total : {maskMAD(totalOverflow)} — rééquilibré automatiquement
            </Text>
          )}
          <View style={s.pillRow}>
            {BUDGET_ORDER.map(sec => {
              const lim = limits[sec];
              const color = SECTION_COLOR[sec];
              return (
                <View key={sec} style={[s.pill, { backgroundColor: color + '22' }]}>
                  <Text style={[s.pillPct, { color }]}>{pct[sec]}%</Text>
                  <Text style={[s.pillAmt, { color }]}>{maskMAD(lim.adjusted)}</Text>
                  {lim.reduction > 0 && (
                    <Text style={{ fontSize: 9, color: t.colors.danger, fontWeight: '700' }}>
                      -{maskMAD(lim.reduction)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          <TouchableOpacity style={s.editPctBtn} onPress={openEditPct}>
            <Ionicons name="settings-outline" size={12} color={t.colors.primary} />
            <Text style={s.editPctTxt}>Ajuster les pourcentages</Text>
          </TouchableOpacity>
        </Card>

        {/* One card per section */}
        {BUDGET_ORDER.map(sec => {
          const cats = expenseCats.filter(c => c.budget === sec);
          const color = SECTION_COLOR[sec];
          const { label, desc } = BUDGET_SECTIONS[sec];
          const lim = limits[sec];
          const ratio = lim.adjusted > 0 ? spentBySec[sec] / lim.adjusted : 0;
          const over = spentBySec[sec] > lim.adjusted;

          return (
            <Card key={sec}>
              <View style={s.secHead}>
                <View style={[s.secBadge, { backgroundColor: color + '22' }]}>
                  <Text style={[s.secBadgeTxt, { color }]}>{pct[sec]}%</Text>
                </View>
                <Text style={s.secTitle}>{label}</Text>
                <View style={s.secMeta}>
                  <Text style={[s.secSpent, over && { color: t.colors.danger }]}>
                    {maskMAD(spentBySec[sec])} / {maskMAD(lim.adjusted)}
                  </Text>
                  {lim.reduction > 0 && (
                    <Text style={s.secAdj}>Base {maskMAD(lim.base)} → -{maskMAD(lim.reduction)}</Text>
                  )}
                </View>
              </View>

              <ProgressBar progress={Math.min(ratio, 1)} color={over ? t.colors.danger : color} />

              {lim.reduction > 0 && (
                <View style={s.rebalRow}>
                  <Ionicons name="warning-outline" size={13} color={t.colors.gold} />
                  <Text style={s.rebalTxt}>
                    Réduit de {maskMAD(lim.reduction)} à cause des dépassements dans les autres sections.
                  </Text>
                </View>
              )}

              <Text style={[s.hint, { marginTop: 4 }]}>{desc}</Text>

              {cats.map(c => renderCatRow(c))}
              {cats.length === 0 && (
                <Text style={s.hint}>Aucune catégorie ici. Assignez-en dans Réglages → Catégories.</Text>
              )}
            </Card>
          );
        })}

        {/* Total summary */}
        <Card>
          <SectionLabel>Récapitulatif</SectionLabel>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Revenus (base budget)</Text>
            <Text style={s.totalAmt}>{maskMAD(income)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total dépensé</Text>
            <Text style={[s.totalAmt, totalSpent > income && { color: t.colors.danger }]}>{maskMAD(totalSpent)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Restant</Text>
            <Text style={[s.totalAmt, { color: income - totalSpent >= 0 ? t.colors.success : t.colors.danger }]}>
              {maskMAD(income - totalSpent)}
            </Text>
          </View>
        </Card>

        {/* Unclassified */}
        {unclassified.length > 0 && (
          <Card>
            <SectionLabel>Non classé</SectionLabel>
            <Text style={s.hint}>Ces catégories n'ont pas de section — assignez-les dans Réglages → Catégories.</Text>
            {unclassified.map(c => (
              <View key={c.key} style={s.catRow}>
                <CategoryIcon category={c} size={36} />
                <Text style={[s.catLabel, { flex: 1 }]} numberOfLines={1}>{c.label}</Text>
                <Text style={s.catSpent}>{maskMAD(byCategory[c.key] ?? 0)}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* Edit category ceiling */}
      <Sheet visible={!!editCat} onClose={() => setEditCat(null)} title={editCat ? `Plafond · ${getCategoryByKey(editCat).label}` : ''}>
        <Text style={{ ...t.font.caption, color: t.colors.textSecondary, marginBottom: t.spacing.md }}>
          Plafond mensuel pour cette catégorie. Laissez 0 pour aucun plafond.
        </Text>
        <Field label="Plafond (MAD)" placeholder="0" value={limitVal} onChangeText={setLimitVal} keyboardType="decimal-pad" big autoFocus />
        <View style={{ flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.lg }}>
          <Button label="Annuler" variant="secondary" onPress={() => setEditCat(null)} style={{ flex: 1 }} full={false} />
          <Button label="Enregistrer" icon="checkmark" onPress={saveLimit} style={{ flex: 2 }} full={false} />
        </View>
      </Sheet>

      {/* Edit section percentages */}
      <Sheet visible={editPct} onClose={() => setEditPct(false)} title="Répartition du budget">
        <Text style={{ ...t.font.caption, color: t.colors.textSecondary, marginBottom: t.spacing.lg }}>
          Les trois pourcentages doivent totaliser exactement 100%.
        </Text>
        {BUDGET_ORDER.map(sec => (
          <Field
            key={sec}
            label={`${BUDGET_SECTIONS[sec].label} (%)`}
            placeholder={String(DEFAULT_PCT[sec])}
            value={draftPct[sec]}
            onChangeText={v => setDraftPct(prev => ({ ...prev, [sec]: v }))}
            keyboardType="decimal-pad"
          />
        ))}
        <Text style={{ ...t.font.caption, color: t.colors.textTertiary, marginTop: t.spacing.sm }}>
          Total actuel : {(
            (parseFloat(draftPct.needs) || 0) +
            (parseFloat(draftPct.wants) || 0) +
            (parseFloat(draftPct.savings) || 0)
          ).toFixed(0)}%
        </Text>
        <View style={{ flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.lg }}>
          <Button label="Annuler" variant="secondary" onPress={() => setEditPct(false)} style={{ flex: 1 }} full={false} />
          <Button label="Enregistrer" icon="checkmark" onPress={savePct} style={{ flex: 2 }} full={false} />
        </View>
      </Sheet>
    </View>
  );
}
