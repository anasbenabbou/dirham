import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppHeader, Card, SectionLabel } from '../components/ui';
import { useTheme, useThemeMode } from '../theme/ThemeProvider';
import { ThemeMode } from '../constants/theme';
import { notificationsEnabled, setNotificationsEnabled } from '../lib/notifications';
import { haptic } from '../lib/haptics';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'dark',   label: 'Sombre',  icon: 'moon' },
  { mode: 'light',  label: 'Clair',   icon: 'sunny' },
  { mode: 'system', label: 'Système', icon: 'phone-portrait' },
];

export default function SettingsScreen() {
  const t = useTheme();
  const { mode, setMode } = useThemeMode();
  const [notif, setNotif] = useState(notificationsEnabled());

  async function toggleNotif(v: boolean) {
    haptic.select();
    if (v) {
      const ok = await setNotificationsEnabled(true);
      setNotif(ok);
      if (!ok) Alert.alert('Notifications refusées', "Activez les notifications dans les réglages du téléphone pour recevoir les rappels.");
    } else {
      await setNotificationsEnabled(false);
      setNotif(false);
    }
  }

  const s = StyleSheet.create({
    body: { padding: t.spacing.lg, gap: t.spacing.lg },
    themeRow: { flexDirection: 'row', gap: t.spacing.md },
    themeBtn: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: t.spacing.lg, borderRadius: t.radius.lg, backgroundColor: t.colors.surface, borderWidth: 1.5, borderColor: t.colors.border },
    themeBtnOn: { borderColor: t.colors.primary, backgroundColor: t.colors.primarySoft },
    themeLabel: { ...t.font.label, color: t.colors.textSecondary },
    themeLabelOn: { color: t.colors.primary },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: 14 },
    rowDivider: { borderTopWidth: 1, borderTopColor: t.colors.border },
    rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: t.colors.surface, justifyContent: 'center', alignItems: 'center' },
    rowLabel: { ...t.font.body, color: t.colors.text, flex: 1 },
    rowValue: { ...t.font.caption, color: t.colors.textSecondary },
    brand: { alignItems: 'center', gap: 4, paddingVertical: t.spacing.xl },
    brandName: { ...t.font.heading, color: t.colors.text },
    brandSub: { ...t.font.caption, color: t.colors.textTertiary },
  });

  const NavRow = ({ icon, label, to, divider }: { icon: keyof typeof Ionicons.glyphMap; label: string; to: string; divider?: boolean }) => (
    <TouchableOpacity style={[s.row, divider && s.rowDivider]} onPress={() => router.push(to as any)} activeOpacity={0.7}>
      <View style={s.rowIcon}><Ionicons name={icon} size={18} color={t.colors.textSecondary} /></View>
      <Text style={s.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={t.colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppHeader title="Réglages" showBack />
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View>
          <SectionLabel>Apparence</SectionLabel>
          <View style={s.themeRow}>
            {THEME_OPTIONS.map(o => {
              const on = mode === o.mode;
              return (
                <TouchableOpacity key={o.mode} style={[s.themeBtn, on && s.themeBtnOn]} onPress={() => { haptic.select(); setMode(o.mode); }} activeOpacity={0.85}>
                  <Ionicons name={o.icon} size={24} color={on ? t.colors.primary : t.colors.textSecondary} />
                  <Text style={[s.themeLabel, on && s.themeLabelOn]}>{o.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View>
          <SectionLabel>Outils</SectionLabel>
          <Card padded={false} style={{ paddingHorizontal: t.spacing.lg }}>
            <NavRow icon="bar-chart-outline" label="Analyses & tendances" to="/insights" />
            <NavRow icon="pricetags-outline" label="Catégories" to="/categories" divider />
            <NavRow icon="repeat" label="Transactions récurrentes" to="/recurring" divider />
            <NavRow icon="pie-chart-outline" label="Budget 40/20/40" to="/budget" divider />
          </Card>
        </View>

        <View>
          <SectionLabel>Préférences</SectionLabel>
          <Card padded={false} style={{ paddingHorizontal: t.spacing.lg }}>
            <View style={s.row}>
              <View style={s.rowIcon}><Ionicons name="notifications-outline" size={18} color={t.colors.textSecondary} /></View>
              <Text style={s.rowLabel}>Notifications</Text>
              <Switch value={notif} onValueChange={toggleNotif} trackColor={{ true: t.colors.primary, false: t.colors.border }} thumbColor="#fff" />
            </View>
            <View style={[s.row, s.rowDivider]}>
              <View style={s.rowIcon}><Ionicons name="cash-outline" size={18} color={t.colors.textSecondary} /></View>
              <Text style={s.rowLabel}>Devise</Text>
              <Text style={s.rowValue}>MAD (Dirham)</Text>
            </View>
            <View style={[s.row, s.rowDivider]}>
              <View style={s.rowIcon}><Ionicons name="lock-closed-outline" size={18} color={t.colors.textSecondary} /></View>
              <Text style={s.rowLabel}>Données</Text>
              <Text style={s.rowValue}>Stockées localement</Text>
            </View>
          </Card>
        </View>

        <View style={s.brand}>
          <Text style={s.brandName}>Dirham</Text>
          <Text style={s.brandSub}>Version 1.0.0 · Hors ligne</Text>
        </View>
      </ScrollView>
    </View>
  );
}
