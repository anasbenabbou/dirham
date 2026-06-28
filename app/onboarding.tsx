import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from '../components/ui';
import { setSetting } from '../db/settings';
import { setNotificationsEnabled } from '../lib/notifications';
import { haptic } from '../lib/haptics';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; color: string }[] = [
  { icon: 'wallet', title: 'Suivez chaque dirham', sub: 'Dépenses, revenus et comptes en un coup d\'œil.', color: '#3D7BFF' },
  { icon: 'pie-chart', title: 'Budgets & objectifs', sub: 'La règle 50/30/20 et vos objectifs d\'épargne.', color: '#0ECB81' },
  { icon: 'stats-chart', title: 'Bourse de Casablanca', sub: 'Portefeuille, MASI et cours en direct.', color: '#F0B90B' },
  { icon: 'sparkles', title: 'Analyses & tendances', sub: 'Patrimoine, prévisions et insights.', color: '#FF6FD8' },
];

export default function OnboardingScreen() {
  const t = useTheme();
  const [notif, setNotif] = useState(false);

  async function finish() {
    haptic.success();
    if (notif) await setNotificationsEnabled(true);
    setSetting('onboardingDone', '1');
    router.replace('/(tabs)');
  }

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.bg, padding: t.spacing.xl, justifyContent: 'space-between' },
    top: { gap: t.spacing.xl, marginTop: t.spacing.xxl },
    brand: { fontSize: 34, fontWeight: '800', color: t.colors.text, letterSpacing: -1 },
    brandSub: { ...t.font.body, color: t.colors.textSecondary, marginTop: 4 },
    feature: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg },
    fIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    fTitle: { ...t.font.heading, color: t.colors.text },
    fSub: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
    notifRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, backgroundColor: t.colors.card, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, marginBottom: t.spacing.lg },
    notifTxt: { flex: 1 },
    notifTitle: { ...t.font.body, fontWeight: '700', color: t.colors.text },
    notifSub: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
    check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  });

  return (
    <SafeAreaView style={s.root}>
      <View style={s.top}>
        <View>
          <Text style={s.brand}>Bienvenue sur Dirham</Text>
          <Text style={s.brandSub}>Votre argent, sous contrôle — et hors ligne.</Text>
        </View>
        <View style={{ gap: t.spacing.xl }}>
          {FEATURES.map(f => (
            <View key={f.title} style={s.feature}>
              <View style={[s.fIcon, { backgroundColor: f.color + '22' }]}>
                <Ionicons name={f.icon} size={24} color={f.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fTitle}>{f.title}</Text>
                <Text style={s.fSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View>
        <TouchableOpacity style={s.notifRow} activeOpacity={0.8} onPress={() => { haptic.select(); setNotif(v => !v); }}>
          <Ionicons name="notifications-outline" size={22} color={t.colors.textSecondary} />
          <View style={s.notifTxt}>
            <Text style={s.notifTitle}>Activer les rappels</Text>
            <Text style={s.notifSub}>Budgets dépassés, objectifs atteints, échéances.</Text>
          </View>
          <View style={[s.check, { borderColor: notif ? t.colors.primary : t.colors.border, backgroundColor: notif ? t.colors.primary : 'transparent' }]}>
            {notif && <Ionicons name="checkmark" size={16} color={t.colors.onPrimary} />}
          </View>
        </TouchableOpacity>
        <Button label="Commencer" icon="arrow-forward" onPress={finish} />
      </View>
    </SafeAreaView>
  );
}
