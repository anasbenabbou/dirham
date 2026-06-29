import { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppHeader, Card, SectionLabel, LineChart, Bars, Donut, EmptyState } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD, fmtSigned } from '../lib/format';
import { usePrivacyMask } from '../lib/usePrivacyMask';
import { getTrend, getMonthlyByCategory } from '../db/transactions';
import { getSnapshots } from '../db/networth';
import { getBudgetsForMonth } from '../db/budgets';
import { getCategoryByKey } from '../db/categories';
import { useAccountsStore } from '../store/useAccountsStore';
import { useGoalsStore } from '../store/useGoalsStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { computeNetWorth, computeHealth } from '../lib/finance';

const monthShort = (m: string) => new Date(m + '-01T00:00:00').toLocaleDateString('fr-MA', { month: 'short' });

export default function InsightsScreen() {
  const t = useTheme();
  const W = Dimensions.get('window').width - 32 - 36; // screen - page padding - card padding

  const { accounts, load: loadAccounts } = useAccountsStore();
  const { goals, load: loadGoals } = useGoalsStore();
  const { holdings, quotes, loadHoldings } = usePortfolioStore();
  useEffect(() => { loadAccounts(); loadGoals(); loadHoldings(); }, []);

  const { maskMAD, maskSigned } = usePrivacyMask();

  const trend = useMemo(() => getTrend(6), []);
  const snapshots = useMemo(() => getSnapshots(30), []);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const byCat = useMemo(() => getMonthlyByCategory(thisMonth), [thisMonth]);

  const nets = trend.map(m => m.income - m.expenses);
  const monthsWithData = trend.filter(m => m.income > 0 || m.expenses > 0);
  const avgNet = monthsWithData.length ? nets.slice(-monthsWithData.length).reduce((a, b) => a + b, 0) / monthsWithData.length : 0;
  const avgExpense = monthsWithData.length ? monthsWithData.reduce((a, b) => a + b.expenses, 0) / monthsWithData.length : 0;
  const avgIncome = monthsWithData.length ? monthsWithData.reduce((a, b) => a + b.income, 0) / monthsWithData.length : 0;

  // Net worth + financial health
  const nw = computeNetWorth(accounts, holdings, quotes, goals);
  const overBudgetCount = useMemo(() => {
    const budgets = getBudgetsForMonth(thisMonth);
    return budgets.filter(b => (byCat[b.category] ?? 0) > b.monthly_limit).length;
  }, [thisMonth, byCat]);
  const trendUp = snapshots.length > 1 ? snapshots[snapshots.length - 1].total >= snapshots[0].total : null;
  const health = computeHealth({ avgIncome, avgExpense, avgNet, emergency: nw.emergency, netWorthTrendUp: trendUp, overBudgetCount });
  const healthColor = health.score >= 80 ? t.colors.success : health.score >= 60 ? t.colors.primary : health.score >= 40 ? t.colors.gold : t.colors.danger;

  const currentNW = snapshots.length ? snapshots[snapshots.length - 1].total : nw.total;
  const forecast = Array.from({ length: 6 }, (_, i) => currentNW + avgNet * (i + 1));

  const catData = Object.entries(byCat)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([key, val]) => ({ ...getCategoryByKey(key), val }));
  const catTotal = catData.reduce((s, c) => s + c.val, 0) || 1;

  const hasAny = trend.some(m => m.income > 0 || m.expenses > 0) || snapshots.length > 1 || accounts.length > 0 || nw.total > 0;

  const statusColor = (st: 'good' | 'warn' | 'bad') => st === 'good' ? t.colors.success : st === 'warn' ? t.colors.gold : t.colors.danger;
  const statusIcon = (st: 'good' | 'warn' | 'bad') => st === 'good' ? 'checkmark-circle' : st === 'warn' ? 'alert-circle' : 'close-circle';

  const s = StyleSheet.create({
    body: { padding: t.spacing.lg, paddingBottom: 60, gap: t.spacing.md },
    statRow: { flexDirection: 'row', gap: t.spacing.md },
    stat: { flex: 1 },
    statLabel: { ...t.font.micro, color: t.colors.textTertiary },
    statVal: { fontSize: 20, fontWeight: '800', marginTop: 4 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, paddingVertical: 6 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: { ...t.font.body, color: t.colors.text, flex: 1 },
    legendVal: { ...t.font.label, color: t.colors.textSecondary },
    forecastNote: { ...t.font.caption, color: t.colors.textSecondary, marginTop: t.spacing.sm, lineHeight: 19 },
    healthRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg },
    healthRating: { fontSize: 22, fontWeight: '800', color: t.colors.text },
    healthSub: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
    adviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.md, paddingVertical: 8 },
    adviceLabel: { ...t.font.label, color: t.colors.text },
    adviceDetail: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2, lineHeight: 18 },
  });

  if (!hasAny) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <AppHeader title="Analyses" showBack />
        <EmptyState
          icon={<Ionicons name="bar-chart-outline" size={30} color={t.colors.textSecondary} />}
          title="Pas encore de données"
          subtitle="Ajoutez des transactions et revenez : vos tendances et prévisions apparaîtront ici."
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title="Analyses" subtitle="6 derniers mois" showBack />
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* Net worth + health score */}
        <Card>
          <SectionLabel>Santé financière</SectionLabel>
          <View style={s.healthRow}>
            <Donut
              size={104} thickness={14}
              data={[{ value: health.score, color: healthColor }, { value: 100 - health.score, color: t.colors.surface }]}
              centerLabel={String(health.score)} centerSub="/ 100"
            />
            <View style={{ flex: 1 }}>
              <Text style={s.healthRating}>{health.rating}</Text>
              <Text style={s.healthSub}>Patrimoine total : {maskMAD(nw.total)}</Text>
              <Text style={s.healthSub}>Épargne {Math.round(health.savingsRate)}% · Urgence {health.emergencyMonths.toFixed(1)} mois</Text>
            </View>
          </View>
        </Card>

        {/* Advice */}
        <Card>
          <SectionLabel>Conseils</SectionLabel>
          {health.advice.map((a, i) => (
            <View key={a.key} style={[s.adviceRow, i > 0 && { borderTopWidth: 1, borderTopColor: t.colors.border }]}>
              <Ionicons name={statusIcon(a.status) as any} size={20} color={statusColor(a.status)} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.adviceLabel}>{a.label}</Text>
                <Text style={s.adviceDetail}>{a.detail}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Quick stats */}
        <View style={s.statRow}>
          <Card style={s.stat}>
            <Text style={s.statLabel}>Épargne moy. / mois</Text>
            <Text style={[s.statVal, { color: avgNet >= 0 ? t.colors.success : t.colors.danger }]}>{maskSigned(Math.round(avgNet))}</Text>
          </Card>
          <Card style={s.stat}>
            <Text style={s.statLabel}>Dépense moy. / mois</Text>
            <Text style={[s.statVal, { color: t.colors.text }]}>{maskMAD(Math.round(avgExpense))}</Text>
          </Card>
        </View>

        {/* Net worth trend */}
        <Card>
          <SectionLabel>Évolution du patrimoine</SectionLabel>
          {snapshots.length > 1 ? (
            <LineChart
              data={snapshots.map(sn => sn.total)}
              width={W}
              color={t.colors.primary}
              labels={[snapshots[0].date.slice(5), snapshots[snapshots.length - 1].date.slice(5)]}
            />
          ) : (
            <Text style={{ color: t.colors.textSecondary, fontSize: 13 }}>Le patrimoine est enregistré chaque jour — revenez demain pour voir la courbe.</Text>
          )}
        </Card>

        {/* Spending per month */}
        <Card>
          <SectionLabel>Dépenses par mois</SectionLabel>
          <Bars
            width={W}
            data={trend.map(m => ({ value: m.expenses, label: monthShort(m.month), color: t.colors.primary }))}
          />
        </Card>

        {/* Income vs expense */}
        <Card>
          <SectionLabel>Revenus vs dépenses</SectionLabel>
          {trend.map(m => {
            const net = m.income - m.expenses;
            return (
              <View key={m.month} style={s.legendRow}>
                <Text style={{ ...t.font.label, color: t.colors.textSecondary, width: 44, textTransform: 'capitalize' }}>{monthShort(m.month)}</Text>
                <Text style={{ flex: 1, ...t.font.caption, color: t.colors.success }}>{maskSigned(m.income)}</Text>
                <Text style={{ flex: 1, ...t.font.caption, color: t.colors.danger }}>{maskSigned(-m.expenses)}</Text>
                <Text style={{ ...t.font.label, color: net >= 0 ? t.colors.success : t.colors.danger }}>{maskSigned(net)}</Text>
              </View>
            );
          })}
        </Card>

        {/* Category allocation */}
        {catData.length > 0 && (
          <Card>
            <SectionLabel>Répartition ce mois</SectionLabel>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
              <Donut
                size={130} thickness={20}
                data={catData.map(c => ({ value: c.val, color: c.color }))}
                centerLabel={maskMAD(catTotal)} centerSub="dépensé"
              />
              <View style={{ flex: 1, gap: 2 }}>
                {catData.map(c => (
                  <TouchableOpacity key={c.key} style={s.legendRow} onPress={() => router.push(`/category/${c.key}`)}>
                    <View style={[s.dot, { backgroundColor: c.color }]} />
                    <Text style={s.legendLabel} numberOfLines={1}>{c.label}</Text>
                    <Text style={s.legendVal}>{Math.round((c.val / catTotal) * 100)}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        )}

        {/* Forecast */}
        <Card>
          <SectionLabel>Prévision · 6 mois</SectionLabel>
          <LineChart data={[currentNW, ...forecast]} width={W} color={avgNet >= 0 ? t.colors.success : t.colors.danger} />
          <Text style={s.forecastNote}>
            Au rythme actuel ({maskSigned(Math.round(avgNet))}/mois), votre patrimoine atteindrait{' '}
            <Text style={{ fontWeight: '800', color: t.colors.text }}>{maskMAD(Math.round(forecast[5]))}</Text> dans 6 mois.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}
