import { useMemo, useState } from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  AppHeader, HeaderIconButton, Card, EmptyState, Field, Pill, Sheet, MonthSwitcher,
} from '../components/ui';
import TransactionItem from '../components/TransactionItem';
import { useTransactionStore } from '../store/useTransactionStore';
import { useUIStore } from '../store/useUIStore';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD, fmtSigned } from '../lib/format';
import { Transaction, getTransactions, getMonthlyTotals } from '../db/transactions';
import { getCategoryByKey } from '../db/categories';
import { useCategoriesStore } from '../store/useCategoriesStore';

type Filter = 'all' | 'income' | 'expense';

function dateLabel(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today) return "Aujourd'hui";
  if (iso === yest) return 'Hier';
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function TransactionsScreen() {
  const t = useTheme();
  const openQuickAdd = useUIStore(s => s.openQuickAdd);
  // React to store changes (add/edit/delete) without sharing its "current month".
  const storeSignal = useTransactionStore(s => s.transactions);

  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [showCats, setShowCats] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Local, self-contained month data — browsing past months never touches the
  // global store that the dashboard/budget rely on.
  const transactions = useMemo(() => getTransactions(month), [month, storeSignal, refreshKey]);
  const monthlyTotals = useMemo(() => getMonthlyTotals(month), [month, storeSignal, refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter(tx => {
      if (filter !== 'all' && tx.type !== filter) return false;
      if (catFilter && tx.category !== catFilter) return false;
      if (q) {
        const cat = getCategoryByKey(tx.category).label.toLowerCase();
        if (!cat.includes(q) && !(tx.note ?? '').toLowerCase().includes(q) && !String(tx.amount).includes(q)) return false;
      }
      return true;
    });
  }, [transactions, query, filter, catFilter]);

  const sections = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filtered.forEach(tx => { (map[tx.date] ??= []).push(tx); });
    return Object.keys(map).sort((a, b) => (a < b ? 1 : -1)).map(date => ({ title: date, data: map[date] }));
  }, [filtered]);

  const balance = monthlyTotals.income - monthlyTotals.expenses;
  const filterActive = filter !== 'all' || !!catFilter || !!query;

  const s = StyleSheet.create({
    summary: { flexDirection: 'row', marginTop: t.spacing.sm, marginBottom: t.spacing.sm },
    cell: { flex: 1, alignItems: 'center', gap: 4 },
    cellLabel: { ...t.font.micro, color: t.colors.textTertiary },
    cellVal: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
    divider: { width: 1, backgroundColor: t.colors.border, marginVertical: 4 },
    filterRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.md },
    seg: { flexDirection: 'row', backgroundColor: t.colors.surface, borderRadius: t.radius.md, padding: 3, flex: 1 },
    segBtn: { flex: 1, paddingVertical: 8, borderRadius: t.radius.sm + 1, alignItems: 'center' },
    segTxt: { ...t.font.caption, fontWeight: '700' },
    catFab: { width: 42, height: 42, borderRadius: t.radius.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    sectionHeader: { ...t.font.micro, color: t.colors.textTertiary, paddingTop: t.spacing.lg, paddingBottom: t.spacing.sm },
    list: { paddingHorizontal: t.spacing.lg, paddingBottom: 40 },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm, marginTop: t.spacing.sm },
  });

  const allCats = useCategoriesStore(s => s.categories);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader
        title="Transactions"
        showBack
        right={
          <>
            <HeaderIconButton icon="repeat" onPress={() => router.push('/recurring')} />
            <HeaderIconButton icon="add" filled onPress={openQuickAdd} />
          </>
        }
      />
      <MonthSwitcher month={month} onChange={setMonth} />

      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <View>
            <Card style={s.summary as any} padded>
              <View style={s.cell}>
                <Text style={s.cellLabel}>Revenus</Text>
                <Text style={[s.cellVal, { color: t.colors.success }]}>{fmtSigned(monthlyTotals.income)}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.cell}>
                <Text style={s.cellLabel}>Dépenses</Text>
                <Text style={[s.cellVal, { color: t.colors.danger }]}>{fmtSigned(-monthlyTotals.expenses)}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.cell}>
                <Text style={s.cellLabel}>Solde</Text>
                <Text style={[s.cellVal, { color: t.colors.text }]}>{fmtMAD(balance)}</Text>
              </View>
            </Card>

            <View style={{ marginVertical: t.spacing.md }}>
              <Field placeholder="Rechercher…" value={query} onChangeText={setQuery} />
            </View>

            <View style={s.filterRow}>
              <View style={s.seg}>
                {(['all', 'income', 'expense'] as Filter[]).map(f => {
                  const on = filter === f;
                  const color = f === 'income' ? t.colors.success : f === 'expense' ? t.colors.danger : t.colors.primary;
                  return (
                    <TouchableOpacity key={f} style={[s.segBtn, on && { backgroundColor: color }]} onPress={() => setFilter(f)}>
                      <Text style={[s.segTxt, { color: on ? t.colors.onPrimary : t.colors.textSecondary }]}>
                        {f === 'all' ? 'Tout' : f === 'income' ? 'Entrées' : 'Sorties'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[s.catFab, { backgroundColor: catFilter ? t.colors.primarySoft : t.colors.surface, borderColor: catFilter ? t.colors.primary : t.colors.border }]}
                onPress={() => setShowCats(true)}
              >
                <Ionicons name="funnel" size={18} color={catFilter ? t.colors.primary : t.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {catFilter && (
              <TouchableOpacity onPress={() => setCatFilter(null)} style={{ marginBottom: t.spacing.sm }}>
                <Text style={{ ...t.font.caption, color: t.colors.primary }}>Catégorie : {getCategoryByKey(catFilter).label}  ✕</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => <Text style={s.sectionHeader}>{dateLabel(section.title)}</Text>}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => setRefreshKey(k => k + 1)} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
        contentContainerStyle={s.list}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name={filterActive ? 'search-outline' : 'receipt-outline'} size={30} color={t.colors.textSecondary} />}
            title={filterActive ? 'Aucun résultat' : 'Aucune transaction'}
            subtitle={filterActive ? 'Essayez un autre filtre ou terme de recherche.' : 'Appuyez sur + pour enregistrer votre première transaction ce mois-ci.'}
          />
        }
      />

      <Sheet visible={showCats} onClose={() => setShowCats(false)} title="Filtrer par catégorie">
        <View style={s.catGrid}>
          <Pill label="Toutes" selected={!catFilter} onPress={() => { setCatFilter(null); setShowCats(false); }} />
          {allCats.map(c => (
            <Pill key={c.key} label={c.label} selected={catFilter === c.key} onPress={() => { setCatFilter(c.key); setShowCats(false); }} />
          ))}
        </View>
      </Sheet>
    </View>
  );
}
