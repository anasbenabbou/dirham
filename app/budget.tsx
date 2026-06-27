import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { AppHeader, Card, SectionLabel } from '../components/ui';
import BudgetBar from '../components/BudgetBar';
import { useBudgetStore } from '../store/useBudgetStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { DEFAULT_BUDGET_RULES, BUDGET_SECTIONS } from '../constants/budget';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD } from '../lib/format';

export default function BudgetScreen() {
  const t = useTheme();
  const { budgets, loadMonth, currentMonth } = useBudgetStore();
  const { byCategory, monthlyTotals } = useTransactionStore();

  useEffect(() => { loadMonth(currentMonth); }, []);

  const budgetMap = Object.fromEntries(budgets.map(b => [b.category, b.monthly_limit]));
  const income = monthlyTotals.income;
  const sections = ['50', '30', '20'] as const;

  const SECTION_COLOR: Record<'50' | '30' | '20', string> = {
    '50': t.colors.primary,
    '30': t.colors.gold,
    '20': t.colors.success,
  };

  const s = StyleSheet.create({
    body: { padding: t.spacing.lg, gap: t.spacing.lg, paddingBottom: 40 },
    hero: { gap: 6 },
    heroLabel: { ...t.font.micro, color: t.colors.textTertiary },
    heroAmt: { ...t.font.display, color: t.colors.text },
    pillRow: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.md },
    pill: { flex: 1, borderRadius: t.radius.md, paddingVertical: 10, alignItems: 'center', gap: 2 },
    pillPct: { fontSize: 15, fontWeight: '800' },
    pillAmt: { fontSize: 11, fontWeight: '600' },
    ruleRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, paddingVertical: 5 },
    ruleDot: { width: 9, height: 9, borderRadius: 5 },
    ruleTxt: { ...t.font.caption, color: t.colors.textSecondary, flex: 1 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.sm },
    sectionBadge: { borderRadius: t.radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
    sectionBadgeTxt: { fontSize: 12, fontWeight: '800' },
    sectionTitle: { flex: 1, ...t.font.label, color: t.colors.text },
    sectionTotal: { ...t.font.caption, color: t.colors.textSecondary },
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title="Budget 50 / 30 / 20" showBack />
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        <Card>
          <Text style={s.heroLabel}>Revenus du mois</Text>
          <Text style={s.heroAmt}>{fmtMAD(income)}</Text>
          <View style={s.pillRow}>
            {sections.map(sec => (
              <View key={sec} style={[s.pill, { backgroundColor: SECTION_COLOR[sec] + '22' }]}>
                <Text style={[s.pillPct, { color: SECTION_COLOR[sec] }]}>{sec}%</Text>
                <Text style={[s.pillAmt, { color: SECTION_COLOR[sec] }]}>{fmtMAD(income * parseInt(sec) / 100)}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <SectionLabel>La règle 50 / 30 / 20</SectionLabel>
          {([['50', 'pour les besoins essentiels'], ['30', 'pour les envies personnelles'], ['20', "pour l'épargne et les investissements"]] as const).map(([pct, desc]) => (
            <View key={pct} style={s.ruleRow}>
              <View style={[s.ruleDot, { backgroundColor: SECTION_COLOR[pct] }]} />
              <Text style={s.ruleTxt}><Text style={{ fontWeight: '800', color: t.colors.text }}>{pct}% </Text>{desc}</Text>
            </View>
          ))}
        </Card>

        {sections.map(sec => {
          const rules = DEFAULT_BUDGET_RULES.filter(r => r.type === sec);
          const secColor = SECTION_COLOR[sec];
          const secLabel = BUDGET_SECTIONS[sec]?.label ?? sec + '%';
          const secSpent = rules.reduce((sum, r) => sum + (byCategory[r.category] ?? 0), 0);
          const secLimit = income * parseInt(sec) / 100;
          return (
            <View key={sec}>
              <View style={s.sectionHeader}>
                <View style={[s.sectionBadge, { backgroundColor: secColor + '22' }]}>
                  <Text style={[s.sectionBadgeTxt, { color: secColor }]}>{sec}%</Text>
                </View>
                <Text style={s.sectionTitle}>{secLabel}</Text>
                <Text style={s.sectionTotal}>{fmtMAD(secSpent)} / {fmtMAD(secLimit)}</Text>
              </View>
              {rules.map(rule => (
                <BudgetBar
                  key={rule.category}
                  category={rule.category}
                  label={rule.label}
                  spent={byCategory[rule.category] ?? 0}
                  limit={budgetMap[rule.category] ?? (income * rule.percentage / 100)}
                  accentColor={secColor}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
