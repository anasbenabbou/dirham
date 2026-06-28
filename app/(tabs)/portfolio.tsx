import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, Alert, ScrollView, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import StockRow from '../../components/StockRow';
import { useTheme } from '../../theme/ThemeProvider';
import { BvcStock } from '../../constants/bvcStocks';
import { InstrumentClass } from '../../db/instruments';
import { MarketRow } from '../../api/mansa';
import { useKeyboardHeight } from '../../lib/useKeyboard';

function compact(n: number | null | undefined): string {
  if (n == null) return '—';
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + ' Md';
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' M';
  if (a >= 1e3) return Math.round(n / 1e3) + ' K';
  return String(Math.round(n));
}
import { fmtMAD, fmtNum, fmtSigned, fmtPct } from '../../lib/format';
import { AppHeader, HeaderIconButton, Card, Field, Segmented, Button, Donut, Skeleton, SectionLabel, Badge } from '../../components/ui';

const ALLOC_COLORS = ['#3D7BFF', '#0ECB81', '#F0B90B', '#FF6FD8', '#8B7CFF', '#3DD6C4', '#FF8A3D', '#5CC8FF'];

/* ── Step 1: pick an instrument (live, full exchange list) ─────────────── */
const CLASS_LABEL: Record<InstrumentClass, string> = {
  action: 'Actions', obligation: 'Obligations', fond: 'FCP', droit: 'Droits',
};

