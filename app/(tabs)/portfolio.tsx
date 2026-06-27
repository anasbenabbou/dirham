import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import StockRow from '../../components/StockRow';
import { Colors } from '../../constants/colors';
import { BVC_STOCKS, BvcStock } from '../../constants/bvcStocks';

const fmtMAD = (n: number) =>
  n.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });

const fmtIdx = (n: number) =>
  n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Step 1: pick a stock ────────────────────────────────────────────────────
function StockPicker({ onPick }: { onPick: (s: BvcStock) => void }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q ? BVC_STOCKS.filter(s =>
      s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ) : BVC_STOCKS;
  }, [query]);

  // group by sector
  const sectors = useMemo(() => {
    if (query) return null;
    const map: Record<string, BvcStock[]> = {};
    BVC_STOCKS.forEach(s => { (map[s.sector] ??= []).push(s); });
    return map;
  }, [query]);

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={sp.search}
        placeholder="Rechercher une action..."
        placeholderTextColor={Colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        autoFocus
      />
      <ScrollView>
        {query ? (
          filtered.map(s => (
            <TouchableOpacity key={s.ticker} style={sp.item} onPress={() => onPick(s)}>
              <View style={sp.badge}><Text style={sp.ticker}>{s.ticker}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={sp.name}>{s.name}</Text>
                <Text style={sp.sector}>{s.sector}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          Object.entries(sectors ?? {}).map(([sector, stocks]) => (
            <View key={sector}>
              <Text style={sp.sectorHeader}>{sector}</Text>
              {stocks.map(s => (
                <TouchableOpacity key={s.ticker} style={sp.item} onPress={() => onPick(s)}>
                  <View style={sp.badge}><Text style={sp.ticker}>{s.ticker}</Text></View>
                  <Text style={sp.name}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const sp = StyleSheet.create({
  search: { margin: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: 15, backgroundColor: Colors.card, color: Colors.text },
  sectorHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6, fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  badge: { backgroundColor: Colors.primary + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 52, alignItems: 'center' },
  ticker: { fontWeight: '700', color: Colors.primary, fontSize: 13 },
  name: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  sector: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});

// ── Step 2: enter amount ────────────────────────────────────────────────────
function AmountEntry({
  stock, onConfirm, onBack,
}: { stock: BvcStock; onConfirm: (shares: number, price: number) => void; onBack: () => void }) {
  const [mode, setMode] = useState<'amount' | 'shares'>('amount');
  const [totalMAD, setTotalMAD] = useState('');
  const [sharesVal, setSharesVal] = useState('');
  const [priceVal, setPriceVal] = useState('');

  const quote = usePortfolioStore(s => s.quotes[stock.ticker]);
  const suggestedPrice = quote?.price;

  function handleConfirm() {
    const price = parseFloat(priceVal);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Prix requis', 'Entrez le prix d\'achat par action.'); return;
    }
    if (mode === 'amount') {
      const total = parseFloat(totalMAD);
      if (isNaN(total) || total <= 0) {
        Alert.alert('Montant invalide', 'Entrez le montant investi.'); return;
      }
      onConfirm(total / price, price);
    } else {
      const shares = parseFloat(sharesVal);
      if (isNaN(shares) || shares <= 0) {
        Alert.alert('Quantité invalide', 'Entrez le nombre d\'actions.'); return;
      }
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
    } else {
      const shares = parseFloat(sharesVal);
      if (isNaN(shares) || shares <= 0) return null;
      return { shares, total: shares * price };
    }
  })();

  return (
    <View style={ae.wrap}>
      {/* Stock header */}
      <View style={ae.stockHeader}>
        <View style={ae.bigBadge}><Text style={ae.bigTicker}>{stock.ticker}</Text></View>
        <Text style={ae.stockName}>{stock.name}</Text>
        {suggestedPrice && <Text style={ae.livePrice}>Prix actuel: {suggestedPrice.toFixed(2)} MAD</Text>}
      </View>

      {/* Mode toggle */}
      <View style={ae.toggle}>
        <TouchableOpacity style={[ae.toggleBtn, mode === 'amount' && ae.toggleActive]} onPress={() => setMode('amount')}>
          <Text style={[ae.toggleTxt, mode === 'amount' && ae.toggleActiveTxt]}>Par montant (MAD)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ae.toggleBtn, mode === 'shares' && ae.toggleActive]} onPress={() => setMode('shares')}>
          <Text style={[ae.toggleTxt, mode === 'shares' && ae.toggleActiveTxt]}>Par actions</Text>
        </TouchableOpacity>
      </View>

      {mode === 'amount' ? (
        <View style={ae.inputGroup}>
          <Text style={ae.label}>Montant investi (MAD)</Text>
          <TextInput style={ae.input} placeholder="ex: 5000" placeholderTextColor={Colors.textSecondary} value={totalMAD} onChangeText={setTotalMAD} keyboardType="decimal-pad" autoFocus />
        </View>
      ) : (
        <View style={ae.inputGroup}>
          <Text style={ae.label}>Nombre d'actions</Text>
          <TextInput style={ae.input} placeholder="ex: 10" placeholderTextColor={Colors.textSecondary} value={sharesVal} onChangeText={setSharesVal} keyboardType="decimal-pad" autoFocus />
        </View>
      )}

      <View style={ae.inputGroup}>
        <Text style={ae.label}>Prix d'achat par action (MAD)</Text>
        <TextInput
          style={ae.input}
          placeholder={suggestedPrice ? `Prix actuel: ${suggestedPrice.toFixed(2)}` : 'ex: 245.50'}
          placeholderTextColor={Colors.textSecondary}
          value={priceVal}
          onChangeText={setPriceVal}
          keyboardType="decimal-pad"
        />
        {suggestedPrice && !priceVal && (
          <TouchableOpacity onPress={() => setPriceVal(suggestedPrice.toFixed(2))}>
            <Text style={ae.useCurrentPrice}>↑ Utiliser le prix actuel</Text>
          </TouchableOpacity>
        )}
      </View>

      {preview && (
        <View style={ae.preview}>
          <Text style={ae.previewTxt}>
            {preview.shares.toFixed(preview.shares % 1 === 0 ? 0 : 2)} actions · {fmtMAD(preview.total)}
          </Text>
        </View>
      )}

      <View style={ae.actions}>
        <TouchableOpacity style={ae.backBtn} onPress={onBack}>
          <Text style={ae.backTxt}>← Changer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ae.confirmBtn} onPress={handleConfirm}>
          <Text style={ae.confirmTxt}>Ajouter ✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ae = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 16 },
  stockHeader: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  bigBadge: { backgroundColor: Colors.primary + '20', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  bigTicker: { fontWeight: '800', color: Colors.primary, fontSize: 22 },
  stockName: { fontSize: 18, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  livePrice: { fontSize: 14, color: Colors.success, fontWeight: '500' },
  toggle: { flexDirection: 'row', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  toggleBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: Colors.card },
  toggleActive: { backgroundColor: Colors.primary },
  toggleTxt: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  toggleActiveTxt: { color: '#fff' },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, fontSize: 20, fontWeight: '600', backgroundColor: Colors.card, color: Colors.text },
  useCurrentPrice: { color: Colors.primary, fontSize: 13, fontWeight: '500', marginTop: 4 },
  preview: { backgroundColor: Colors.primary + '15', borderRadius: 10, padding: 12, alignItems: 'center' },
  previewTxt: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, alignItems: 'center' },
  backTxt: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
  confirmBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  confirmTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

// ── Main screen ─────────────────────────────────────────────────────────────
export default function PortfolioScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<BvcStock | null>(null);
  const { holdings, quotes, masi, loading, error, loadHoldings, addHolding, refreshPrices } = usePortfolioStore();

  useEffect(() => { loadHoldings(); refreshPrices(); }, []);

  const totalValue = holdings.reduce((s, h) => s + h.shares * (quotes[h.ticker]?.price ?? h.buy_price), 0);
  const totalCost  = holdings.reduce((s, h) => s + h.shares * h.buy_price, 0);
  const totalGain  = totalValue - totalCost;
  const gainPct    = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  function openPicker() { setSelectedStock(null); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setSelectedStock(null); }

  function handleConfirm(shares: number, price: number) {
    if (!selectedStock) return;
    addHolding({ ticker: selectedStock.ticker, company_name: selectedStock.name, shares, buy_price: price });
    refreshPrices();
    closeModal();
  }

  const masiColor = masi ? (masi.change >= 0 ? Colors.success : Colors.danger) : Colors.textSecondary;

  return (
    <SafeAreaView style={s.container}>
      {/* MASI Banner */}
      <View style={s.masiBanner}>
        <View>
          <Text style={s.masiLabel}>MASI — Bourse de Casablanca</Text>
          {masi ? (
            <Text style={s.masiValue}>{fmtIdx(masi.value)}</Text>
          ) : (
            <Text style={s.masiValue}>— —</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {masi ? (
            <>
              <Text style={[s.masiChange, { color: masiColor }]}>
                {masi.change >= 0 ? '+' : ''}{fmtIdx(masi.change)}
              </Text>
              <Text style={[s.masiPct, { color: masiColor }]}>
                {masi.changePercent >= 0 ? '+' : ''}{masi.changePercent.toFixed(2)}%
              </Text>
            </>
          ) : (
            <Text style={[s.masiChange, { color: Colors.textSecondary }]}>hors ligne</Text>
          )}
          <TouchableOpacity onPress={refreshPrices} disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.refreshTxt}>↻ Actualiser</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Portfolio summary */}
      {holdings.length > 0 && (
        <View style={s.summary}>
          <View>
            <Text style={s.sumLabel}>Valeur portefeuille</Text>
            <Text style={s.sumVal}>{fmtMAD(totalValue)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.sumLabel}>P&L total</Text>
            <Text style={[s.sumGain, { color: totalGain >= 0 ? Colors.success : Colors.danger }]}>
              {totalGain >= 0 ? '+' : ''}{fmtMAD(totalGain)}
            </Text>
            <Text style={[s.gainPct, { color: totalGain >= 0 ? Colors.success : Colors.danger }]}>
              {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
            </Text>
          </View>
        </View>
      )}

      {error ? <Text style={s.error}>⚠️ {error}</Text> : null}

      <FlatList
        data={holdings}
        keyExtractor={h => String(h.id)}
        renderItem={({ item }) => <StockRow holding={item} quote={quotes[item.ticker]} />}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>📈 Mon portefeuille BVC</Text>
            <Text style={s.empty}>Appuyez sur + pour ajouter vos actions{'\n'}cotées à la Bourse de Casablanca.</Text>
          </View>
        }
      />

      <TouchableOpacity style={s.fab} onPress={openPicker}>
        <Text style={s.fabTxt}>+</Text>
      </TouchableOpacity>

      {/* Add stock modal — 2 steps */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>
              {selectedStock ? 'Détails de l\'achat' : 'Choisir une action'}
            </Text>
            <TouchableOpacity onPress={closeModal} style={s.closeBtn}>
              <Text style={s.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedStock ? (
            <AmountEntry
              stock={selectedStock}
              onConfirm={handleConfirm}
              onBack={() => setSelectedStock(null)}
            />
          ) : (
            <StockPicker onPick={setSelectedStock} />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  masiBanner: {
    backgroundColor: '#0F2A47',
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  masiLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  masiValue: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 2 },
  masiChange: { fontSize: 15, fontWeight: '700' },
  masiPct: { fontSize: 13, fontWeight: '500' },
  refreshTxt: { color: Colors.tabBarActive, fontSize: 12, fontWeight: '500' },
  summary: {
    backgroundColor: Colors.card, margin: 12, borderRadius: 14,
    padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  sumLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  sumVal: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 2 },
  sumGain: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  gainPct: { fontSize: 13, fontWeight: '500' },
  error: { color: Colors.danger, textAlign: 'center', padding: 8, fontSize: 13 },
  list: { padding: 12, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  empty: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  fabTxt: { color: '#fff', fontSize: 30, lineHeight: 34 },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  closeBtn: { padding: 4 },
  closeTxt: { fontSize: 18, color: Colors.textSecondary },
});
