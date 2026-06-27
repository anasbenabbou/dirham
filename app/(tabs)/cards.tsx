import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAccountsStore } from '../../store/useAccountsStore';
import { Account } from '../../db/accounts';
import { useTheme } from '../../theme/ThemeProvider';
import { fmtMAD } from '../../lib/format';
import { AppHeader, HeaderIconButton, Card, EmptyState, Field, Pill, Button, Sheet, SectionLabel } from '../../components/ui';

const { width } = Dimensions.get('window');
const CARD_W = width - 32;

const MOROCCAN_BANKS = [
  'Attijariwafa', 'CIH Bank', 'BMCE Bank', 'BCP', 'Banque Populaire',
  'BMCI', 'Crédit Agricole', 'CDG Capital', 'Société Générale', 'Al Barid Bank', 'Autre',
];
const ACCOUNT_TYPES = [
  { key: 'checking', label: 'Compte courant' },
  { key: 'savings',  label: 'Compte épargne' },
  { key: 'card',     label: 'Carte de crédit' },
] as const;
const CARD_COLORS = ['#0057FF', '#12161C', '#0ECB81', '#7C5CFF', '#F6465D', '#F0B90B'];

function BankCard({ account, onPress }: { account: Account; onPress: () => void }) {
  const s = StyleSheet.create({
    card: { width: CARD_W, height: CARD_W * 0.56, borderRadius: 22, padding: 22, justifyContent: 'space-between', backgroundColor: account.color },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bank: { color: '#fff', fontSize: 16, fontWeight: '700' },
    chip: { width: 38, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.28)' },
    number: { color: 'rgba(255,255,255,0.82)', fontSize: 15, letterSpacing: 2, fontWeight: '500' },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    balLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', marginBottom: 2 },
    balance: { color: '#fff', fontSize: 22, fontWeight: '800' },
    name: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  });
  const typeLabel = ACCOUNT_TYPES.find(ty => ty.key === account.type)?.label;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      <View style={s.topRow}>
        <Text style={s.bank}>{account.bank}</Text>
        <Ionicons name="wifi" size={20} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }] }} />
      </View>
      <View style={s.chip} />
      <Text style={s.number}>{account.last_four ? `•••• •••• •••• ${account.last_four}` : typeLabel}</Text>
      <View style={s.bottomRow}>
        <View>
          <Text style={s.balLabel}>Solde disponible</Text>
          <Text style={s.balance}>{fmtMAD(account.balance, 2)}</Text>
        </View>
        <Text style={s.name}>{account.name}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CardsScreen() {
  const t = useTheme();
  const { accounts, load, addAccount, setBalance, removeAccount } = useAccountsStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editAcc, setEditAcc] = useState<Account | null>(null);
  const [editBal, setEditBal] = useState('');

  const [name, setName] = useState('');
  const [bank, setBank] = useState(MOROCCAN_BANKS[0]);
  const [type, setType] = useState<Account['type']>('checking');
  const [balance, setBalance2] = useState('');
  const [color, setColor] = useState(CARD_COLORS[0]);
  const [lastFour, setLastFour] = useState('');

  useEffect(() => { load(); }, []);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalCards = accounts.filter(a => a.type === 'card').length;
  const totalSavings = accounts.filter(a => a.type === 'savings').reduce((s, a) => s + a.balance, 0);

  function resetForm() {
    setName(''); setBank(MOROCCAN_BANKS[0]); setType('checking'); setBalance2(''); setColor(CARD_COLORS[0]); setLastFour('');
  }
  function handleAdd() {
    const bal = parseFloat(balance);
    if (!name.trim() || isNaN(bal)) { Alert.alert('Erreur', 'Renseignez le nom et le solde.'); return; }
    addAccount({ name: name.trim(), bank, type, balance: bal, color, last_four: lastFour.slice(-4) });
    resetForm(); setShowAdd(false);
  }
  function handleEditBalance() {
    if (!editAcc) return;
    const bal = parseFloat(editBal);
    if (isNaN(bal)) { Alert.alert('Montant invalide'); return; }
    setBalance(editAcc.id, bal); setEditAcc(null); setEditBal('');
  }
  function openEdit(a: Account) { setEditAcc(a); setEditBal(String(a.balance)); }
  function confirmDelete(a: Account) {
    Alert.alert(a.name, `${a.bank} · ${fmtMAD(a.balance)}`, [
      { text: 'Supprimer ce compte', style: 'destructive', onPress: () => removeAccount(a.id) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  const s = StyleSheet.create({
    scroll: { padding: t.spacing.lg, paddingBottom: 120, gap: t.spacing.lg },
    nwLabel: { ...t.font.micro, color: t.colors.textTertiary },
    nwAmt: { color: t.colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -1, marginVertical: 6 },
    nwStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.cardAlt, borderRadius: t.radius.md, padding: 12, marginTop: 6 },
    nwStat: { flex: 1, alignItems: 'center', gap: 2 },
    nwStatVal: { color: t.colors.text, fontSize: 16, fontWeight: '700' },
    nwStatLabel: { ...t.font.caption, color: t.colors.textSecondary },
    nwDivider: { width: 1, height: 30, backgroundColor: t.colors.border },
    cardsWrap: { gap: 0 },
    cardShadow: { ...t.shadow.card },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 12 },
    listDivider: { borderTopWidth: 1, borderTopColor: t.colors.border },
    listDot: { width: 10, height: 10, borderRadius: 5 },
    listInfo: { flex: 1, minWidth: 0 },
    listName: { ...t.font.body, fontWeight: '600', color: t.colors.text },
    listBank: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
    listBal: { ...t.font.body, fontWeight: '700', color: t.colors.text },
    // modal
    modal: { flex: 1, backgroundColor: t.colors.bg },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: t.spacing.xl, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    modalTitle: { ...t.font.title, color: t.colors.text },
    modalBody: { padding: t.spacing.xl, gap: t.spacing.lg, paddingBottom: 48 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
    typeRow: { flexDirection: 'row', gap: t.spacing.sm },
    colorRow: { flexDirection: 'row', gap: t.spacing.md },
    colorDot: { width: 38, height: 38, borderRadius: 19 },
    colorDotOn: { borderWidth: 3, borderColor: t.colors.text },
    editAmt: { fontSize: 30, fontWeight: '800', textAlign: 'center' },
    sheetRow: { flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.md },
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader
        title="Comptes" large
        right={<HeaderIconButton icon="add" filled onPress={() => setShowAdd(true)} />}
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={s.nwLabel}>Patrimoine total</Text>
          <Text style={s.nwAmt}>{fmtMAD(totalBalance)}</Text>
          <View style={s.nwStats}>
            <View style={s.nwStat}>
              <Text style={s.nwStatVal}>{accounts.length}</Text>
              <Text style={s.nwStatLabel}>compte{accounts.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={s.nwDivider} />
            <View style={s.nwStat}>
              <Text style={s.nwStatVal}>{totalCards}</Text>
              <Text style={s.nwStatLabel}>carte{totalCards !== 1 ? 's' : ''}</Text>
            </View>
            <View style={s.nwDivider} />
            <View style={s.nwStat}>
              <Text style={[s.nwStatVal, { color: t.colors.success }]}>{fmtMAD(totalSavings)}</Text>
              <Text style={s.nwStatLabel}>épargne</Text>
            </View>
          </View>
        </Card>

        {accounts.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="card-outline" size={30} color={t.colors.textSecondary} />}
            title="Aucun compte"
            subtitle="Ajoutez votre première carte ou compte bancaire avec le bouton +."
          />
        ) : (
          <>
            <View style={s.cardsWrap}>
              {accounts.map((a, idx) => (
                <View key={a.id} style={[s.cardShadow, { marginTop: idx === 0 ? 0 : -CARD_W * 0.28 }]}>
                  <BankCard account={a} onPress={() => openEdit(a)} />
                </View>
              ))}
            </View>

            <Card>
              <SectionLabel>Détail des comptes</SectionLabel>
              {accounts.map((a, idx) => (
                <TouchableOpacity key={a.id} style={[s.listRow, idx > 0 && s.listDivider]} onPress={() => openEdit(a)} onLongPress={() => confirmDelete(a)} activeOpacity={0.7}>
                  <View style={[s.listDot, { backgroundColor: a.color }]} />
                  <View style={s.listInfo}>
                    <Text style={s.listName} numberOfLines={1}>{a.name}</Text>
                    <Text style={s.listBank} numberOfLines={1}>{a.bank} · {ACCOUNT_TYPES.find(ty => ty.key === a.type)?.label}</Text>
                  </View>
                  <Text style={s.listBal}>{fmtMAD(a.balance)}</Text>
                </TouchableOpacity>
              ))}
            </Card>
          </>
        )}
      </ScrollView>

      {/* Add account modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <SafeAreaView style={s.modal}>
          <View style={s.modalHead}>
            <Text style={s.modalTitle}>Nouveau compte</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={t.colors.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
            <Field label="Nom du compte" placeholder="Ex: Mon compte principal" value={name} onChangeText={setName} autoFocus />
            <View>
              <SectionLabel>Banque</SectionLabel>
              <View style={s.pillRow}>
                {MOROCCAN_BANKS.map(b => <Pill key={b} label={b} selected={bank === b} onPress={() => setBank(b)} />)}
              </View>
            </View>
            <View>
              <SectionLabel>Type</SectionLabel>
              <View style={s.typeRow}>
                {ACCOUNT_TYPES.map(ty => <Pill key={ty.key} label={ty.label} selected={type === ty.key} onPress={() => setType(ty.key)} />)}
              </View>
            </View>
            <Field label="Solde actuel (MAD)" placeholder="0.00" value={balance} onChangeText={setBalance2} keyboardType="decimal-pad" big />
            <Field label="4 derniers chiffres (optionnel)" placeholder="1234" value={lastFour} onChangeText={setLastFour} keyboardType="number-pad" maxLength={4} />
            <View>
              <SectionLabel>Couleur de la carte</SectionLabel>
              <View style={s.colorRow}>
                {CARD_COLORS.map(c => (
                  <TouchableOpacity key={c} style={[s.colorDot, { backgroundColor: c }, color === c && s.colorDotOn]} onPress={() => setColor(c)} />
                ))}
              </View>
            </View>
            <View style={{ marginTop: t.spacing.sm }}>
              <BankCard account={{ id: 0, name: name || 'Nom du compte', bank, type, balance: parseFloat(balance) || 0, color, last_four: lastFour.slice(-4) }} onPress={() => {}} />
            </View>
            <Button label="Ajouter le compte" icon="checkmark" onPress={handleAdd} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit balance sheet */}
      <Sheet visible={!!editAcc} onClose={() => setEditAcc(null)} title="Mettre à jour le solde">
        <Text style={{ ...t.font.body, color: t.colors.textSecondary, marginBottom: t.spacing.md }}>{editAcc?.name} · {editAcc?.bank}</Text>
        <Field value={editBal} onChangeText={setEditBal} keyboardType="decimal-pad" autoFocus big style={s.editAmt} />
        <View style={s.sheetRow}>
          <Button label="Annuler" variant="secondary" onPress={() => setEditAcc(null)} style={{ flex: 1 }} full={false} />
          <Button label="Mettre à jour" icon="checkmark" onPress={handleEditBalance} style={{ flex: 2 }} full={false} />
        </View>
      </Sheet>
    </View>
  );
}
