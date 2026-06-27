import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import BudgetBar from '../../components/BudgetBar';
import { DEFAULT_BUDGET_RULES, BUDGET_SECTIONS } from '../../constants/budget';
import { Colors } from '../../constants/colors';

const fmt = (n: number) =>
  n.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });

const SECTION_COLORS: Record<'50' | '30' | '20', string> = {
  '50': Colors.danger,
  '30': Colors.primary,
  '20': Colors.success,
};

const SECTION_BG: Record<'50' | '30' | '20', string> = {
  '50': Colors.dangerLight,
  '30': Colors.primaryLight,
  '20': Colors.successLight,
};

export default function BudgetScreen() {
  const { budgets, loadMonth, currentMonth } = useBudgetStore();
  const { byCategory, monthlyTotals } = useTransactionStore();

  useEffect(() => { loadMonth(currentMonth); }, []);

  const budgetMap = Object.fromEntries(budgets.map(b => [b.category, b.monthly_limit]));
  const income = monthlyTotals.income;

  const sections = (['50', '30', '20'] as const);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero income card */}
        <View style={s.hero}>
          <Text style={s.heroLabel}>Revenus du mois</Text>
          <Text style={s.heroAmt}>{fmt(income)}</Text>
          <View style={s.pillRow}>
            {sections.map(sec => {
              const secIncome = income * parseInt(sec) / 100;
              return (
                <View key={sec} style={[s.pill, { backgroundColor: SECTION_BG[sec] }]}>
                  <Text style={[s.pillPct, { color: SECTION_COLORS[sec] }]}>{sec}%</Text>
                  <Text style={[s.pillAmt, { color: SECTION_COLORS[sec] }]}>{fmt(secIncome)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Rule description */}
        <View style={s.ruleCard}>
          <Text style={s.ruleTitle}>La règle 50 / 30 / 20</Text>
          <View style={s.ruleRow}>
            <View style={[s.ruleDot, { backgroundColor: SECTION_COLORS['50'] }]} />
            <Text style={s.ruleTxt}><Text style={{ fontWeight: '700' }}>50%</Text> pour les besoins essentiels</Text>
          </View>
          <View style={s.ruleRow}>
            <View style={[s.ruleDot, { backgroundColor: SECTION_COLORS['30'] }]} />
            <Text style={s.ruleTxt}><Text style={{ fontWeight: '700' }}>30%</Text> pour les envies personnelles</Text>
          </View>
          <View style={s.ruleRow}>
            <View style={[s.ruleDot, { backgroundColor: SECTION_COLORS['20'] }]} />
            <Text style={s.ruleTxt}><Text style={{ fontWeight: '700' }}>20%</Text> pour l'épargne et investissements</Text>
          </View>
        </View>

        {/* Budget bars per section */}
        {sections.map(sec => {
          const rules = DEFAULT_BUDGET_RULES.filter(r => r.type === sec);
          const secColor = SECTION_COLORS[sec];
          const secBg = SECTION_BG[sec];
          const secLabel = BUDGET_SECTIONS[sec]?.label ?? sec + '%';
          const secSpent = rules.reduce((sum, r) => sum + (byCategory[r.category] ?? 0), 0);
          const secLimit = income * parseInt(sec) / 100;

          return (
            <View key={sec} style={s.sectionWrap}>
              <View style={s.sectionHeader}>
                <View style={[s.sectionBadge, { backgroundColor: secBg }]}>
                  <Text style={[s.sectionBadgeTxt, { color: secColor }]}>{sec}%</Text>
                </View>
                <Text style={[s.sectionTitle, { color: secColor }]}>{secLabel}</Text>
                <Text style={s.sectionTotal}>{fmt(secSpent)} / {fmt(secLimit)}</Text>
              </View>
              {rules.map(rule => (
                <BudgetBar
                  key={rule.category}
                  label={rule.label}
                  emoji={rule.emoji}
                  spent={byCategory[rule.category] ?? 0}
                  limit={budgetMap[rule.category] ?? (income * rule.percentage / 100)}
                  accentColor={secColor}
                />
              ))}
            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },

  hero: {
    backgroundColor: Colors.text, borderRadius: 24, padding: 22, marginBottom: 12, gap: 6,
    shadowColor: Colors.text, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6,
  },
  heroLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroAmt: { color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, borderRadius: 12, paddingVertical: 8, alignItems: 'center', gap: 2 },
  pillPct: { fontSize: 14, fontWeight: '800' },
  pillAmt: { fontSize: 11, fontWeight: '600' },

  ruleCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, gap: 8,
    shadowColor: '#9098B1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  ruleTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot: { width: 8, height: 8, borderRadius: 4 },
  ruleTxt: { fontSize: 13, color: Colors.textSecondary },

  sectionWrap: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  sectionBadgeTxt: { fontSize: 12, fontWeight: '800' },
  sectionTitle: { flex: 1, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTotal: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
});
