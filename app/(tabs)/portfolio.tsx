import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, Alert, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useTheme } from '../../theme/ThemeProvider';
import { BvcStock } from '../../constants/bvcStocks';
import CompanyAvatar from '../../components/CompanyAvatar';
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
import { fmtMAD, fmtNum, fmtPct } from '../../lib/format';
import { AppHeader, HeaderIconButton, Card, Field, Segmented, Button, SectionLabel, Badge } from '../../components/ui';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<BvcStock | null>(null);
  const [moverTab, setMoverTab] = useState<'gain' | 'lose' | 'vol'>('gain');
  const [coteQuery, setCoteQuery] = useState('');
  const {
    holdings, quotes, market, masi, loading, error, watchlist, instruments,
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

  function openPicker() { setSelectedStock(null); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setSelectedStock(null); }
  function handleConfirm(shares: number, price: number) {
    if (!selectedStock) return;
    addHolding({ ticker: selectedStock.ticker, company_name: selectedStock.name, shares, buy_price: price });
    refreshPrices(); closeModal();
  }

  const masiUp = masi ? masi.change >= 0 : true;
  const masiColor = masi ? (masiUp ? t.colors.success : t.colors.danger) : t.colors.textSecondary;
  const s = StyleSheet.create({
    heroCard: { backgroundColor: t.colors.cardAlt, borderColor: t.colors.borderStrong },
    masi: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    masiLabel: { ...t.font.micro, color: t.colors.textTertiary },
    masiValue: { fontSize: 34, fontWeight: '800', color: t.colors.text, marginTop: 2 },
    masiChange: { ...t.font.heading },
    masiPct: { ...t.font.caption },
    refresh: { color: t.colors.gold, ...t.font.caption, fontWeight: '700', marginTop: 6 },
    heroStats: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.lg },
    heroStat: { flex: 1, backgroundColor: t.colors.surface, borderRadius: t.radius.md, padding: 12 },
    heroStatLabel: { ...t.font.micro, color: t.colors.textTertiary },
    heroStatValue: { ...t.font.label, color: t.colors.text, marginTop: 4 },
    smartRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.colors.border },
    smartIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.primarySoft },
    error: { color: t.colors.danger, textAlign: 'center', padding: 8, fontSize: 13 },
    list: { padding: t.spacing.lg, paddingBottom: 120, gap: t.spacing.sm },
    watchRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.colors.border },
    wBadge: { backgroundColor: t.colors.surface, borderRadius: t.radius.sm, paddingHorizontal: 8, paddingVertical: 5, minWidth: 52, alignItems: 'center' },
    wTicker: { ...t.font.label, color: t.colors.text },
    modal: { flex: 1, backgroundColor: t.colors.bg },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    modalTitle: { ...t.font.heading, color: t.colors.text },
    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.md },
    moverTabs: { flexDirection: 'row', gap: 6, backgroundColor: t.colors.surface, borderRadius: t.radius.pill, padding: 3 },
    moverTab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: t.radius.pill },
    moverTabOn: { backgroundColor: t.colors.card },
    moverTabTxt: { ...t.font.caption, fontWeight: '700' },
    mrow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.colors.border },
    midentity: { flex: 1, minWidth: 0 },
    mticker: { ...t.font.label, color: t.colors.text },
    mname: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
    mlast: { fontSize: 15, fontWeight: '800', color: t.colors.text },
    mvol: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
    quoteHead: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    quoteHeadTxt: { ...t.font.micro, color: t.colors.textTertiary },
    posHint: { ...t.font.caption, color: t.colors.textSecondary, textAlign: 'center', paddingVertical: t.spacing.sm },
  });

  const MktRow = ({ m, mode, first }: { m: MarketRow; mode: 'pct' | 'vol'; first?: boolean }) => (
    <TouchableOpacity style={[s.mrow, first && { borderTopWidth: 0 }]} onPress={() => router.push(`/stock/${m.ticker}`)} activeOpacity={0.7}>
      <CompanyAvatar ticker={m.ticker} size={38} />
      <View style={s.midentity}>
        <Text style={s.mticker}>{m.ticker}</Text>
        <Text style={s.mname} numberOfLines={1}>{nameOf(m.ticker)}</Text>
      </View>
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
        <Card style={s.heroCard}>
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
          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>Valeurs</Text>
              <Text style={s.heroStatValue}>{market.length || '—'}</Text>
            </View>
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>Top volume</Text>
              <Text style={s.heroStatValue} numberOfLines={1}>{active[0]?.ticker ?? '—'}</Text>
            </View>
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>Leader</Text>
              <Text style={[s.heroStatValue, { color: gainers[0]?.varDay >= 0 ? t.colors.success : t.colors.text }]} numberOfLines={1}>
                {gainers[0] ? `${gainers[0].ticker} ${fmtPct(gainers[0].varDay, 1)}` : '—'}
              </Text>
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

        {/* Portfolio entry point */}
        <Card onPress={() => router.push('/my-portfolio')}>
          <View style={s.smartRow}>
            <View style={s.smartIcon}><Ionicons name="briefcase-outline" size={18} color={t.colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...t.font.label, color: t.colors.text }}>Portefeuille dédié</Text>
              <Text style={{ ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 }}>
                {holdings.length > 0 ? `${holdings.length} lignes · valeur, impôts, frais et dividendes` : 'Importez ou ajoutez vos positions pour suivre le cash liquidable.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.colors.textTertiary} />
          </View>
        </Card>

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
          {cote.length > 0 && (
            <View style={s.quoteHead}>
              <Text style={[s.quoteHeadTxt, { flex: 1 }]}>Paire</Text>
              <Text style={[s.quoteHeadTxt, { width: 86, textAlign: 'right' }]}>Dernier</Text>
              <Text style={[s.quoteHeadTxt, { width: 76, textAlign: 'right' }]}>24h</Text>
            </View>
          )}
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
