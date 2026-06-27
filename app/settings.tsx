import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, SectionLabel } from '../components/ui';
import { useTheme, useThemeMode } from '../theme/ThemeProvider';
import { ThemeMode } from '../constants/theme';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'dark',   label: 'Sombre',     icon: 'moon' },
  { mode: 'light',  label: 'Clair',      icon: 'sunny' },
  { mode: 'system', label: 'Système',    icon: 'phone-portrait' },
];

export default function SettingsScreen() {
  const t = useTheme();
  const { mode, setMode } = useThemeMode();

  const s = StyleSheet.create({
    body: { padding: t.spacing.lg, gap: t.spacing.lg },
    themeRow: { flexDirection: 'row', gap: t.spacing.md },
    themeBtn: {
      flex: 1, alignItems: 'center', gap: 8, paddingVertical: t.spacing.lg, borderRadius: t.radius.lg,
      backgroundColor: t.colors.surface, borderWidth: 1.5, borderColor: t.colors.border,
    },
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
                <TouchableOpacity key={o.mode} style={[s.themeBtn, on && s.themeBtnOn]} onPress={() => setMode(o.mode)} activeOpacity={0.85}>
                  <Ionicons name={o.icon} size={24} color={on ? t.colors.primary : t.colors.textSecondary} />
                  <Text style={[s.themeLabel, on && s.themeLabelOn]}>{o.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View>
          <SectionLabel>Application</SectionLabel>
          <Card padded={false} style={{ paddingHorizontal: t.spacing.lg }}>
            <View style={s.row}>
              <View style={s.rowIcon}><Ionicons name="cash-outline" size={18} color={t.colors.textSecondary} /></View>
              <Text style={s.rowLabel}>Devise</Text>
              <Text style={s.rowValue}>MAD (Dirham)</Text>
            </View>
            <View style={[s.row, s.rowDivider]}>
              <View style={s.rowIcon}><Ionicons name="globe-outline" size={18} color={t.colors.textSecondary} /></View>
              <Text style={s.rowLabel}>Langue</Text>
              <Text style={s.rowValue}>Français</Text>
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
