import { ReactNode } from 'react';
import { View, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/** Themed surface panel with consistent radius, border and elevation. */
export function Card({
  children, style, onPress, onLongPress, elevated = false, padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  elevated?: boolean;
  padded?: boolean;
}) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: elevated ? t.colors.cardAlt : t.colors.card,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: padded ? t.spacing.lg : 0,
    ...t.shadow.card,
  };
  if (onPress || onLongPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} onLongPress={onLongPress} style={[base, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
