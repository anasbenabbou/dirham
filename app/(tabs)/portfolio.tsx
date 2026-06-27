import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import StockRow from '../../components/StockRow';
import { useTheme } from '../../theme/ThemeProvider';
import { BVC_STOCKS, BvcStock } from '../../constants/bvcStocks';
import { fmtMAD, fmtNum, fmtSigned, fmtPct } from '../../lib/format';
import { AppHeader, HeaderIconButton, Card, EmptyState, Field, Segmented, Button } from '../../components/ui';

/* ── Step 1: pick a stock ─────────────────────────────────────────────── */
function StockPicker({ onPick }: { onPick: (s: BvcStock) => void }) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q ? BVC_STOCKS.filter(s => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) : BVC_STOCKS;
  }, [query]);
  const sectors = useMemo(() => {
    if (query) return null;
    const map: Record<string, BvcStock[]> = {};
    BVC_STOCKS.forEach(s => { (map[s.sector] ??= []).push(s); });
    return map;
  }, [query]);

  const sp = StyleSheet.create({
    search: { margin: t.spacing.lg, marginBottom: t.spacing.sm },
    sectorHeader: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.md, paddingBottom: 6, ...t.font.micro, color: t.colors.textTertiary },
    item: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 14, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    badge: { backgroundColor: t.colors.primarySoft, borderRadius: t.radius.sm, paddingHorizontal: 8, paddingVertical: 5, minWidth: 54, alignItems: 'center' },
    ticker: { fontWeight: '800', color: t.colors.primary, fontSize: 13 },
    name: { ...t.font.body, color: t.colors.text },
    sector: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={sp.search}>
        <Field placeholder="Rechercher une action…" value={query} onChangeText={setQuery} autoFocus />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled">
        {query
          ? filtered.map(s => (
            <TouchableOpacity key={s.ticker} style={sp.item} onPress={() => onPick(s)}>
              <View style={sp.badge}><Text style={sp.ticker}>{s.ticker}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={sp.name}>{s.name}</Text>
                <Text style={sp.sector}>{s.sector}</Text>
              </View>
            </TouchableOpacity>
          ))
          : Object.entries(sectors ?? {}).map(([sector, stocks]) => (
            <View key={sector}>
              <Text style={sp.sectorHeader}>{sector}</Text>
              {stocks.map(s => (
                <TouchableOpacity key={s.ticker} style={sp.item} onPress={() => onPick(s)}>
                  <View style={sp.badge}><Text style={sp.ticker}>{s.ticker}</Text></View>
                  <Text style={sp.name}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* ── Step 2: enter amount ─────────────────────────────────────────────── */
function AmountEntry({ stock, onConfirm, onBack }: { stock: BvcStock; onConfirm: (shares: number, price: number) => void; onBack: () => void }) {
  const t = useTheme();
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
    wrap: { flex: 1, padding: t.spacing.xl, gap: t.spacing.lg },
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
    <View style={ae.wrap}>
      <View style={ae.header}>
        <View style={ae.bigBadge}><Text style={ae.bigTicker}>{stock.ticker}</Text></View>
        <Text style={ae.name}>{stock.name}</Text>
        {suggestedPrice && <Text style={ae.live}>Prix actuel : {fmtNum(suggestedPrice)} MAD</Text>}
      </View>

      <Segmented
        value={mode}
        onChange={setMode}
        options={[{ value: 'amount', label: 'Par montant' }, { value: 'shares', label: "Par actions" }]}
      />

      {mode === 'amount'
        ? <Field label="Montant investi (MAD)" placeholder="ex: 5000" value={totalMAD} onChangeText={setTotalMAD} keyboardType="decimal-pad" autoFocus />
        : <Field label="Nombre d'actions" placeholder="ex: 10" value={sharesVal} onChangeText={setSharesVal} keyboardType="decimal-pad" autoFocus />}

      <View>
        <Field
          label="Prix d'achat par action (MAD)"
          placeholder={suggestedPrice ? `Prix actuel: ${fmtNum(suggestedPrice)}` : 'ex: 245.50'}
          value={priceVal} onChangeText={setPriceVal} keyboardType="decimal-pad"
        />
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
    </View>
  );
}

/* ── Main screen ──────────────────────────────────────────────────────── */
export default function PortfolioScreen() {
  const t = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<BvcStock | null>(null);
  const { holdings, quotes, masi, loading, error, loadHoldings, addHolding, refreshPrices } = usePortfolioStore();

  useEffect(() => { loadHoldings(); refreshPrices(); }, []);

  const totalValue = holdings.reduce((s, h) => s + h.shares * (quotes[h.ticker]?.price ?? h.buy_price), 0);
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.buy_price, 0);
  const totalGain = totalValue - totalCost;
  const gainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const positive = totalGain >= 0;

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
    masi: { marginHorizontal: t.spacing.lg, marginTop: t.spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    masiLabel: { ...t.font.micro, color: t.colors.textTertiary },
    masiValue: { fontSize: 24, fontWeight: '800', color: t.colors.text, marginTop: 2 },
    masiChange: { ...t.font.heading },
    masiPct: { ...t.font.caption },
    refresh: { color: t.colors.primary, ...t.font.caption, fontWeight: '600', marginTop: 4 },
    summary: { marginHorizontal: t.spacing.lg, marginTop: t.spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sumLabel: { ...t.font.micro, color: t.colors.textTertiary },
    sumVal: { fontSize: 24, fontWeight: '800', color: t.colors.text, marginTop: 2 },
    sumGain: { ...t.font.heading, marginTop: 2 },
    error: { color: t.colors.danger, textAlign: 'center', padding: 8, fontSize: 13 },
    list: { padding: t.spacing.lg, paddingBottom: 120, gap: t.spacing.sm },
    // modal
    modal: { flex: 1, backgroundColor: t.colors.bg },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    modalTitle: { ...t.font.heading, color: t.colors.text },
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title="Bourse" subtitle="Bourse de Casablanca" large right={<HeaderIconButton icon="add" filled onPress={openPicker} />} />

      <FlatList
        data={holdings}
        keyExtractor={h => String(h.id)}
        renderItem={({ item }) => <StockRow holding={item} quote={quotes[item.ticker]} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: t.spacing.md, marginBottom: t.spacing.sm }}>
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

            {holdings.length > 0 && (
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
              </Card>
            )}

            {error ? <Text style={s.error}>⚠ {error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="trending-up" size={30} color={t.colors.textSecondary} />}
            title="Portefeuille vide"
            subtitle="Appuyez sur + pour ajouter vos actions cotées à la Bourse de Casablanca."
          />
        }
      />

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
