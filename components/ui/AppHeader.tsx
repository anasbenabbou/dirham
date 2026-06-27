import { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';

/** Consistent top bar. Optional back chevron, title/subtitle, right slot. */
export function AppHeader({
  title, subtitle, showBack = false, right, large = false,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
  /** Large = bigger title, used on top-level tab screens */
  large?: boolean;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const s = StyleSheet.create({
    wrap: {
      paddingTop: insets.top + 6,
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.md,
      backgroundColor: t.colors.bg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
    },
    back: {
      width: 40, height: 40, borderRadius: 20, marginLeft: -6,
      backgroundColor: t.colors.surface, justifyContent: 'center', alignItems: 'center',
    },
    titles: { flex: 1 },
    title: large
      ? { ...t.font.title, color: t.colors.text }
      : { ...t.font.heading, color: t.colors.text },
    sub: { ...t.font.caption, color: t.colors.textSecondary, marginTop: 2 },
    right: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  });

  return (
    <View style={s.wrap}>
      {showBack && (
        <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={t.colors.text} />
        </TouchableOpacity>
      )}
      <View style={s.titles}>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={s.sub} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right && <View style={s.right}>{right}</View>}
    </View>
  );
}

/** Circular icon button for header actions. */
export function HeaderIconButton({
  icon, onPress, tint, filled = false,
}: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; tint?: string; filled?: boolean }) {
  const t = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: filled ? t.colors.primary : t.colors.surface,
        justifyContent: 'center', alignItems: 'center',
      }}
    >
      <Ionicons name={icon} size={20} color={filled ? t.colors.onPrimary : (tint ?? t.colors.text)} />
    </TouchableOpacity>
  );
}
