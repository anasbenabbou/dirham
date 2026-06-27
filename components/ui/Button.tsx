import { Text, TouchableOpacity, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

/** Primary call-to-action button with variants. */
export function Button({
  label, onPress, variant = 'primary', icon, disabled = false, loading = false, style, full = true,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
}) {
  const t = useTheme();

  const bg: Record<Variant, string> = {
    primary:   t.colors.primary,
    secondary: t.colors.surface,
    ghost:     'transparent',
    danger:    t.colors.dangerSoft,
  };
  const fg: Record<Variant, string> = {
    primary:   t.colors.onPrimary,
    secondary: t.colors.text,
    ghost:     t.colors.primary,
    danger:    t.colors.danger,
  };

  const container: ViewStyle = {
    backgroundColor: bg[variant],
    borderRadius: t.radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: full ? 'stretch' : 'flex-start',
    opacity: disabled ? 0.45 : 1,
    borderWidth: variant === 'secondary' ? 1 : 0,
    borderColor: t.colors.border,
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={onPress}
      style={[container, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg[variant]} />}
          <Text style={{ color: fg[variant], fontSize: 16, fontWeight: '700' }}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