function StockPicker({ onPick }: { onPick: (s: BvcStock) => void }) {
  const t = useTheme();
  const { instruments, watchlist, instrumentsSyncing, loadInstruments, syncInstruments, watch, unwatch } = usePortfolioStore();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<InstrumentClass>('action');

  useEffect(() => {
    loadInstruments();
    if (usePortfolioStore.getState().instruments.length < 50) syncInstruments();
  }, []);

  const tabs = useMemo(() => {
    const present = new Set(instruments.map(i => i.klass));
    const order: InstrumentClass[] = ['action', 'obligation', 'fond', 'droit'];
    const list = order.filter(k => present.has(k));
    return list.length ? list : (['action'] as InstrumentClass[]);
  }, [instruments]);
  const activeTab = tabs.includes(tab) ? tab : tabs[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return instruments.filter(i =>
      i.klass === activeTab &&
      (!q || i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
    );
  }, [instruments, activeTab, query]);

  const isWatched = (tk: string) => watchlist.some(w => w.ticker === tk);

  const sp = StyleSheet.create({
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, margin: t.spacing.lg, marginBottom: t.spacing.sm },
    syncBtn: { width: 46, height: 46, borderRadius: t.radius.md, backgroundColor: t.colors.surface, justifyContent: 'center', alignItems: 'center' },
    tabs: { flexDirection: 'row', gap: t.spacing.sm, paddingHorizontal: t.spacing.lg, marginBottom: t.spacing.sm },
    tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: t.radius.pill, backgroundColor: t.colors.surface },
    tabOn: { backgroundColor: t.colors.primary },
    tabTxt: { ...t.font.label },
    item: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 13, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    badge: { backgroundColor: t.colors.primarySoft, borderRadius: t.radius.sm, paddingHorizontal: 8, paddingVertical: 5, minWidth: 58, alignItems: 'center' },
    ticker: { fontWeight: '800', color: t.colors.primary, fontSize: 12 },
    name: { ...t.font.body, color: t.colors.text, flex: 1 },
    hint: { ...t.font.caption, color: t.colors.textTertiary, textAlign: 'center', paddingVertical: t.spacing.md },
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={sp.searchRow}>
        <View style={{ flex: 1 }}>
          <Field placeholder="Rechercher (nom ou symbole)…" value={query} onChangeText={setQuery} autoFocus />
        </View>
        <TouchableOpacity style={sp.syncBtn} onPress={syncInstruments} disabled={instrumentsSyncing}>
          {instrumentsSyncing ? <ActivityIndicator size="small" color={t.colors.primary} /> : <Ionicons name="sync" size={18} color={t.colors.primary} />}
        </TouchableOpacity>
      </View>

      {tabs.length > 1 && (
        <View style={sp.tabs}>
          {tabs.map(k => (
            <TouchableOpacity key={k} style={[sp.tab, activeTab === k && sp.tabOn]} onPress={() => setTab(k)}>
              <Text style={[sp.tabTxt, { color: activeTab === k ? t.colors.onPrimary : t.colors.textSecondary }]}>{CLASS_LABEL[k]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={i => i.symbol}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={instrumentsSyncing ? <Text style={sp.hint}>Synchronisation de la cote…</Text> : null}
        ListEmptyComponent={!instrumentsSyncing ? <Text style={sp.hint}>Aucun résultat. Touchez ↻ pour synchroniser la cote.</Text> : null}
        renderItem={({ item: s }) => (
          <View style={sp.item}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, flex: 1 }}
              onPress={() => onPick({ ticker: s.symbol, name: s.name, sector: CLASS_LABEL[s.klass] })}>
              <View style={sp.badge}><Text style={sp.ticker}>{s.symbol}</Text></View>
              <Text style={sp.name} numberOfLines={1}>{s.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => isWatched(s.symbol) ? unwatch(s.symbol) : watch(s.symbol, s.name)} hitSlop={8}>
              <Ionicons name={isWatched(s.symbol) ? 'star' : 'star-outline'} size={20} color={isWatched(s.symbol) ? t.colors.gold : t.colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

/* ── Step 2: enter amount ─────────────────────────────────────────────── */
function AmountEntry({ stock, onConfirm, onBack }: { stock: BvcStock; onConfirm: (shares: number, price: number) => void; onBack: () => void }) {
  const t = useTheme();
  const kb = useKeyboardHeight();
  const [mode, setMode] = useState<'amount' | 'shares'>('amount');
  const [totalMAD, setTotalMAD] = useState('');
  const [sharesVal, setSharesVal] = useState('');
  const [priceVal, setPriceVal] = useState('');
  const quote = usePortfolioStore(s => s.quotes[stock.ticker]);
  const suggestedPrice = quote?.price;

  function handleConfirm() {
    const price = parseFloat(priceVal);
    if (isNaN(price) || price <= 0) { Alert.alert('Prix requis', "Entrez le prix d'achat par action."); return; }
    if (mode === 'amount') {
      const total = parseFloat(totalMAD);
      if (isNaN(total) || total <= 0) { Alert.alert('Montant invalide', 'Entrez le montant investi.'); return; }
      onConfirm(total / price, price);
    } else {
      const shares = parseFloat(sharesVal);
      if (isNaN(shares) || shares <= 0) { Alert.alert('Quantité invalide', "Entrez le nombre d'actions."); return; }
      onConfirm(shares, price);
    }
  }

  const preview = (() => {
    const price = parseFloat(priceVal);
    if (isNaN(price) || price <= 0) return null;
    if (mode === 'amount') {
      const total = parseFloat(totalMAD);
      if (isNaN(total) || total <= 0) return null;
      return { shares: total / price, total };
    }
    const shares = parseFloat(sharesVal);
    if (isNaN(shares) || shares <= 0) return null;
    return { shares, total: shares * price };
  })();

  const ae = StyleSheet.create({
    wrap: { padding: t.spacing.xl, gap: t.spacing.lg },
    header: { alignItems: 'center', gap: 6, paddingVertical: t.spacing.sm },
    bigBadge: { backgroundColor: t.colors.primarySoft, borderRadius: t.radius.md, paddingHorizontal: 16, paddingVertical: 8 },
    bigTicker: { fontWeight: '800', color: t.colors.primary, fontSize: 22 },
    name: { ...t.font.heading, color: t.colors.text, textAlign: 'center' },
    live: { ...t.font.caption, color: t.colors.success, fontWeight: '600' },
    useCurrent: { color: t.colors.primary, ...t.font.caption, fontWeight: '600', marginTop: 6 },
    preview: { backgroundColor: t.colors.primarySoft, borderRadius: t.radius.md, padding: 14, alignItems: 'center' },
    previewTxt: { ...t.font.heading, color: t.colors.primary },
    actions: { flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.sm },
  });

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[ae.wrap, { paddingBottom: t.spacing.xl + kb }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={ae.header}>
        <View style={ae.bigBadge}><Text style={ae.bigTicker}>{stock.ticker}</Text></View>
        <Text style={ae.name}>{stock.name}</Text>
        {suggestedPrice && <Text style={ae.live}>Prix actuel : {fmtNum(suggestedPrice)} MAD</Text>}
      </View>
      <Segmented value={mode} onChange={setMode}
        options={[{ value: 'amount', label: 'Par montant' }, { value: 'shares', label: 'Par actions' }]} />
      {mode === 'amount'
        ? <Field label="Montant investi (MAD)" placeholder="ex: 5000" value={totalMAD} onChangeText={setTotalMAD} keyboardType="decimal-pad" autoFocus />
        : <Field label="Nombre d'actions" placeholder="ex: 10" value={sharesVal} onChangeText={setSharesVal} keyboardType="decimal-pad" autoFocus />}
      <View>
        <Field label="Prix d'achat par action (MAD)" placeholder={suggestedPrice ? `Prix actuel: ${fmtNum(suggestedPrice)}` : 'ex: 245.50'}
          value={priceVal} onChangeText={setPriceVal} keyboardType="decimal-pad" />
        {suggestedPrice && !priceVal && (
          <TouchableOpacity onPress={() => setPriceVal(suggestedPrice.toFixed(2))}>
            <Text style={ae.useCurrent}>↑ Utiliser le prix actuel</Text>
          </TouchableOpacity>
        )}
      </View>
      {preview && (
        <View style={ae.preview}>
          <Text style={ae.previewTxt}>{preview.shares.toFixed(preview.shares % 1 === 0 ? 0 : 2)} actions · {fmtMAD(preview.total)}</Text>
        </View>
      )}
      <View style={ae.actions}>
        <Button label="Changer" variant="secondary" icon="arrow-back" onPress={onBack} style={{ flex: 1 }} full={false} />
        <Button label="Ajouter" icon="checkmark" onPress={handleConfirm} style={{ flex: 2 }} full={false} />
      </View>
    </ScrollView>
  );
}

/* ── Main screen ──────────────────────────────────────────────────────── */
export default function PortfolioScreen() {
  const t = useTheme();
  const W = Dimensions.get('window').width - 32 - 36;
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<BvcStock | null>(null);
  const [moverTab, setMoverTab] = useState<'gain' | 'lose' | 'vol'>('gain');
  const [coteQuery, setCoteQuery] = useState('');
  const {
    holdings, quotes, market, masi, loading, error, watchlist, dividendTotal, instruments,
    loadHoldings, loadWatchlist, loadDividends, loadInstruments, addHolding, refreshPrices,
  } = usePortfolioStore();

  useEffect(() => { loadHoldings(); loadWatchlist(); loadDividends(); loadInstruments(); refreshPrices(); }, []);

  const nameMap = useMemo(() => Object.fromEntries(instruments.map(i => [i.symbol, i.name])), [instruments]);
  const nameOf = (tk: string) => nameMap[tk] ?? tk;

  const gainers = useMemo(() => [...market].sort((a, b) => b.varDay - a.varDay).slice(0, 6), [market]);
  const losers = useMemo(() => [...market].sort((a, b) => a.varDay - b.varDay).slice(0, 6), [market]);
  const active = useMemo(() => [...market].filter(m => m.volume != null).sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 6), [market]);
  const moverList = moverTab === 'gain' ? gainers : moverTab === 'lose' ? losers : active;

  const cote = useMemo(() => {
    const q = coteQuery.trim().toLowerCase();
    const list = [...market].sort((a, b) => nameOf(a.ticker).localeCompare(nameOf(b.ticker)));
    return q ? list.filter(m => m.ticker.toLowerCase().includes(q) || nameOf(m.ticker).toLowerCase().includes(q)) : list;
  }, [market, coteQuery, instruments]);

  const totalValue = holdings.reduce((s, h) => s + h.shares * (quotes[h.ticker]?.price ?? h.buy_price), 0);
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.buy_price, 0);
  const totalGain = totalValue - totalCost;
  const gainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const positive = totalGain >= 0;

  const alloc = holdings
    .map((h, i) => ({ ticker: h.ticker, value: h.shares * (quotes[h.ticker]?.price ?? h.buy_price), color: ALLOC_COLORS[i % ALLOC_COLORS.length] }))
    .sort((a, b) => b.value - a.value);

  function openPicker() { setSelectedStock(null); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setSelectedStock(null); }
  function handleConfirm(shares: number, price: number) {
    if (!selectedStock) return;
    addHolding({ ticker: selectedStock.ticker, company_name: selectedStock.name, shares, buy_price: price });
    refreshPrices(); closeModal();
  }

  const masiUp = masi ? masi.change >= 0 : true;
  const masiColor = masi ? (masiUp ? t.colors.success : t.colors.danger) : t.colors.textSecondary;
  const showSkeleton = loading && Object.keys(quotes).length === 0 && holdings.length > 0;

  const s = StyleSheet.create({
    masi: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    masiLabel: { ...t.font.micro, color: t.colors.textTertiary },
    masiValue: { fontSize: 24, fontWeight: '800', color: t.colors.text, marginTop: 2 },
    masiChange: { ...t.font.heading },
    masiPct: { ...t.font.caption },
    refresh: { color: t.colors.primary, ...t.font.caption, fontWeight: '600', marginTop: 4 },
    summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sumLabel: { ...t.font.micro, color: t.colors.textTertiary },
    sumVal: { fontSize: 24, fontWeight: '800', color: t.colors.text, marginTop: 2 },
    sumGain: { ...t.font.heading, marginTop: 2 },
    divRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: t.spacing.md, paddingTop: t.spacing.md, borderTopWidth: 1, borderTopColor: t.colors.border },
    error: { color: t.colors.danger, textAlign: 'center', padding: 8, fontSize: 13 },
    list: { padding: t.spacing.lg, paddingBottom: 120, gap: t.spacing.sm },
    legend: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, paddingVertical: 5 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    watchRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.colors.border },
    wBadge: { backgroundColor: t.colors.surface, borderRadius: t.radius.sm, paddingHorizontal: 8, paddingVertical: 5, minWidth: 52, alignItems: 'center' },
    wTicker: { ...t.font.label, color: t.colors.text },
    modal: { flex: 1, backgroundColor: t.colors.bg },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    modalTitle: { ...t.font.heading, color: t.colors.text },
    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.md },
    moverTabs: { flexDirection: 'row', gap: 6 },
    moverTab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: t.radius.pill, backgroundColor: t.colors.surface },
    moverTabOn: { backgroundColor: t.colors.primary },
    moverTabTxt: { ...t.font.caption, fontWeight: '700' },
    mrow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.colors.border },
    mbadge: { backgroundColor: t.colors.surface, borderRadius: t.radius.sm, paddingHorizontal: 8, paddingVertical: 5, minWidth: 56, alignItems: 'center' },
    mticker: { ...t.font.label, color: t.colors.text },
    mname: { ...t.font.body, color: t.colors.text, flex: 1 },
    mlast: { ...t.font.label, color: t.colors.text },
    mvol: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
    posHint: { ...t.font.caption, color: t.colors.textSecondary, textAlign: 'center', paddingVertical: t.spacing.sm },
  });

  const MktRow = ({ m, mode, first }: { m: MarketRow; mode: 'pct' | 'vol'; first?: boolean }) => (
    <TouchableOpacity style={[s.mrow, first && { borderTopWidth: 0 }]} onPress={() => router.push(`/stock/${m.ticker}`)} activeOpacity={0.7}>
      <View style={s.mbadge}><Text style={s.mticker}>{m.ticker}</Text></View>
      <Text style={s.mname} numberOfLines={1}>{nameOf(m.ticker)}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.mlast}>{fmtNum(m.last)}</Text>
        {mode === 'vol'
          ? <Text style={s.mvol}>{compact(m.volume)}</Text>
          : <Badge tone={m.varDay >= 0 ? 'success' : 'danger'}>{fmtPct(m.varDay, 2)}</Badge>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title="Bourse" subtitle="Bourse de Casablanca" large right={<HeaderIconButton icon="add" filled onPress={openPicker} />} />

      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 120, gap: t.spacing.md }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshPrices} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
      >
        {/* MASI index */}
        <Card>
          <View style={s.masi}>
            <View>
              <Text style={s.masiLabel}>MASI · Indice général</Text>
              <Text style={s.masiValue}>{masi ? fmtNum(masi.value) : '— —'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {masi ? (
                <>
                  <Text style={[s.masiChange, { color: masiColor }]}>{masiUp ? '+' : ''}{fmtNum(masi.change)}</Text>
                  <Text style={[s.masiPct, { color: masiColor }]}>{fmtPct(masi.changePercent, 2)}</Text>
                </>
              ) : <Text style={[s.masiChange, { color: t.colors.textSecondary }]}>hors ligne</Text>}
              <TouchableOpacity onPress={refreshPrices} disabled={loading} style={{ marginTop: 4 }}>
                {loading ? <ActivityIndicator color={t.colors.primary} size="small" /> : <Text style={s.refresh}>↻ Actualiser</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Market movers */}
        {market.length > 0 && (
          <Card>
            <View style={s.cardHead}>
              <SectionLabel style={{ marginBottom: 0 }}>Mouvements du marché</SectionLabel>
              <View style={s.moverTabs}>
                {([['gain', 'Hausse'], ['lose', 'Baisse'], ['vol', 'Volume']] as const).map(([k, lbl]) => (
                  <TouchableOpacity key={k} style={[s.moverTab, moverTab === k && s.moverTabOn]} onPress={() => setMoverTab(k)}>
                    <Text style={[s.moverTabTxt, { color: moverTab === k ? t.colors.onPrimary : t.colors.textSecondary }]}>{lbl}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {moverList.map((m, i) => <MktRow key={m.ticker} m={m} mode={moverTab === 'vol' ? 'vol' : 'pct'} first={i === 0} />)}
          </Card>
        )}

        {/* My portfolio */}
        {holdings.length > 0 ? (
          <>
            <Card>
              <View style={s.summary}>
                <View>
                  <Text style={s.sumLabel}>Valeur portefeuille</Text>
                  <Text style={s.sumVal}>{fmtMAD(totalValue)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.sumLabel}>Plus/moins-value</Text>
                  <Text style={[s.sumGain, { color: positive ? t.colors.success : t.colors.danger }]}>{fmtSigned(totalGain)}</Text>
                  <Text style={[s.masiPct, { color: positive ? t.colors.success : t.colors.danger }]}>{fmtPct(gainPct, 2)}</Text>
                </View>
              </View>
              {dividendTotal > 0 && (
                <View style={s.divRow}>
                  <Ionicons name="cash-outline" size={16} color={t.colors.gold} />
                  <Text style={{ ...t.font.caption, color: t.colors.textSecondary, flex: 1 }}>Dividendes reçus</Text>
                  <Text style={{ ...t.font.label, color: t.colors.gold }}>{fmtMAD(dividendTotal)}</Text>
                </View>
              )}
            </Card>

            {alloc.length >= 2 && (
              <Card>
                <SectionLabel>Répartition</SectionLabel>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
                  <Donut size={120} thickness={18} data={alloc.map(a => ({ value: a.value, color: a.color }))} centerLabel={String(holdings.length)} centerSub="actions" />
                  <View style={{ flex: 1, gap: 2 }}>
                    {alloc.map(a => (
                      <View key={a.ticker} style={s.legend}>
                        <View style={[s.dot, { backgroundColor: a.color }]} />
                        <Text style={{ ...t.font.body, color: t.colors.text, flex: 1 }}>{a.ticker.replace('.CS', '')}</Text>
                        <Text style={{ ...t.font.label, color: t.colors.textSecondary }}>{Math.round((a.value / (totalValue || 1)) * 100)}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Card>
            )}

            <View>
              <SectionLabel style={{ marginLeft: 4 }}>Mon portefeuille</SectionLabel>
              {holdings.map(h => <StockRow key={h.id} holding={h} quote={quotes[h.ticker]} />)}
            </View>
          </>
        ) : (
          <Card><Text style={s.posHint}>Aucune position. Touchez + pour investir, ou ⭐ une valeur ci-dessous.</Text></Card>
        )}

        {/* Watchlist */}
        {watchlist.length > 0 && (
          <Card>
            <SectionLabel>Liste de suivi</SectionLabel>
            {watchlist.map((w, idx) => {
              const q = quotes[w.ticker];
              return (
                <TouchableOpacity key={w.ticker} style={[s.watchRow, idx === 0 && { borderTopWidth: 0 }]} onPress={() => router.push(`/stock/${w.ticker}`)}>
                  <View style={s.wBadge}><Text style={s.wTicker}>{w.ticker}</Text></View>
                  <Text style={{ ...t.font.body, color: t.colors.text, flex: 1 }} numberOfLines={1}>{nameOf(w.ticker)}</Text>
                  {q ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ ...t.font.label, color: t.colors.text }}>{fmtNum(q.price)}</Text>
                      <Badge tone={q.change >= 0 ? 'success' : 'danger'}>{fmtPct(q.changePercent, 2)}</Badge>
                    </View>
                  ) : <Text style={{ ...t.font.caption, color: t.colors.textTertiary }}>—</Text>}
                </TouchableOpacity>
              );
            })}
          </Card>
        )}

        {/* Full quote table */}
        <Card>
          <SectionLabel>Toute la cote{market.length ? ` · ${market.length}` : ''}</SectionLabel>
          <View style={{ marginBottom: 4 }}>
            <Field placeholder="Rechercher une valeur…" value={coteQuery} onChangeText={setCoteQuery} />
          </View>
          {cote.length === 0
            ? <Text style={s.posHint}>{loading ? 'Chargement de la cote…' : 'Aucune valeur.'}</Text>
            : cote.map((m, i) => <MktRow key={m.ticker} m={m} mode="pct" first={i === 0} />)}
        </Card>

        {error ? <Text style={s.error}>⚠ {error}</Text> : null}
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <SafeAreaView style={s.modal}>
          <View style={s.modalHead}>
            <Text style={s.modalTitle}>{selectedStock ? "Détails de l'achat" : 'Choisir une action'}</Text>
            <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={24} color={t.colors.textSecondary} /></TouchableOpacity>
          </View>
          {selectedStock
            ? <AmountEntry stock={selectedStock} onConfirm={handleConfirm} onBack={() => setSelectedStock(null)} />
            : <StockPicker onPick={setSelectedStock} />}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
