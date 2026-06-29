import { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, HeaderIconButton, Card, SectionLabel, Button, Field, Sheet, Badge, LineChart, useToast } from '../../components/ui';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useTheme } from '../../theme/ThemeProvider';
import { fmtMAD, fmtNum, fmtPct, fmtSigned } from '../../lib/format';
import { fetchHistory, Candle } from '../../api/mansa';
import { nameForSymbol } from '../../db/instruments';
import { haptic } from '../../lib/haptics';
import { holdingPrice } from '../../lib/finance';

const RANGES = [
  { key: '1M', n: 22 }, { key: '3M', n: 66 }, { key: '6M', n: 132 }, { key: '1A', n: 252 },
] as const;

function compact(n: number | null | undefined): string {
  if (n == null) return '—';
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + ' Md';
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' M';
  if (a >= 1e3) return Math.round(n / 1e3) + ' K';
  return String(Math.round(n));
}

export default function StockDetailScreen() {
  const t = useTheme();
  const toast = useToast();
  const W = Dimensions.get('window').width - 32 - 36;
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const tk = ticker ?? '';
  const {
    holdings, quotes, market, dividends, watchlist,
    loadHoldings, loadDividends, loadWatchlist, removeHolding,
    addDividend, removeDividend, watch, unwatch, refreshPrices,
  } = usePortfolioStore();

  const [history, setHistory] = useState<Candle[] | null>(null);
  const [range, setRange] = useState<typeof RANGES[number]['key']>('3M');
  const [showDiv, setShowDiv] = useState(false);
  const [divAmt, setDivAmt] = useState('');
  const [divDate, setDivDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadHoldings(); loadDividends(); loadWatchlist();
    if (usePortfolioStore.getState().market.length === 0) refreshPrices();
    let alive = true;
    fetchHistory(tk).then(h => { if (alive) setHistory(h); });
    return () => { alive = false; };
  }, [tk]);

  const m = market.find(x => x.ticker === tk);
  const quote = quotes[tk];
  const holding = holdings.find(h => h.ticker === tk);
  const name = m?.name || nameForSymbol(tk) || quote?.name || tk;
  const watched = watchlist.some(w => w.ticker === tk);
  const myDivs = dividends.filter(d => d.ticker === tk);
  const divTotal = myDivs.reduce((s, d) => s + d.amount, 0);

  const price = holding ? holdingPrice(holding, quotes) : m?.last ?? quote?.price ?? 0;
  const varDay = m?.varDay ?? quote?.changePercent ?? 0;
  const dayUp = varDay >= 0;

  const series = useMemo(() => (history ?? []).slice(-RANGES.find(r => r.key === range)!.n), [history, range]);
  const closes = series.map(c => c.close);
  const chartUp = closes.length > 1 ? closes[closes.length - 1] >= closes[0] : dayUp;
  const periodHigh = closes.length ? Math.max(...closes) : null;
  const periodLow = closes.length ? Math.min(...closes) : null;
  const liquidityTone = m?.volume == null ? 'neutral' : m.volume < 100_000 ? 'danger' : m.volume < 1_000_000 ? 'neutral' : 'success';
  const liquidityLabel = m?.volume == null ? 'Volume indisponible' : m.volume < 100_000 ? 'Risque liquidité élevé' : m.volume < 1_000_000 ? 'Liquidité moyenne' : 'Liquidité correcte';

  // position
  const value = holding ? holding.shares * price : 0;
  const invested = holding ? holding.shares * holding.buy_price : 0;
  const gain = value - invested;
  const gainPct = invested > 0 ? (gain / invested) * 100 : 0;
  const distanceFromCost = holding ? ((price - holding.buy_price) / holding.buy_price) * 100 : null;

  function addDiv() {
    const amt = parseFloat(divAmt);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Montant invalide'); return; }
    addDividend({ ticker: tk, amount: amt, date: divDate, note: '' });
    haptic.success(); toast({ message: 'Dividende ajouté.', tone: 'success' });
    setShowDiv(false); setDivAmt('');
  }
  function confirmRemoveHolding() {
    Alert.alert('Retirer du portefeuille ?', name, [
      { text: 'Retirer', style: 'destructive', onPress: () => { removeHolding(holding!.id); toast({ message: 'Position retirée.' }); } },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  const s = StyleSheet.create({
    body: { padding: t.spacing.lg, paddingBottom: 60, gap: t.spacing.md },
    name: { ...t.font.body, color: t.colors.textSecondary },
    priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: t.spacing.md, marginTop: 4 },
    price: { fontSize: 34, fontWeight: '800', color: t.colors.text },
    rangeRow: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.md },
    rangeBtn: { flex: 1, paddingVertical: 7, borderRadius: t.radius.sm, alignItems: 'center', backgroundColor: t.colors.surface },
    rangeOn: { backgroundColor: t.colors.primary },
    rangeTxt: { ...t.font.caption, fontWeight: '700' },
    chartWrap: { height: 150, justifyContent: 'center', marginTop: t.spacing.sm },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    stat: { width: '50%', paddingVertical: 9 },
    statLabel: { ...t.font.micro, color: t.colors.textTertiary },
    statVal: { ...t.font.heading, color: t.colors.text, marginTop: 3 },
    divHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.sm },
    divRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.colors.border },
    signal: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 11, borderTopWidth: 1, borderTopColor: t.colors.border },
    signalIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surface },
    signalText: { flex: 1, minWidth: 0 },
    signalTitle: { ...t.font.label, color: t.colors.text },
    signalNote: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
  });

  const Stat = ({ label, value: v }: { label: string; value: string }) => (
    <View style={s.stat}><Text style={s.statLabel}>{label}</Text><Text style={s.statVal}>{v}</Text></View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader
        title={tk} showBack
        right={<HeaderIconButton icon={watched ? 'star' : 'star-outline'} tint={watched ? t.colors.gold : undefined}
          onPress={() => { haptic.select(); watched ? unwatch(tk) : watch(tk, name); }} />}
      />
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* Price + chart */}
        <Card>
          <Text style={s.name} numberOfLines={1}>{name}</Text>
          <View style={s.priceRow}>
            <Text style={s.price}>{fmtNum(price)} <Text style={{ fontSize: 15, color: t.colors.textSecondary }}>MAD</Text></Text>
            <View style={{ marginBottom: 4 }}><Badge tone={dayUp ? 'success' : 'danger'}>{fmtPct(varDay, 2)} auj.</Badge></View>
          </View>

          <View style={s.chartWrap}>
            {history === null ? (
              <ActivityIndicator color={t.colors.primary} />
            ) : closes.length > 1 ? (
              <LineChart data={closes} width={W} height={150}
                color={chartUp ? t.colors.success : t.colors.danger}
                labels={[series[0].date.slice(2), series[series.length - 1].date.slice(2)]} />
            ) : (
              <Text style={{ color: t.colors.textSecondary, textAlign: 'center' }}>Historique indisponible.</Text>
            )}
          </View>

          <View style={s.rangeRow}>
            {RANGES.map(r => (
              <TouchableOpacity key={r.key} style={[s.rangeBtn, range === r.key && s.rangeOn]} onPress={() => setRange(r.key)}>
                <Text style={[s.rangeTxt, { color: range === r.key ? t.colors.onPrimary : t.colors.textSecondary }]}>{r.key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Full stats */}
        <Card>
          <SectionLabel>Données du marché</SectionLabel>
          <View style={s.statGrid}>
            <Stat label="Ouverture" value={m?.open != null ? fmtNum(m.open) : '—'} />
            <Stat label="Clôture veille" value={m?.prevClose != null ? fmtNum(m.prevClose) : '—'} />
            <Stat label="+ Haut (jour)" value={m?.high != null ? fmtNum(m.high) : '—'} />
            <Stat label="+ Bas (jour)" value={m?.low != null ? fmtNum(m.low) : '—'} />
            <Stat label={`+ Haut (${range})`} value={periodHigh != null ? fmtNum(periodHigh) : '—'} />
            <Stat label={`+ Bas (${range})`} value={periodLow != null ? fmtNum(periodLow) : '—'} />
            <Stat label="Volume (MAD)" value={compact(m?.volume)} />
            <Stat label="Capitalisation" value={compact(m?.marketCap)} />
            <Stat label="Var. jour" value={fmtPct(varDay, 2)} />
            <Stat label="Var. année" value={m?.varYear != null ? fmtPct(m.varYear, 2) : '—'} />
          </View>
        </Card>

        <Card>
          <SectionLabel>Intelligence</SectionLabel>
          <View style={[s.signal, { borderTopWidth: 0 }]}>
            <View style={s.signalIcon}><Ionicons name="water-outline" size={17} color={liquidityTone === 'danger' ? t.colors.danger : t.colors.primary} /></View>
            <View style={s.signalText}>
              <Text style={s.signalTitle}>Liquidité</Text>
              <Text style={s.signalNote}>Volume: {compact(m?.volume)} MAD</Text>
            </View>
            <Badge tone={liquidityTone}>{liquidityLabel}</Badge>
          </View>
          <View style={s.signal}>
            <View style={s.signalIcon}><Ionicons name="calendar-outline" size={17} color={t.colors.primary} /></View>
            <View style={s.signalText}>
              <Text style={s.signalTitle}>Performance annuelle</Text>
              <Text style={s.signalNote}>Variation YTD fournie par la Bourse de Casablanca.</Text>
            </View>
            <Text style={{ ...t.font.label, color: (m?.varYear ?? 0) >= 0 ? t.colors.success : t.colors.danger }}>{m?.varYear != null ? fmtPct(m.varYear, 2) : '—'}</Text>
          </View>
          {holding && (
            <View style={s.signal}>
              <View style={s.signalIcon}><Ionicons name="analytics-outline" size={17} color={t.colors.primary} /></View>
              <View style={s.signalText}>
                <Text style={s.signalTitle}>Distance du coût</Text>
                <Text style={s.signalNote}>Prix moyen: {fmtNum(holding.buy_price)} MAD · actuel: {fmtNum(price)} MAD</Text>
              </View>
              <Text style={{ ...t.font.label, color: (distanceFromCost ?? 0) >= 0 ? t.colors.success : t.colors.danger }}>{distanceFromCost != null ? fmtPct(distanceFromCost, 2) : '—'}</Text>
            </View>
          )}
          <View style={s.signal}>
            <View style={s.signalIcon}><Ionicons name="cash-outline" size={17} color={t.colors.gold} /></View>
            <View style={s.signalText}>
              <Text style={s.signalTitle}>Dividendes</Text>
              <Text style={s.signalNote}>{myDivs.length ? `${myDivs.length} paiement(s) enregistré(s)` : 'Aucun historique local enregistré'}</Text>
            </View>
            <Text style={{ ...t.font.label, color: divTotal > 0 ? t.colors.success : t.colors.textTertiary }}>{fmtMAD(divTotal)}</Text>
          </View>
        </Card>

        {/* Position */}
        {holding && (
          <Card>
            <SectionLabel>Ma position</SectionLabel>
            <View style={s.statGrid}>
              <Stat label="Quantité" value={String(holding.shares)} />
              <Stat label="Prix d'achat moy." value={fmtNum(holding.buy_price)} />
              <Stat label="Investi" value={fmtMAD(invested)} />
              <Stat label="Valeur" value={fmtMAD(value)} />
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.lg, marginTop: 4 }}>
              <View style={s.stat}><Text style={s.statLabel}>Plus/moins-value</Text><Text style={[s.statVal, { color: gain >= 0 ? t.colors.success : t.colors.danger }]}>{fmtSigned(gain)}</Text></View>
              <View style={s.stat}><Text style={s.statLabel}>Rendement</Text><Text style={[s.statVal, { color: gain >= 0 ? t.colors.success : t.colors.danger }]}>{fmtPct(gainPct, 2)}</Text></View>
            </View>
            <Button label="Retirer du portefeuille" variant="danger" icon="trash-outline" onPress={confirmRemoveHolding} style={{ marginTop: t.spacing.md }} />
          </Card>
        )}

        {/* Dividends */}
        <Card>
          <View style={s.divHead}>
            <SectionLabel style={{ marginBottom: 0 }}>Dividendes reçus</SectionLabel>
            <TouchableOpacity onPress={() => setShowDiv(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="add" size={16} color={t.colors.primary} />
              <Text style={{ ...t.font.label, color: t.colors.primary }}>Ajouter</Text>
            </TouchableOpacity>
          </View>
          {myDivs.length === 0 ? (
            <Text style={{ ...t.font.caption, color: t.colors.textTertiary, paddingVertical: 6 }}>Aucun dividende enregistré.</Text>
          ) : (
            <>
              {myDivs.map(d => (
                <TouchableOpacity key={d.id} style={s.divRow} onLongPress={() => removeDividend(d.id)}>
                  <Text style={{ ...t.font.body, color: t.colors.text }}>{d.date}</Text>
                  <Text style={{ ...t.font.body, fontWeight: '700', color: t.colors.success }}>{fmtSigned(d.amount)}</Text>
                </TouchableOpacity>
              ))}
              <View style={[s.divRow, { borderTopColor: t.colors.borderStrong }]}>
                <Text style={{ ...t.font.label, color: t.colors.textSecondary }}>Total</Text>
                <Text style={{ ...t.font.heading, color: t.colors.success }}>{fmtMAD(divTotal)}</Text>
              </View>
            </>
          )}
        </Card>

        {!holding && (
          <Text style={{ ...t.font.caption, color: t.colors.textTertiary, textAlign: 'center' }}>
            Ajoutez cette valeur à votre portefeuille avec le bouton + de l'onglet Bourse, puis suivez-la dans la page Portefeuille.
          </Text>
        )}
      </ScrollView>

      <Sheet visible={showDiv} onClose={() => setShowDiv(false)} title="Ajouter un dividende">
        <Field label="Montant reçu (MAD)" placeholder="0" value={divAmt} onChangeText={setDivAmt} keyboardType="decimal-pad" big autoFocus />
        <View style={{ marginTop: t.spacing.lg }}>
          <Field label="Date" placeholder="2026-01-01" value={divDate} onChangeText={setDivDate} />
        </View>
        <View style={{ flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.lg }}>
          <Button label="Annuler" variant="secondary" onPress={() => setShowDiv(false)} style={{ flex: 1 }} full={false} />
          <Button label="Ajouter" icon="checkmark" onPress={addDiv} style={{ flex: 2 }} full={false} />
        </View>
      </Sheet>
    </View>
  );
}
