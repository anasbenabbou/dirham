import { ReactNode } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps, ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/** iOS-style segmented control. */
export function Segmented<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  const s = StyleSheet.create({
    wrap: { flexDirection: 'row', backgroundColor: t.colors.surface, borderRadius: t.radius.md, padding: 4 },
    seg: { flex: 1, paddingVertical: 10, borderRadius: t.radius.sm + 2, alignItems: 'center' },
    segOn: { backgroundColor: t.colors.primary },
    txt: { ...t.font.label, color: t.colors.textSecondary },
    txtOn: { color: t.colors.onPrimary },
  });
  return (
    <View style={s.wrap}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <TouchableOpacity key={o.value} style={[s.seg, on && s.segOn]} onPress={() => onChange(o.value)} activeOpacity={0.8}>
            <Text style={[s.txt, on && s.txtOn]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Rounded progress track. */
export function ProgressBar({
  progress, color, height = 8, track,
}: { progress: number; color?: string; height?: number; track?: string }) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(progress, 1));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track ?? t.colors.surface, overflow: 'hidden' }}>
      <View style={{ height, width: `${pct * 100}%`, borderRadius: height / 2, backgroundColor: color ?? t.colors.primary }} />
    </View>
  );
}

/** Labeled text input field. */
export function Field({
  label, big = false, style, ...input
}: { label?: string; big?: boolean } & TextInputProps & { style?: ViewStyle }) {
  const t = useTheme();
  const s = StyleSheet.create({
    label: { ...t.font.micro, color: t.colors.textTertiary, marginBottom: 8 },
    input: {
      borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius.md,
      paddingHorizontal: 16, paddingVertical: 14,
      fontSize: big ? 26 : 16, fontWeight: big ? '700' : '500',
      backgroundColor: t.colors.surface, color: t.colors.text,
    },
  });
  return (
    <View>
      {label && <Text style={s.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={t.colors.textTertiary}
        style={[s.input, style]}
        {...input}
      />
    </View>
  );
}

/** Selectable chip / pill (e.g. bank picker). */
export function Pill({
  label, selected, onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        paddingHorizontal: 14, paddingVertical: 9, borderRadius: t.radius.pill,
        backgroundColor: selected ? t.colors.primary : t.colors.surface,
        borderWidth: 1, borderColor: selected ? t.colors.primary : t.colors.border,
      }}
    >
      <Text style={{ ...t.font.label, color: selected ? t.colors.onPrimary : t.colors.textSecondary }}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Small colored stat badge (gain/loss). */
export function Badge({ children, tone }: { children: ReactNode; tone: 'success' | 'danger' | 'neutral' }) {
  const t = useTheme();
  const map = {
    success: { bg: t.colors.successSoft, fg: t.colors.success },
    danger:  { bg: t.colors.dangerSoft, fg: t.colors.danger },
    neutral: { bg: t.colors.surface, fg: t.colors.textSecondary },
  }[tone];
  return (
    <View style={{ backgroundColor: map.bg, borderRadius: t.radius.sm, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text style={{ ...t.font.label, color: map.fg }}>{children}</Text>
    </View>
  );
}
