import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppHeader, Card, SectionLabel, Segmented, Badge, Donut, Bars, LineChart } from '../components/ui';
import CompanyAvatar from '../components/CompanyAvatar';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useAccountsStore } from '../store/useAccountsStore';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD, fmtPct, fmtSigned } from '../lib/format';
import { usePrivacyMask } from '../lib/usePrivacyMask';
import { holdingPrice } from '../lib/finance';
import { fetchHistory, Candle } from '../api/mansa';
import {
  MOROCCO_CAPITAL_GAINS_TAX_RATE,
  MOROCCO_DIVIDEND_TAX_RATE_2025,
  MOROCCO_SECURITIES_SALE_EXEMPTION_THRESHOLD,
  SIMPLE_SELL_FEE_RATE,
  buildDividendWaterfall,
  buildPortfolioIntelligence,
} from '../lib/portfolioIntelligence';

const ALLOC_COLORS = ['#3D7BFF', '#0ECB81', '#F0B90B', '#FF6FD8', '#8B7CFF', '#3DD6C4', '#FF8A3D', '#5CC8FF'];

export default function DedicatedPortfolioScreen() {
  const t = useTheme();
  const { maskMAD, maskSigned } = usePrivacyMask();
  const W = Dimensions.get('window').width - 32 - 36;
  const [mode, setMode] = useState<'net' | 'gross'>('net');
  const [histories, setHistories] = useState<Record<string, Candle[]>>({});
  const { accounts, load: loadAccounts } = useAccountsStore();
  const {
    holdings, quotes, dividends, loading, instruments, masi,
    loadHoldings, loadDividends, loadInstruments, refreshPrices,
  } = usePortfolioStore();

  useEffect(() => { loadAccounts(); loadHoldings(); loadDividends(); loadInstruments(); refreshPrices(); }, []);
  useEffect(() => {
    let alive = true;
    const tickers = holdings
      .map(h => h.ticker)
      .filter(tk => !tk.includes('-') && !histories[tk])
      .slice(0, 6);
    if (tickers.length === 0) return;
    Promise.all(tickers.map(tk => fetchHistory(tk, 2).then(h => [tk, h] as const))).then(rows => {
      if (!alive) return;
      setHistories(prev => ({ ...prev, ...Object.fromEntries(rows) }));
    });
    return () => { alive = false; };
  }, [holdings.map(h => h.ticker).join('|')]);

  const intelligence = useMemo(() => buildPortfolioIntelligence(holdings, quotes), [holdings, quotes]);
  const waterfall = useMemo(() => buildDividendWaterfall(holdings, dividends), [holdings, dividends]);
  const value = mode === 'net' ? intelligence.netLiquidation : intelligence.totalValue;
  const gain = mode === 'net' ? intelligence.netGain : intelligence.totalGain;
  const gainPct = mode === 'net' ? intelligence.netGainPct : intelligence.gainPct;
  const positive = gain >= 0;
  const dividendTotal = dividends.reduce((sum, d) => sum + d.amount, 0);
  const netDividends = dividendTotal * (1 - MOROCCO_DIVIDEND_TAX_RATE_2025);
  const cashValue = accounts
    .filter(a => a.type === 'cash' || a.type === 'checking' || a.type === 'savings' || a.type === 'emergency')
    .reduce((sum, a) => sum + Math.max(0, a.balance), 0);
  const realizedGain = dividendTotal;
  const unrealizedGain = intelligence.totalGain;

  const portfolioSeries = useMemo(() => {
    const base = Object.values(histories).find(h => h.length >= 2)?.slice(-66) ?? [];
    if (base.length < 2) return [];
    return base.map(c => holdings.reduce((sum, h) => {
      const row = histories[h.ticker]?.find(x => x.date === c.date);
      return sum + h.shares * (row?.close ?? holdingPrice(h, quotes));
    }, 0));
  }, [histories, holdings, quotes]);

  const alloc = holdings
    .map((h, i) => ({ ticker: h.ticker, value: h.shares * holdingPrice(h, quotes), color: ALLOC_COLORS[i % ALLOC_COLORS.length] }))
    .sort((a, b) => b.value - a.value);
  const assetTypes = useMemo(() => {
    const rows = [
      { label: 'Cash', value: cashValue, color: t.colors.gold },
      { label: 'Actions', value: 0, color: t.colors.success },
      { label: 'OPCVM', value: 0, color: t.colors.primary },
      { label: 'Autres', value: 0, color: t.colors.textTertiary },
    ];
    for (const h of holdings) {
      const klass = instruments.find(i => i.symbol === h.ticker)?.klass;
      const v = h.shares * holdingPrice(h, quotes);
      if (klass === 'fond' || h.ticker.startsWith('FCP') || h.ticker.startsWith('SICAV')) rows[2].value += v;
      else if (klass === 'action' || !klass) rows[1].value += v;
      else rows[3].value += v;
    }
    return rows.filter(r => r.value > 0);
  }, [cashValue, holdings, instruments, quotes, t.colors]);
  const topPositions = intelligence.positions.slice(0, 5);
  const best = [...intelligence.positions].sort((a, b) => b.gainPct - a.gainPct)[0];
  const worst = [...intelligence.positions].sort((a, b) => a.gainPct - b.gainPct)[0];
  const masiPerf = masi?.changePercent ?? 0;

  const s = StyleSheet.create({
    body: { padding: t.spacing.lg, paddingBottom: 120, gap: t.spacing.md },
    hero: { backgroundColor: t.colors.cardAlt, borderColor: t.colors.borderStrong },
    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.md },
    summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { ...t.font.micro, color: t.colors.textTertiary },
    value: { fontSize: 36, fontWeight: '800', color: t.colors.text, marginTop: 2 },
    gain: { ...t.font.heading, marginTop: 2 },
    modeWrap: { width: 156 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: t.spacing.md, borderTopWidth: 1, borderTopColor: t.colors.border, paddingTop: t.spacing.md },
    metric: { width: '50%', paddingVertical: 8 },
    metricVal: { ...t.font.heading, color: t.colors.text, marginTop: 3 },
    tape: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.lg },
    tapeCell: { flex: 1, backgroundColor: t.colors.surface, borderRadius: t.radius.md, padding: 12 },
    tapeVal: { ...t.font.label, color: t.colors.text, marginTop: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 11, borderTopWidth: 1, borderTopColor: t.colors.border },
    terminalRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.colors.border },
    rowName: { flex: 1, minWidth: 0 },
    icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.primarySoft },
    note: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
    warning: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: t.colors.surface, borderRadius: t.radius.md, padding: 12, marginTop: t.spacing.md },
    waterfallBar: { height: 8, borderRadius: 4, backgroundColor: t.colors.border, overflow: 'hidden', marginTop: 5 },
    waterfallFill: { height: 8, borderRadius: 4, backgroundColor: t.colors.success },
    legend: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, paddingVertical: 5 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    tableHead: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    tableHeadTxt: { ...t.font.micro, color: t.colors.textTertiary },
    chartLegend: { flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.sm },
    legendChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    empty: { ...t.font.caption, color: t.colors.textTertiary, textAlign: 'center', paddingVertical: t.spacing.md },
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title="Portefeuille" subtitle="Actions, OPCVM et cash liquidable" showBack large />
      <ScrollView
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshPrices} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
      >
        <Card style={s.hero}>
          <View style={s.cardHead}>
            <SectionLabel style={{ marginBottom: 0 }}>Vue liquidable</SectionLabel>
            <View style={s.modeWrap}>
              <Segmented value={mode} onChange={setMode}
                options={[{ value: 'net', label: 'Net' }, { value: 'gross', label: 'Brut' }]} />
            </View>
          </View>
          <View style={s.summary}>
            <View>
              <Text style={s.label}>{mode === 'net' ? 'Cash estimé si vente' : 'Valorisation brute'}</Text>
              <Text style={s.value}>{maskMAD(value)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.label}>{mode === 'net' ? 'Résultat net' : 'Plus/moins-value'}</Text>
              <Text style={[s.gain, { color: positive ? t.colors.success : t.colors.danger }]}>{maskSigned(gain)}</Text>
              <Text style={{ ...t.font.caption, color: positive ? t.colors.success : t.colors.danger }}>{fmtPct(gainPct, 2)}</Text>
            </View>
          </View>
          <View style={s.tape}>
            <View style={s.tapeCell}>
              <Text style={s.label}>Best</Text>
              <Text style={[s.tapeVal, { color: best?.gainPct != null && best.gainPct >= 0 ? t.colors.success : t.colors.text }]} numberOfLines={1}>
                {best ? `${best.ticker} ${fmtPct(best.gainPct, 1)}` : '—'}
              </Text>
            </View>
            <View style={s.tapeCell}>
              <Text style={s.label}>Worst</Text>
              <Text style={[s.tapeVal, { color: worst?.gainPct != null && worst.gainPct < 0 ? t.colors.danger : t.colors.text }]} numberOfLines={1}>
                {worst ? `${worst.ticker} ${fmtPct(worst.gainPct, 1)}` : '—'}
              </Text>
            </View>
            <View style={s.tapeCell}>
              <Text style={s.label}>Top weight</Text>
              <Text style={s.tapeVal} numberOfLines={1}>{topPositions[0] ? `${topPositions[0].ticker} ${Math.round(topPositions[0].weight * 100)}%` : '—'}</Text>
            </View>
          </View>
          <View style={s.grid}>
            <View style={s.metric}><Text style={s.label}>Investi</Text><Text style={s.metricVal}>{maskMAD(intelligence.totalCost)}</Text></View>
            <View style={s.metric}><Text style={s.label}>Valeur marché</Text><Text style={s.metricVal}>{maskMAD(intelligence.totalValue)}</Text></View>
            <View style={s.metric}><Text style={s.label}>Frais vente Simple</Text><Text style={s.metricVal}>{maskMAD(intelligence.saleFees)}</Text></View>
            <View style={s.metric}><Text style={s.label}>IR plus-values</Text><Text style={s.metricVal}>{maskMAD(intelligence.taxIfSold)}</Text></View>
          </View>
          <View style={s.warning}>
            <Ionicons name="information-circle-outline" size={18} color={t.colors.textSecondary} />
            <Text style={{ ...t.font.caption, color: t.colors.textSecondary, flex: 1 }}>
              {intelligence.taxApplies
                ? `Seuil configure de ${fmtMAD(MOROCCO_SECURITIES_SALE_EXEMPTION_THRESHOLD)} atteint: ${Math.round(MOROCCO_CAPITAL_GAINS_TAX_RATE * 100)}% appliqué aux lignes gagnantes.`
                : `Seuil configure de ${fmtMAD(MOROCCO_SECURITIES_SALE_EXEMPTION_THRESHOLD)} non atteint: IR plus-values estimé a 0 DH.`}
            </Text>
          </View>
          {SIMPLE_SELL_FEE_RATE === 0 && (
            <View style={s.warning}>
              <Ionicons name="receipt-outline" size={18} color={t.colors.gold} />
              <Text style={{ ...t.font.caption, color: t.colors.textSecondary, flex: 1 }}>
                Frais de vente Simple/Attijari a confirmer: aucune grille publique fiable trouvee, donc le calcul affiche 0 DH de frais courtier pour l'instant.
              </Text>
            </View>
          )}
        </Card>

        <Card onPress={() => router.push('/investment-coach')}>
          <View style={s.row}>
            <View style={s.icon}><Ionicons name="school-outline" size={18} color={t.colors.gold} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...t.font.label, color: t.colors.text }}>Coach d'investissement</Text>
              <Text style={s.note}>Analyse cash, MASI, breadth, concentration et candidats a etudier.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.colors.textTertiary} />
          </View>
        </Card>

        <Card>
          <View style={s.cardHead}>
            <SectionLabel style={{ marginBottom: 0 }}>Valeur portefeuille</SectionLabel>
            <Badge tone={portfolioSeries.length > 1 ? 'success' : 'neutral'}>{portfolioSeries.length > 1 ? 'historique' : 'a venir'}</Badge>
          </View>
          {portfolioSeries.length > 1 ? (
            <LineChart
              data={portfolioSeries}
              width={W}
              height={154}
              color={portfolioSeries[portfolioSeries.length - 1] >= portfolioSeries[0] ? t.colors.success : t.colors.danger}
              labels={['debut', 'maintenant']}
            />
          ) : (
            <Text style={s.empty}>Le graphique se remplit avec les historiques BVC disponibles et les prochaines valorisations sauvegardees.</Text>
          )}
        </Card>

        <Card>
          <SectionLabel>Realized vs unrealized</SectionLabel>
          <Bars
            width={W}
            height={126}
            data={[
              { label: 'Real.', value: Math.abs(realizedGain), color: t.colors.gold },
              { label: 'Unreal.', value: Math.abs(unrealizedGain), color: unrealizedGain >= 0 ? t.colors.success : t.colors.danger },
            ]}
          />
          <View style={s.grid}>
            <View style={s.metric}><Text style={s.label}>Realized</Text><Text style={s.metricVal}>{maskMAD(realizedGain)}</Text></View>
            <View style={s.metric}><Text style={s.label}>Unrealized</Text><Text style={[s.metricVal, { color: unrealizedGain >= 0 ? t.colors.success : t.colors.danger }]}>{maskSigned(unrealizedGain)}</Text></View>
          </View>
          <Text style={s.note}>Realized utilise les dividendes enregistres pour l'instant. Les gains de vente seront exacts apres ajout du journal buy/sell.</Text>
        </Card>

        <Card>
          <SectionLabel>Allocation par type</SectionLabel>
          {assetTypes.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
              <Donut size={118} thickness={18} data={assetTypes.map(a => ({ value: a.value, color: a.color }))} centerLabel={String(assetTypes.length)} centerSub="types" />
              <View style={{ flex: 1 }}>
                {assetTypes.map(a => (
                  <View key={a.label} style={s.legend}>
                    <View style={[s.dot, { backgroundColor: a.color }]} />
                    <Text style={{ ...t.font.body, color: t.colors.text, flex: 1 }}>{a.label}</Text>
                    <Text style={{ ...t.font.label, color: t.colors.textSecondary }}>{maskMAD(a.value)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Text style={s.empty}>Ajoutez des comptes cash ou positions pour voir l'allocation.</Text>
          )}
        </Card>

        <Card>
          <SectionLabel>MASI vs portefeuille</SectionLabel>
          <Bars
            width={W}
            height={126}
            data={[
              { label: 'MASI', value: Math.abs(masiPerf), color: masiPerf >= 0 ? t.colors.success : t.colors.danger },
              { label: 'Port.', value: Math.abs(intelligence.gainPct), color: intelligence.gainPct >= 0 ? t.colors.success : t.colors.danger },
            ]}
          />
          <View style={s.chartLegend}>
            <View style={s.legendChip}><View style={[s.dot, { backgroundColor: masiPerf >= 0 ? t.colors.success : t.colors.danger }]} /><Text style={s.note}>MASI {fmtPct(masiPerf, 2)}</Text></View>
            <View style={s.legendChip}><View style={[s.dot, { backgroundColor: intelligence.gainPct >= 0 ? t.colors.success : t.colors.danger }]} /><Text style={s.note}>Portefeuille {fmtPct(intelligence.gainPct, 2)}</Text></View>
          </View>
          <Text style={s.note}>Comparaison actuelle: MASI session vs performance depuis votre prix de revient. Une vraie courbe MASI historique pourra etre branchee si l'API expose l'historique indice.</Text>
        </Card>

        <Card>
          <SectionLabel>Fiscalite Maroc</SectionLabel>
          <View style={[s.row, { borderTopWidth: 0 }]}>
            <View style={s.icon}><Ionicons name="cash-outline" size={18} color={t.colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...t.font.label, color: t.colors.text }}>Dividendes</Text>
              <Text style={s.note}>Taux retenu 2025: {fmtPct(-MOROCCO_DIVIDEND_TAX_RATE_2025 * 100, 1).replace('-', '')} sur dividendes marocains.</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ ...t.font.label, color: t.colors.text }}>{maskMAD(dividendTotal)}</Text>
              <Text style={{ ...t.font.caption, color: t.colors.success }}>net {maskMAD(netDividends)}</Text>
            </View>
          </View>
          <View style={s.row}>
            <View style={s.icon}><Ionicons name="calculator-outline" size={18} color={t.colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...t.font.label, color: t.colors.text }}>Plus-values</Text>
              <Text style={s.note}>Le cout Simple sert de prix de revient; les frais de vente reduisent le gain taxable.</Text>
            </View>
            <Badge tone={intelligence.taxApplies ? 'danger' : 'neutral'}>{intelligence.taxApplies ? 'taxable' : 'seuil'}</Badge>
          </View>
        </Card>

        {alloc.length >= 2 && (
          <Card>
            <SectionLabel>Repartition</SectionLabel>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
              <Donut size={120} thickness={18} data={alloc.map(a => ({ value: a.value, color: a.color }))} centerLabel={String(holdings.length)} centerSub="lignes" />
              <View style={{ flex: 1, gap: 2 }}>
                {alloc.map(a => (
                  <View key={a.ticker} style={s.legend}>
                    <View style={[s.dot, { backgroundColor: a.color }]} />
                    <Text style={{ ...t.font.body, color: t.colors.text, flex: 1 }}>{a.ticker}</Text>
                    <Text style={{ ...t.font.label, color: t.colors.textSecondary }}>{Math.round((a.value / (intelligence.totalValue || 1)) * 100)}%</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ marginTop: t.spacing.lg }}>
              <Bars
                width={W}
                height={116}
                data={alloc.slice(0, 6).map(a => ({ label: a.ticker.slice(0, 4), value: a.value, color: a.color }))}
              />
            </View>
          </Card>
        )}

        <Card>
          <View style={s.cardHead}>
            <SectionLabel style={{ marginBottom: 0 }}>Dividend waterfall</SectionLabel>
            <Badge tone={waterfall.some(w => w.amount != null) ? 'success' : 'neutral'}>{waterfall.length} lignes</Badge>
          </View>
          {waterfall.length === 0 ? <Text style={s.empty}>Ajoutez des dividendes sur les fiches actions pour projeter les encaissements.</Text> : waterfall.map(d => (
            <View key={`${d.ticker}-${d.expectedDate}`} style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...t.font.body, color: t.colors.text, fontWeight: '700' }}>{d.ticker} · {d.expectedDate}</Text>
                <Text style={s.note}>{d.source}</Text>
                <View style={s.waterfallBar}>
                  <View style={[s.waterfallFill, { width: d.amount != null ? '70%' : '25%', backgroundColor: d.confidence === 'history' ? t.colors.success : t.colors.gold }]} />
                </View>
              </View>
              <Text style={{ ...t.font.label, color: d.amount != null ? t.colors.text : t.colors.textTertiary }}>{d.amount != null ? maskMAD(d.amount) : 'a estimer'}</Text>
            </View>
          ))}
        </Card>

        <View>
          <SectionLabel style={{ marginLeft: 4 }}>Positions</SectionLabel>
          {holdings.length === 0 ? <Text style={s.empty}>Aucune position importee.</Text> : (
            <Card>
              <View style={s.tableHead}>
                <Text style={[s.tableHeadTxt, { flex: 1 }]}>Asset</Text>
                <Text style={[s.tableHeadTxt, { width: 84, textAlign: 'right' }]}>Value</Text>
                <Text style={[s.tableHeadTxt, { width: 72, textAlign: 'right' }]}>P/L</Text>
              </View>
              {intelligence.positions.map((p, idx) => (
                <View key={p.id} style={[s.terminalRow, idx === 0 && { borderTopWidth: 0 }]}>
                  <CompanyAvatar ticker={p.ticker} size={38} />
                  <View style={s.rowName}>
                    <Text style={{ ...t.font.label, color: t.colors.text }}>{p.ticker}</Text>
                    <Text style={{ ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 }} numberOfLines={1}>{p.name}</Text>
                  </View>
                  <View style={{ width: 84, alignItems: 'flex-end' }}>
                    <Text style={{ ...t.font.label, color: t.colors.text }}>{maskMAD(p.value)}</Text>
                    <Text style={{ ...t.font.caption, color: t.colors.textTertiary }}>{Math.round(p.weight * 100)}%</Text>
                  </View>
                  <View style={{ width: 72, alignItems: 'flex-end' }}>
                    <Text style={{ ...t.font.label, color: p.gain >= 0 ? t.colors.success : t.colors.danger }}>{fmtPct(p.gainPct, 1)}</Text>
                    <Text style={{ ...t.font.caption, color: t.colors.textTertiary }}>{p.taxIfSold > 0 ? fmtMAD(p.taxIfSold) : ''}</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
