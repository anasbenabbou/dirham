import { ReactNode } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useKeyboardHeight } from '../../lib/useKeyboard';

/** Bottom sheet modal — tap-scrim-to-close, themed, lifts above the keyboard. */
export function Sheet({
  visible, onClose, title, children,
}: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const kb = useKeyboardHeight();
  const s = StyleSheet.create({
    scrim: { flex: 1, backgroundColor: t.colors.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: t.colors.bgElevated,
      borderTopLeftRadius: t.radius.xxl, borderTopRightRadius: t.radius.xxl,
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.md,
      // Lift the whole sheet above the keyboard; drop the safe-area pad while it's up.
      marginBottom: kb,
      paddingBottom: (kb > 0 ? t.spacing.md : Math.max(insets.bottom, t.spacing.xl)) + t.spacing.sm,
      borderWidth: 1, borderColor: t.colors.border,
    },
    grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.borderStrong, marginBottom: t.spacing.lg },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: t.spacing.lg },
    title: { ...t.font.heading, color: t.colors.text },
    close: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.colors.surface, justifyContent: 'center', alignItems: 'center' },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.scrim}>
          <TouchableWithoutFeedback>
            <View style={s.sheet}>
              <View style={s.grip} />
              {title && (
                <View style={s.head}>
                  <Text style={s.title}>{title}</Text>
                  <TouchableOpacity style={s.close} onPress={onClose} activeOpacity={0.7}>
                    <Ionicons name="close" size={18} color={t.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
