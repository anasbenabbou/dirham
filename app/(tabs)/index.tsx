import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useTransactionStore } from '../../store/useTransactionStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useUIStore } from '../../store/useUIStore';
import { getCategoryByKey } from '../../constants/categories';

const fmt = (n: number) =>
  n.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { iso: d.toISOString().slice(0, 10), day: DAY_LABELS[d.getDay()] };
  });
}

export default function DashboardScreen() {
  const openQuickAdd = useUIStore(s => s.openQuickAdd);
  const { transactions, monthlyTotals, byCategory, currentMonth, loadMonth } = useTransactionStore();
  const { holdings, quotes, loadHoldings } = usePortfolioStore();

  useEffect(() => { loadMonth(currentMonth); loadHoldings(); }, []);

  const balance  = monthlyTotals.income - monthlyTotals.expenses;
  const savingPct = monthlyTotals.income > 0
    ? Math.round(((monthlyTotals.income - monthlyTotals.expenses) / monthlyTotals.income) * 100)
    : 0;

  const portfolioValue = holdings.reduce(
    (s, h) => s + h.shares * (quotes[h.ticker]?.price ?? h.buy_price), 0
  );
  const portfolioGain = portfolioValue - holdings.reduce((s, h) => s + h.shares * h.buy_price, 0);

  // 7-day spending chart data
  const days = getLast7Days();
  const dailySpend = days.map(({ iso }) =>
    transactions.filter(t => t.date === iso && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  );
  const maxSpend = Math.max(...dailySpend, 1);
  const todayIdx = 6;

  // Top 4 categories
  const topCats = Object.entries(byCategory)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);
  const totalSpent = monthlyTotals.expenses || 1;

  const monthLabel = new Date().toLocaleDateString('fr-MA', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero card ── */}
        <View style={s.hero}>
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroMonth}>{monthLabel}</Text>
              <Text style={s.heroBalance}>{fmt(balance)}</Text>
              <Text style={s.heroSub}>Solde net du mois</Text>
            </View>
            {savingPct > 0 && (
              <View style={s.savePill}>
                <Text style={s.savePillTxt}>+{savingPct}%</Text>
                <Text style={s.savePillSub}>épargne</Text>
              </View>
            )}
          </View>
          <View style={s.heroChips}>
            <View style={s.chip}>
              <View style={[s.chipDot, { backgroundColor: Colors.success }]} />
              <View>
                <Text style={s.chipLbl}>Revenus</Text>
                <Text style={s.chipAmt}>+{fmt(monthlyTotals.income)}</Text>
              </View>
            </View>
            <View style={s.chipDivider} />
            <View style={s.chip}>
              <View style={[s.chipDot, { backgroundColor: Colors.danger }]} />
              <View>
                <Text style={s.chipLbl}>Dépenses</Text>
                <Text style={s.chipAmt}>-{fmt(monthlyTotals.expenses)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 7-day spending chart ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Dépenses — 7 derniers jours</Text>
          <View style={s.chart}>
            {dailySpend.map((amt, i) => {
              const isToday = i === todayIdx;
              const barH = Math.max((amt / maxSpend) * 80, amt > 0 ? 6 : 0);
              return (
                <View key={i} style={s.barCol}>
                  {isToday && amt > 0 && (
                    <Text style={s.barValue}>{fmt(amt)}</Text>
                  )}
                  <View style={s.barTrack}>
                    <View
                      style={[
                        s.barFill,
                        { height: barH, backgroundColor: isToday ? Colors.primary : Colors.primaryLight },
                      ]}
                    />
                  </View>
                  <Text style={[s.barDay, isToday && { color: Colors.primary, fontWeight: '700' }]}>
                    {days[i].day}
                  </Text>
                </View>
              );
            })}
          </View>
          {dailySpend.every(v => v === 0) && (
            <Text style={s.chartEmpty}>Aucune dépense cette semaine.</Text>
          )}
        </View>

        {/* ── Category breakdown ── */}
        {topCats.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Répartition des dépenses</Text>
            <View style={s.catGrid}>
              {topCats.map(([key, val]) => {
                const cat = getCategoryByKey(key);
                const pct = Math.round((val / totalSpent) * 100);
                return (
                  <View key={key} style={s.catChip}>
                    <Text style={s.catEmoji}>{cat.emoji}</Text>
                    <Text style={s.catName} numberOfLines={1}>{cat.label}</Text>
                    <Text style={s.catPct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Portfolio snapshot ── */}
        {holdings.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Portefeuille BVC</Text>
            <View style={s.portRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.portVal}>{fmt(portfolioValue)}</Text>
                <Text style={s.portSub}>Valeur totale · {holdings.length} action{holdings.length > 1 ? 's' : ''}</Text>
              </View>
              <View style={[s.gainBadge, { backgroundColor: portfolioGain >= 0 ? Colors.successLight : Colors.dangerLight }]}>
                <Text style={[s.gainTxt, { color: portfolioGain >= 0 ? Colors.success : Colors.danger }]}>
                  {portfolioGain >= 0 ? '▲' : '▼'} {fmt(Math.abs(portfolioGain))}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Recent transactions ── */}
        <View style={[s.card, { marginBottom: 0 }]}>
          <Text style={s.cardTitle}>Récentes</Text>
          {transactions.length === 0 ? (
            <Text style={s.emptyTxt}>Appuyez sur + pour ajouter une transaction.</Text>
          ) : (
            transactions.slice(0, 5).map(t => {
              const cat = getCategoryByKey(t.category);
              const isIncome = t.type === 'income';
              return (
                <View key={t.id} style={s.txRow}>
                  <View style={s.txIcon}><Text style={s.txEmoji}>{cat.emoji}</Text></View>
                  <View style={s.txInfo}>
                    <Text style={s.txLabel} numberOfLines={1}>{cat.label}</Text>
                    <Text style={s.txDate} numberOfLines={1}>{t.date}{t.note ? ` · ${t.note}` : ''}</Text>
                  </View>
                  <Text style={[s.txAmt, { color: isIncome ? Colors.success : Colors.danger }]} numberOfLines={1}>
                    {isIncome ? '+' : '-'}{fmt(t.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={openQuickAdd} activeOpacity={0.85}>
        <Text style={s.fabTxt}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 110 },

  // Hero
  hero: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderRadius: 24, padding: 22, gap: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroMonth: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 4 },
  heroBalance: { color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  savePill: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  savePillTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
  savePillSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
  heroChips: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 16, padding: 14, alignItems: 'center',
  },
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipLbl: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '500' },
  chipAmt: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 1 },
  chipDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 },

  // Card
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 20, padding: 18,
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14,
  },

  // Chart
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 110 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, color: Colors.primary, fontWeight: '700', textAlign: 'center' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4 },
  barDay: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  chartEmpty: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: 8 },

  // Categories
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flex: 1, minWidth: '44%', backgroundColor: Colors.background,
    borderRadius: 16, padding: 14, gap: 6,
  },
  catEmoji: { fontSize: 22 },
  catName: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  catPct: { fontSize: 22, fontWeight: '800', color: Colors.text },

  // Portfolio
  portRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  portVal: { fontSize: 26, fontWeight: '800', color: Colors.text },
  portSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  gainBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  gainTxt: { fontSize: 14, fontWeight: '700' },

  // Transactions
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  txIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  txEmoji: { fontSize: 18 },
  txInfo: { flex: 1, minWidth: 0 },
  txLabel: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  txDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: '700', flexShrink: 0 },
  emptyTxt: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', paddingVertical: 16 },

  // FAB
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  fabTxt: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
