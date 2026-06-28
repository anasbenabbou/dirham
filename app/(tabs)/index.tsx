import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppHeader, HeaderIconButton, Card, SectionLabel, CategoryIcon } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { useTransactionStore } from '../../store/useTransactionStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useAccountsStore } from '../../store/useAccountsStore';
import { useGoalsStore } from '../../store/useGoalsStore';
import { getCategoryByKey } from '../../db/categories';
import { computeNetWorth } from '../../lib/finance';
import { fmtMAD, fmtSigned } from '../../lib/format';

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { iso: d.toISOString().slice(0, 10), day: DAY_LABELS[d.getDay()] };
  });
}

export default function DashboardScreen() {
  const t = useTheme();
  const { transactions, monthlyTotals, byCategory, currentMonth, loadMonth } = useTransactionStore();
  const { holdings, quotes, loadHoldings } = usePortfolioStore();
  const { accounts, load: loadAccounts } = useAccountsStore();
  const { goals, load: loadGoals } = useGoalsStore();

  useEffect(() => { loadMonth(currentMonth); loadHoldings(); loadAccounts(); loadGoals(); }, []);

  const balance = monthlyTotals.income - monthlyTotals.expenses;
  const nw = computeNetWorth(accounts, holdings, quotes, goals);

  const portfolioValue = holdings.reduce((s, h) => s + h.shares * (quotes[h.ticker]?.price ?? h.buy_price), 0);
  const portfolioGain = portfolioValue - holdings.reduce((s, h) => s + h.shares * h.buy_price, 0);

  const days = getLast7Days();
  const dailySpend = days.map(({ iso }) =>
    transactions.filter(tx => tx.date === iso && tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
  );
  const maxSpend = Math.max(...dailySpend, 1);

  const topCats = Object.entries(byCategory).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).slice(0, 4);
  const totalSpent = monthlyTotals.expenses || 1;
  const monthLabel = new Date().toLocaleDateString('fr-MA', { month: 'long', year: 'numeric' });

  const s = StyleSheet.create({
    scroll: { paddingHorizontal: t.spacing.lg, paddingBottom: 120, gap: t.spacing.md },

    hero: {
      backgroundColor: t.colors.primary, borderRadius: t.radius.xxl, padding: t.spacing.xl, gap: t.spacing.lg,
      ...t.shadow.float, shadowColor: t.colors.primary,
    },
    heroMonth: { ...t.font.micro, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
    heroBalance: { color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44 },
    heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
    heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    analyseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
    chips: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: t.radius.lg, padding: 14, alignItems: 'center' },
    chip3: { flex: 1, alignItems: 'center', gap: 3 },
    chipLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },
    chipAmt: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 1 },
    chipDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.22)', marginHorizontal: 8 },

    monthRow: { flexDirection: 'row', alignItems: 'center' },
    monthCell: { flex: 1, alignItems: 'center', gap: 3 },
    monthLbl: { ...t.font.micro, color: t.colors.textTertiary },
    monthVal: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },

    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.md },
    link: { ...t.font.label, color: t.colors.primary },

    chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 104 },
    barCol: { flex: 1, alignItems: 'center', gap: 6 },
    barValue: { fontSize: 9, color: t.colors.primary, fontWeight: '700' },
    barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
    barFill: { width: '100%', borderRadius: 4, minHeight: 4 },
    barDay: { fontSize: 10, color: t.colors.textTertiary, fontWeight: '600' },
    chartEmpty: { color: t.colors.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: 16 },

    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
    catChip: { flex: 1, minWidth: '46%', backgroundColor: t.colors.cardAlt, borderRadius: t.radius.lg, padding: 14, gap: 8, flexDirection: 'row', alignItems: 'center' },
    catName: { ...t.font.caption, color: t.colors.textSecondary },
    catPct: { fontSize: 18, fontWeight: '800', color: t.colors.text },

    quickRow: { flexDirection: 'row', gap: t.spacing.md },
    quickCard: { flex: 1, gap: 10 },
    quickIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    quickTitle: { ...t.font.label, color: t.colors.text },
    quickVal: { fontSize: 18, fontWeight: '800', color: t.colors.text },
    quickSub: { ...t.font.caption, color: t.colors.textSecondary },

    txRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 10 },
    txDivider: { borderTopWidth: 1, borderTopColor: t.colors.border },
    txInfo: { flex: 1, minWidth: 0 },
    txLabel: { ...t.font.body, color: t.colors.text, fontWeight: '600' },
    txDate: { ...t.font.caption, color: t.colors.textTertiary, marginTop: 2 },
    txAmt: { fontSize: 14, fontWeight: '700' },
    emptyTxt: { color: t.colors.textSecondary, fontSize: 14, textAlign: 'center', paddingVertical: 18 },
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader
        title="Dirham"
        subtitle="Votre argent, sous contrôle"
        large
        right={<HeaderIconButton icon="settings-outline" onPress={() => router.push('/settings')} />}
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => { loadMonth(currentMonth); loadHoldings(); }} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
      >
        {/* Net worth hero */}
        <View style={s.hero}>
          <View style={s.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroMonth}>Patrimoine total</Text>
              <Text style={s.heroBalance}>{fmtMAD(nw.total)}</Text>
              <Text style={s.heroSub}>Liquidités · Bourse · Objectifs</Text>
            </View>
            <TouchableOpacity style={s.analyseBtn} onPress={() => router.push('/insights')} activeOpacity={0.85}>
              <Ionicons name="pulse" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={s.chips}>
            <View style={s.chip3}>
              <Text style={s.chipLbl}>Liquidités</Text>
              <Text style={s.chipAmt}>{fmtMAD(nw.cash + nw.emergency)}</Text>
            </View>
            <View style={s.chipDivider} />
            <View style={s.chip3}>
              <Text style={s.chipLbl}>Bourse</Text>
              <Text style={s.chipAmt}>{fmtMAD(nw.invest)}</Text>
            </View>
            <View style={s.chipDivider} />
            <View style={s.chip3}>
              <Text style={s.chipLbl}>Objectifs</Text>
              <Text style={s.chipAmt}>{fmtMAD(nw.goals)}</Text>
            </View>
          </View>
        </View>

        {/* This month */}
        <Card>
          <View style={s.cardHead}>
            <SectionLabel style={{ marginBottom: 0 }}>Ce mois · {monthLabel}</SectionLabel>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text style={s.link}>Détails →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.monthRow}>
            <View style={s.monthCell}>
              <Text style={s.monthLbl}>Revenus</Text>
              <Text style={[s.monthVal, { color: t.colors.success }]}>{fmtSigned(monthlyTotals.income)}</Text>
            </View>
            <View style={s.monthCell}>
              <Text style={s.monthLbl}>Dépenses</Text>
              <Text style={[s.monthVal, { color: t.colors.danger }]}>{fmtSigned(-monthlyTotals.expenses)}</Text>
            </View>
            <View style={s.monthCell}>
              <Text style={s.monthLbl}>Épargné</Text>
              <Text style={[s.monthVal, { color: t.colors.text }]}>{fmtMAD(balance)}</Text>
            </View>
          </View>
        </Card>

        {/* 7-day spending chart */}
        <Card>
          <SectionLabel>Dépenses — 7 derniers jours</SectionLabel>
          <View style={s.chart}>
            {dailySpend.map((amt, i) => {
              const isToday = i === 6;
              const barH = amt > 0 ? Math.max((amt / maxSpend) * 78, 6) : 0;
              return (
                <View key={i} style={s.barCol}>
                  {isToday && amt > 0 && <Text style={s.barValue}>{fmtMAD(amt)}</Text>}
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { height: barH, backgroundColor: isToday ? t.colors.primary : t.colors.primarySoft }]} />
                  </View>
                  <Text style={[s.barDay, isToday && { color: t.colors.primary, fontWeight: '800' }]}>{days[i].day}</Text>
                </View>
              );
            })}
          </View>
          {dailySpend.every(v => v === 0) && <Text style={s.chartEmpty}>Aucune dépense cette semaine.</Text>}
        </Card>

        {/* Category breakdown */}
        {topCats.length > 0 && (
          <Card>
            <View style={s.cardHead}>
              <SectionLabel style={{ marginBottom: 0 }}>Répartition des dépenses</SectionLabel>
              <TouchableOpacity onPress={() => router.push('/insights')}>
                <Text style={s.link}>Analyses →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.catGrid}>
              {topCats.map(([key, val]) => {
                const cat = getCategoryByKey(key);
                return (
                  <TouchableOpacity key={key} style={s.catChip} onPress={() => router.push(`/category/${key}`)} activeOpacity={0.7}>
                    <CategoryIcon category={cat} size={38} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.catName} numberOfLines={1}>{cat.label}</Text>
                      <Text style={s.catPct}>{Math.round((val / totalSpent) * 100)}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {/* Quick links: Portfolio + Budget */}
        <View style={s.quickRow}>
          <Card style={s.quickCard} onPress={() => router.push('/(tabs)/portfolio')}>
            <View style={[s.quickIcon, { backgroundColor: t.colors.successSoft }]}>
              <Ionicons name="stats-chart" size={20} color={t.colors.success} />
            </View>
            <Text style={s.quickTitle}>Portefeuille</Text>
            {holdings.length > 0 ? (
              <>
                <Text style={s.quickVal}>{fmtMAD(portfolioValue)}</Text>
                <Text style={[s.quickSub, { color: portfolioGain >= 0 ? t.colors.success : t.colors.danger }]}>
                  {fmtSigned(portfolioGain)} BVC
                </Text>
              </>
            ) : (
              <Text style={s.quickSub}>Ajouter vos actions BVC</Text>
            )}
          </Card>
          <Card style={s.quickCard} onPress={() => router.push('/budget')}>
            <View style={[s.quickIcon, { backgroundColor: t.colors.primarySoft }]}>
              <Ionicons name="pie-chart" size={20} color={t.colors.primary} />
            </View>
            <Text style={s.quickTitle}>Budget 50/30/20</Text>
            <Text style={s.quickVal}>{fmtMAD(monthlyTotals.expenses)}</Text>
            <Text style={s.quickSub}>Dépensé ce mois</Text>
          </Card>
        </View>

        {/* Recent transactions */}
        <Card>
          <View style={s.cardHead}>
            <SectionLabel style={{ marginBottom: 0 }}>Récentes</SectionLabel>
            {transactions.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/transactions')}>
                <Text style={s.link}>Voir tout →</Text>
              </TouchableOpacity>
            )}
          </View>
          {transactions.length === 0 ? (
            <Text style={s.emptyTxt}>Appuyez sur + pour ajouter une transaction.</Text>
          ) : (
            transactions.slice(0, 5).map((tx, idx) => {
              const cat = getCategoryByKey(tx.category);
              const isIncome = tx.type === 'income';
              return (
                <View key={tx.id} style={[s.txRow, idx > 0 && s.txDivider]}>
                  <CategoryIcon category={cat} size={40} />
                  <View style={s.txInfo}>
                    <Text style={s.txLabel} numberOfLines={1}>{cat.label}</Text>
                    <Text style={s.txDate} numberOfLines={1}>{tx.date}{tx.note ? ` · ${tx.note}` : ''}</Text>
                  </View>
                  <Text style={[s.txAmt, { color: isIncome ? t.colors.success : t.colors.text }]} numberOfLines={1}>
                    {isIncome ? '+' : '−'}{fmtMAD(tx.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
