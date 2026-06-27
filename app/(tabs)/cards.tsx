import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  StyleSheet, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAccountsStore } from '../../store/useAccountsStore';
import { Account } from '../../db/accounts';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const CARD_W = width - 32;

const fmt = (n: number) =>
  n.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 2 });

const MOROCCAN_BANKS = [
  'Attijariwafa', 'CIH Bank', 'BMCE Bank', 'BCP', 'Banque Populaire',
  'BMCI', 'Crédit Agricole', 'CDG Capital', 'Société Générale', 'Al Barid Bank', 'Autre',
];

const ACCOUNT_TYPES = [
  { key: 'checking', label: 'Compte courant' },
  { key: 'savings',  label: 'Compte épargne' },
  { key: 'card',     label: 'Carte de crédit' },
];

const CARD_COLORS = ['#0057FF', '#0A1628', '#10B981', '#7C3AED', '#EF4444', '#FF9500'];

function BankCard({ account, onLongPress }: { account: Account; onLongPress: () => void }) {
  return (
    <TouchableOpacity style={[s.bankCard, { backgroundColor: account.color }]} onLongPress={onLongPress} activeOpacity={0.88}>
      <View style={s.cardTopRow}>
        <Text style={s.cardBankName}>{account.bank}</Text>
        <Text style={s.cardWifi}>))))</Text>
      </View>
      <View style={s.cardChip} />
      {account.last_four ? (
        <Text style={s.cardNumber}>•••• •••• •••• {account.last_four}</Text>
      ) : (
        <Text style={s.cardNumber}>{ACCOUNT_TYPES.find(t => t.key === account.type)?.label}</Text>
      )}
      <View style={s.cardBottomRow}>
        <View>
          <Text style={s.cardBalLabel}>Solde disponible</Text>
          <Text style={s.cardBalance}>{fmt(account.balance)}</Text>
        </View>
        <Text style={s.cardAccountName}>{account.name}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CardsScreen() {
  const { accounts, load, addAccount, setBalance, removeAccount } = useAccountsStore();
  const [showAdd, setShowAdd]     = useState(false);
  const [showEdit, setShowEdit]   = useState<Account | null>(null);
  const [editBal, setEditBal]     = useState('');

  // Form state
  const [name, setName]       = useState('');
  const [bank, setBank]       = useState(MOROCCAN_BANKS[0]);
  const [type, setType]       = useState<Account['type']>('checking');
  const [balance, setBalance2]= useState('');
  const [color, setColor]     = useState(CARD_COLORS[0]);
  const [lastFour, setLastFour] = useState('');

  useEffect(() => { load(); }, []);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalCards   = accounts.filter(a => a.type === 'card').length;
  const totalSavings = accounts.filter(a => a.type === 'savings').reduce((s, a) => s + a.balance, 0);

  function handleAdd() {
    const bal = parseFloat(balance);
    if (!name.trim() || isNaN(bal)) {
      Alert.alert('Erreur', 'Renseignez le nom et le solde.'); return;
    }
    addAccount({ name: name.trim(), bank, type, balance: bal, color, last_four: lastFour.slice(-4) });
    setName(''); setBank(MOROCCAN_BANKS[0]); setType('checking'); setBalance2(''); setColor(CARD_COLORS[0]); setLastFour('');
    setShowAdd(false);
  }

  function handleEditBalance() {
    if (!showEdit) return;
    const bal = parseFloat(editBal);
    if (isNaN(bal)) { Alert.alert('Montant invalide'); return; }
    setBalance(showEdit.id, bal);
    setShowEdit(null); setEditBal('');
  }

  function onLongPress(a: Account) {
    Alert.alert(a.name, a.bank, [
      { text: 'Modifier solde', onPress: () => { setShowEdit(a); setEditBal(String(a.balance)); } },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeAccount(a.id) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Net worth header */}
        <View style={s.netWorth}>
          <Text style={s.nwLabel}>Patrimoine total</Text>
          <Text style={s.nwAmt}>{fmt(totalBalance)}</Text>
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
              <Text style={[s.nwStatVal, { color: Colors.success }]}>{fmt(totalSavings)}</Text>
              <Text style={s.nwStatLabel}>épargne</Text>
            </View>
          </View>
        </View>

        {/* Cards */}
        {accounts.length === 0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="card-outline" size={56} color={Colors.border} />
            <Text style={s.emptyTitle}>Aucun compte</Text>
            <Text style={s.emptyTxt}>Ajoutez votre première carte ou compte bancaire.</Text>
          </View>
        ) : (
          <View style={s.cardsWrap}>
            {accounts.map((a, idx) => (
              <View key={a.id} style={[s.cardShadowWrap, { marginTop: idx === 0 ? 0 : -CARD_W * 0.28 }]}>
                <BankCard account={a} onLongPress={() => onLongPress(a)} />
              </View>
            ))}
          </View>
        )}

        {/* Per-account list */}
        {accounts.length > 0 && (
          <View style={s.listCard}>
            <Text style={s.listTitle}>Détail des comptes</Text>
            {accounts.map(a => (
              <TouchableOpacity key={a.id} style={s.listRow} onPress={() => { setShowEdit(a); setEditBal(String(a.balance)); }}>
                <View style={[s.listDot, { backgroundColor: a.color }]} />
                <View style={s.listInfo}>
                  <Text style={s.listName} numberOfLines={1}>{a.name}</Text>
                  <Text style={s.listBank} numberOfLines={1}>{a.bank} · {ACCOUNT_TYPES.find(t => t.key === a.type)?.label}</Text>
                </View>
                <Text style={s.listBal}>{fmt(a.balance)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add account modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Nouveau compte</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalBody}>
            <Text style={s.fieldLabel}>Nom du compte</Text>
            <TextInput style={s.input} placeholder="Ex: Mon compte principal" placeholderTextColor={Colors.textSecondary} value={name} onChangeText={setName} autoFocus />

            <Text style={s.fieldLabel}>Banque</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
              {MOROCCAN_BANKS.map(b => (
                <TouchableOpacity key={b} style={[s.pill, bank === b && s.pillActive]} onPress={() => setBank(b)}>
                  <Text style={[s.pillTxt, bank === b && s.pillTxtActive]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.fieldLabel}>Type</Text>
            <View style={s.typeRow}>
              {ACCOUNT_TYPES.map(t => (
                <TouchableOpacity key={t.key} style={[s.typeBtn, type === t.key && s.typeBtnActive]} onPress={() => setType(t.key as Account['type'])}>
                  <Text style={[s.typeTxt, type === t.key && s.typeTxtActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>Solde actuel (MAD)</Text>
            <TextInput style={[s.input, s.bigInput]} placeholder="0.00" placeholderTextColor={Colors.textSecondary} value={balance} onChangeText={setBalance2} keyboardType="decimal-pad" />

            <Text style={s.fieldLabel}>4 derniers chiffres (optionnel)</Text>
            <TextInput style={s.input} placeholder="1234" placeholderTextColor={Colors.textSecondary} value={lastFour} onChangeText={setLastFour} keyboardType="number-pad" maxLength={4} />

            <Text style={s.fieldLabel}>Couleur de la carte</Text>
            <View style={s.colorRow}>
              {CARD_COLORS.map(c => (
                <TouchableOpacity key={c} style={[s.colorDot, { backgroundColor: c }, color === c && s.colorDotActive]} onPress={() => setColor(c)} />
              ))}
            </View>

            {/* Preview */}
            <View style={[s.preview, { backgroundColor: color }]}>
              <Text style={s.cardBankName}>{bank || 'Banque'}</Text>
              <Text style={s.cardNumber}>{lastFour ? `•••• ${lastFour}` : 'Compte'}</Text>
              <Text style={s.cardBalance}>{balance || '0'} MAD</Text>
            </View>

            <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
              <Text style={s.addBtnTxt}>Ajouter le compte</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit balance modal */}
      <Modal visible={!!showEdit} transparent animationType="fade">
        <View style={s.editOverlay}>
          <View style={s.editSheet}>
            <Text style={s.editTitle}>Mettre à jour le solde</Text>
            <Text style={s.editName}>{showEdit?.name}</Text>
            <TextInput
              style={s.editInput}
              value={editBal}
              onChangeText={setEditBal}
              keyboardType="decimal-pad"
              autoFocus
              placeholder="0.00"
              placeholderTextColor={Colors.textSecondary}
            />
            <View style={s.editRow}>
              <TouchableOpacity style={s.editCancel} onPress={() => setShowEdit(null)}>
                <Text style={s.editCancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.editConfirm} onPress={handleEditBalance}>
                <Text style={s.editConfirmTxt}>Mettre à jour ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll:    { padding: 16, paddingBottom: 110 },

  netWorth: {
    backgroundColor: Colors.primary, borderRadius: 24, padding: 22, marginBottom: 20,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  nwLabel:    { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  nwAmt:      { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -1, marginVertical: 6 },
  nwStats:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 14, padding: 12, marginTop: 8 },
  nwStat:     { flex: 1, alignItems: 'center' },
  nwStatVal:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  nwStatLabel:{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  nwDivider:  { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

  cardsWrap:  { marginBottom: 16 },
  cardShadowWrap: { shadowColor: '#0A1628', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  bankCard: {
    width: CARD_W, height: CARD_W * 0.56, borderRadius: 22, padding: 20,
    justifyContent: 'space-between',
  },
  cardTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBankName:{ color: '#fff', fontSize: 16, fontWeight: '700' },
  cardWifi:    { color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: -2 },
  cardChip:    { width: 36, height: 26, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.25)' },
  cardNumber:  { color: 'rgba(255,255,255,0.8)', fontSize: 15, letterSpacing: 2, fontWeight: '500' },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardBalLabel:{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600', marginBottom: 2 },
  cardBalance: { color: '#fff', fontSize: 22, fontWeight: '800' },
  cardAccountName: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },

  listCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 18,
    shadowColor: '#0A1628', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  listTitle: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  listRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  listDot:   { width: 10, height: 10, borderRadius: 5 },
  listInfo:  { flex: 1, minWidth: 0 },
  listName:  { fontSize: 14, fontWeight: '600', color: Colors.text },
  listBank:  { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  listBal:   { fontSize: 14, fontWeight: '700', color: Colors.text, flexShrink: 0 },

  emptyWrap:  { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyTxt:   { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  fab: {
    position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },

  // Modal
  modal:      { flex: 1, backgroundColor: Colors.background },
  modalHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  modalBody:  { padding: 20, gap: 0, paddingBottom: 40 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 8 },
  input:      { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, padding: 14, fontSize: 16, backgroundColor: Colors.card, color: Colors.text },
  bigInput:   { fontSize: 28, fontWeight: '700' },
  pillRow:    { gap: 8 },
  pill:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillTxt:    { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  pillTxtActive: { color: '#fff' },
  typeRow:    { flexDirection: 'row', gap: 8 },
  typeBtn:    { flex: 1, padding: 10, borderRadius: 12, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  typeBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  typeTxt:    { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  typeTxtActive: { color: Colors.primary },
  colorRow:   { flexDirection: 'row', gap: 12, marginBottom: 4 },
  colorDot:   { width: 36, height: 36, borderRadius: 18 },
  colorDotActive: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  preview:    { height: 90, borderRadius: 16, padding: 16, justifyContent: 'space-between', marginTop: 16 },
  addBtn:     { backgroundColor: Colors.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 28 },
  addBtnTxt:  { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Edit modal
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  editSheet:   { backgroundColor: Colors.card, borderRadius: 24, padding: 24, gap: 12 },
  editTitle:   { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', fontWeight: '600' },
  editName:    { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  editInput:   { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, padding: 16, fontSize: 28, fontWeight: '700', textAlign: 'center', color: Colors.text, backgroundColor: Colors.background },
  editRow:     { flexDirection: 'row', gap: 10, marginTop: 4 },
  editCancel:  { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  editCancelTxt: { color: Colors.textSecondary, fontWeight: '600' },
  editConfirm: { flex: 2, backgroundColor: Colors.primary, borderRadius: 14, padding: 14, alignItems: 'center' },
  editConfirmTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
