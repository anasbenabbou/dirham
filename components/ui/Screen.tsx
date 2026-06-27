import { ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

/** Full-screen themed container. Use `scroll` for scrollable bodies. */
export function Screen({
  children, scroll = false, padded = false, edges = ['top'], contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: ViewStyle;
}) {
  const t = useTheme();
  const pad = padded ? { padding: t.spacing.lg } : null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={edges}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[{ paddingBottom: 120 }, pad, contentStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

/** Small uppercase section label used above cards/lists. */
export function SectionLabel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <Text style={[
      { ...t.font.micro, color: t.colors.textTertiary, marginBottom: t.spacing.md },
      style as any,
    ]}>
      {children}
    </Text>
  );
}

/** Centered empty-state block. */
export function EmptyState({
  icon, title, subtitle, action,
}: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  const t = useTheme();
  const s = StyleSheet.create({
    wrap: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 40, gap: 10 },
    iconWrap: {
      width: 72, height: 72, borderRadius: 36, marginBottom: 6,
      backgroundColor: t.colors.surface, justifyContent: 'center', alignItems: 'center',
    },
    title: { ...t.font.heading, color: t.colors.text, textAlign: 'center' },
    sub: { ...t.font.body, color: t.colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  });
  return (
    <View style={s.wrap}>
      {icon && <View style={s.iconWrap}>{icon}</View>}
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.sub}>{subtitle}</Text>}
      {action}
    </View>
  );
}
