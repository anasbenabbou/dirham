import { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppHeader, Badge, Card, SectionLabel } from '../components/ui';
import CompanyAvatar from '../components/CompanyAvatar';
import { useAccountsStore } from '../store/useAccountsStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD, fmtNum, fmtPct } from '../lib/format';
import { usePrivacyMask } from '../lib/usePrivacyMask';
import { buildPortfolioIntelligence } from '../lib/portfolioIntelligence';
import { buildInvestmentCoach, CoachSignal, CoachStance } from '../lib/investmentCoach';

const STANCE_ICON: Record<CoachStance, keyof typeof Ionicons.glyphMap> = {
  cash: 'shield-checkmark-outline',
  watch: 'eye-outline',
  deploy: 'trending-up-outline',
  rebalance: 'swap-horizontal-outline',
};

function signalTone(tone: CoachSignal['tone']): 'success' | 'danger' | 'neutral' {
  if (tone === 'good') return 'success';
  if (tone === 'bad') return 'danger';
  return 'neutral';
}

export default function InvestmentCoachScreen() {
  const t = useTheme();
  const { maskMAD } = usePrivacyMask();
  const { accounts, load: loadAccounts } = useAccountsStore();
  const {
    holdings, quotes, market, masi, loading,
    loadHoldings, refreshPrices,
  } = usePortfolioStore();

  useEffect(() => { loadAccounts(); loadHoldings(); refreshPrices(); }, []);

  const portfolio = useMemo(() => buildPortfolioIntelligence(holdings, quotes), [holdings, quotes]);
  const coach = useMemo(() => buildInvestmentCoach({ accounts, holdings, portfolio, market, masi }), [accounts, holdings, portfolio, market, masi]);
  const stanceColor = coach.stance === 'deploy' ? t.colors.success : coach.stance === 'rebalance' ? t.colors.gold : coach.stance === 'cash' ? t.colors.primary : t.colors.text;

  const s = StyleSheet.create({
    body: { padding: t.spacing.lg, paddingBottom: 120, gap: t.spacing.md },
    hero: { backgroundColor: t.colors.cardAlt, borderColor: t.colors.borderStrong },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
    heroIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: `${stanceColor}22`, borderWidth: 1, borderColor: `${stanceColor}66` },
    title: { fontSize: 28, fontWeight: '800', color: t.colors.text, marginTop: t.spacing.lg },
    summary: { ...t.font.body, color: t.colors.textSecondary, lineHeight: 21, marginTop: 6 },
    tape: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.lg },
    cell: { flex: 1, backgroundColor: t.colors.surface, borderRadius: t.radius.md, padding: 12 },
    cellLabel: { ...t.font.micro, color: t.colors.textTertiary },
    cellVal: { ...t.font.label, color: t.colors.text, marginTop: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.colors.border },
    rowText: { flex: 1, minWidth: 0 },
    label: { ...t.font.label, color: t.colors.text },
    note: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
    rule: { flexDirection: 'row', gap: t.spacing.sm, paddingVertical: 8 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.gold, marginTop: 6 },
    disclaimer: { ...t.font.caption, color: t.colors.textTertiary, lineHeight: 18, textAlign: 'center', paddingHorizontal: t.spacing.md },
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title="Coach" subtitle="Tuteur d'investissement regle par regle" showBack large />
      <ScrollView
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshPrices} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
      >
        <Card style={s.hero}>
          <View style={s.heroTop}>
            <View style={s.heroIcon}><Ionicons name={STANCE_ICON[coach.stance]} size={24} color={stanceColor} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...t.font.micro, color: t.colors.textTertiary }}>Decision engine</Text>
              <Text style={{ ...t.font.heading, color: stanceColor }}>{coach.title}</Text>
            </View>
            <Badge tone={coach.stance === 'deploy' ? 'success' : coach.stance === 'cash' ? 'neutral' : 'danger'}>{coach.stance}</Badge>
          </View>
          <Text style={s.title}>{coach.maxDeploy > 0 ? maskMAD(coach.maxDeploy) : '0 MAD'}</Text>
          <Text style={s.summary}>{coach.maxDeploy > 0 ? 'Montant maximum autorise par les regles pour une entree progressive.' : coach.summary}</Text>
          <View style={s.tape}>
            <View style={s.cell}>
              <Text style={s.cellLabel}>Cash</Text>
              <Text style={s.cellVal}>{maskMAD(coach.investableCash)}</Text>
            </View>
            <View style={s.cell}>
              <Text style={s.cellLabel}>Breadth</Text>
              <Text style={s.cellVal}>{Math.round(coach.marketBreadth * 100)}%</Text>
            </View>
            <View style={s.cell}>
              <Text style={s.cellLabel}>Cash ratio</Text>
              <Text style={s.cellVal}>{Math.round(coach.cashRatio * 100)}%</Text>
            </View>
          </View>
        </Card>

        <Card>
          <SectionLabel>Signals</SectionLabel>
          {coach.signals.map((sig, idx) => (
            <View key={sig.label} style={[s.row, idx === 0 && { borderTopWidth: 0 }]}>
              <View style={s.rowText}>
                <Text style={s.label}>{sig.label}</Text>
                <Text style={s.note}>{sig.detail}</Text>
              </View>
              <Badge tone={signalTone(sig.tone)}>{sig.tone}</Badge>
            </View>
          ))}
        </Card>

        <Card>
          <SectionLabel>Valeurs a etudier</SectionLabel>
          {coach.candidates.length === 0 ? (
            <Text style={s.note}>Pas assez de donnees de marche pour generer une watchlist.</Text>
          ) : coach.candidates.map((c, idx) => (
            <TouchableOpacity key={c.ticker} style={[s.row, idx === 0 && { borderTopWidth: 0 }]} onPress={() => router.push(`/stock/${c.ticker}`)}>
              <CompanyAvatar ticker={c.ticker} size={38} />
              <View style={s.rowText}>
                <Text style={s.label}>{c.ticker}</Text>
                <Text style={s.note} numberOfLines={1}>{c.name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ ...t.font.label, color: t.colors.text }}>{fmtNum(c.price)}</Text>
                <Text style={{ ...t.font.caption, color: c.dayChange >= 0 ? t.colors.success : t.colors.danger }}>{fmtPct(c.dayChange, 2)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        <Card>
          <SectionLabel>Rulebook</SectionLabel>
          {coach.rules.map(rule => (
            <View key={rule} style={s.rule}>
              <View style={s.dot} />
              <Text style={{ ...t.font.caption, color: t.colors.textSecondary, flex: 1, lineHeight: 18 }}>{rule}</Text>
            </View>
          ))}
        </Card>

        <Text style={s.disclaimer}>
          Coach educatif: il explique les risques et conditions d'entree. Il ne remplace pas votre jugement, les frais reels Simple/Attijari, ni un conseil financier agree.
        </Text>
      </ScrollView>
    </View>
  );
}
