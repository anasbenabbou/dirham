import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../db/goals';
import { useGoalsStore } from '../store/useGoalsStore';
import { useAccountsStore } from '../store/useAccountsStore';
import { useTheme } from '../theme/ThemeProvider';
import { fmtMAD } from '../lib/format';
import { haptic } from '../lib/haptics';
import { Card, ProgressBar, Button, Field, Sheet, Pill } from './ui';

function daysLeft(d: string | null): string | null {
  if (!d) return null;
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  return diff < 0 ? 'Échéance dépassée' : `${diff} j restants`;
}

export default function GoalCard({ goal: g }: { goal: Goal }) {
  const t = useTheme();
  const { deposit, withdraw, removeGoal } = useGoalsStore();
  const { accounts, load: loadAccounts } = useAccountsStore();
  const [mode, setMode] = useState<null | 'deposit' | 'withdraw'>(null);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);

  useEffect(() => { loadAccounts(); }, []);

  const pct = Math.min(g.current_amount / g.target_amount, 1);
  const remaining = g.target_amount - g.current_amount;
  const accent = g.completed ? t.colors.success : t.colors.primary;

  function openSheet(m: 'deposit' | 'withdraw') {
    setMode(m); setAmount('');
    setAccountId(accounts.length ? accounts[0].id : null);
  }

  function confirm() {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) { Alert.alert('Montant invalide', 'Entrez un montant positif.'); return; }
    if (accounts.length > 0 && accountId == null) { Alert.alert('Choisissez un compte'); return; }
    if (mode === 'deposit') deposit(g.id, n, accountId);
    else withdraw(g.id, n, accountId);
    haptic.success();
    setMode(null); setAmount('');
  }

  function onDelete() {
    Alert.alert('Supprimer cet objectif ?', g.name, [
      { text: 'Supprimer', style: 'destructive', onPress: () => removeGoal(g.id) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  const s = StyleSheet.create({
    card: { gap: t.spacing.md, opacity: g.completed ? 0.85 : 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, flex: 1, minWidth: 0 },
    iconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: accent + '22', justifyContent: 'center', alignItems: 'center' },
    name: { ...t.font.heading, color: t.colors.text, flex: 1, minWidth: 0 },
    dateBadge: { backgroundColor: t.colors.surface, borderRadius: t.radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
    dateTxt: { ...t.font.caption, color: t.colors.textSecondary, fontWeight: '600' },
    trackRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
    pct: { ...t.font.label, color: accent, minWidth: 38, textAlign: 'right' },
    amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    current: { fontSize: 22, fontWeight: '800', color: t.colors.text },
    sub: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
    remaining: { ...t.font.heading, color: t.colors.text },
    btnRow: { flexDirection: 'row', gap: t.spacing.sm },
    label: { ...t.font.micro, color: t.colors.textTertiary, marginBottom: 8, marginTop: t.spacing.md },
    pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
    sheetRow: { flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.lg },
  });

  return (
    <Card onLongPress={onDelete} style={s.card}>
      <View style={s.header}>
        <View style={s.titleRow}>
          <View style={s.iconWrap}>
            <Ionicons name={g.completed ? 'checkmark-circle' : 'flag'} size={18} color={accent} />
          </View>
          <Text style={s.name} numberOfLines={1}>{g.name}</Text>
        </View>
        {g.target_date && <View style={s.dateBadge}><Text style={s.dateTxt}>{daysLeft(g.target_date)}</Text></View>}
      </View>

      <View style={s.trackRow}>
        <View style={{ flex: 1 }}><ProgressBar progress={pct} color={accent} /></View>
        <Text style={s.pct}>{Math.round(pct * 100)}%</Text>
      </View>

      <View style={s.amountRow}>
        <View>
          <Text style={s.current}>{fmtMAD(g.current_amount)}</Text>
          <Text style={s.sub}>sur {fmtMAD(g.target_amount)}</Text>
        </View>
        {!g.completed && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.remaining}>{fmtMAD(remaining)}</Text>
            <Text style={s.sub}>restant</Text>
          </View>
        )}
      </View>

      <View style={s.btnRow}>
        {!g.completed && <Button label="Verser" icon="arrow-down" variant="secondary" onPress={() => openSheet('deposit')} style={{ flex: 1 }} full={false} />}
        {g.current_amount > 0 && <Button label="Retirer" icon="arrow-up" variant="ghost" onPress={() => openSheet('withdraw')} style={{ flex: 1 }} full={false} />}
      </View>

      <Sheet visible={mode !== null} onClose={() => setMode(null)} title={mode === 'withdraw' ? `Retirer de « ${g.name} »` : `Verser dans « ${g.name} »`}>
        <Field label="Montant (MAD)" placeholder="0" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" autoFocus big style={{ textAlign: 'center' }} />
        {accounts.length > 0 && (
          <>
            <Text style={s.label}>{mode === 'withdraw' ? 'Vers le compte' : 'Depuis le compte'}</Text>
            <View style={s.pillWrap}>
              {accounts.map(a => <Pill key={a.id} label={`${a.name} · ${fmtMAD(a.balance)}`} selected={accountId === a.id} onPress={() => setAccountId(a.id)} />)}
            </View>
          </>
        )}
        <View style={s.sheetRow}>
          <Button label="Annuler" variant="secondary" onPress={() => setMode(null)} style={{ flex: 1 }} full={false} />
          <Button label={mode === 'withdraw' ? 'Retirer' : 'Verser'} icon="checkmark" onPress={confirm} style={{ flex: 2 }} full={false} />
        </View>
      </Sheet>
    </Card>
  );
}
