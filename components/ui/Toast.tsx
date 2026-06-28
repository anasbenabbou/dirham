import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { haptic } from '../../lib/haptics';

type Tone = 'neutral' | 'success' | 'danger';
interface ToastOpts { message: string; tone?: Tone; actionLabel?: string; onAction?: () => void; }

const Ctx = createContext<(o: ToastOpts) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOpts | null>(null);
  const y = useRef(new Animated.Value(120)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(y, { toValue: 120, duration: 220, useNativeDriver: true }).start(() => setToast(null));
  }, [y]);

  const show = useCallback((o: ToastOpts) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(o);
    y.setValue(120);
    Animated.spring(y, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }).start();
    timer.current = setTimeout(hide, o.actionLabel ? 5000 : 3000);
  }, [y, hide]);

  const iconFor: Record<Tone, keyof typeof Ionicons.glyphMap> = {
    neutral: 'information-circle', success: 'checkmark-circle', danger: 'alert-circle',
  };
  const tintFor: Record<Tone, string> = {
    neutral: t.colors.textSecondary, success: t.colors.success, danger: t.colors.danger,
  };
  const tone = toast?.tone ?? 'neutral';

  const s = StyleSheet.create({
    wrap: { position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12) + 78 },
    toast: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: t.colors.cardAlt, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.colors.border,
      paddingVertical: 14, paddingHorizontal: 16, ...t.shadow.float,
    },
    msg: { flex: 1, ...t.font.body, color: t.colors.text },
    action: { ...t.font.label, color: t.colors.primary, paddingHorizontal: 6 },
  });

  return (
    <Ctx.Provider value={show}>
      {children}
      {toast && (
        <Animated.View style={[s.wrap, { transform: [{ translateY: y }] }]} pointerEvents="box-none">
          <View style={s.toast}>
            <Ionicons name={iconFor[tone]} size={20} color={tintFor[tone]} />
            <Text style={s.msg} numberOfLines={2}>{toast.message}</Text>
            {toast.actionLabel && (
              <TouchableOpacity onPress={() => { haptic.light(); toast.onAction?.(); hide(); }} hitSlop={8}>
                <Text style={s.action}>{toast.actionLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}
