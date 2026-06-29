import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, Animated, StyleSheet } from 'react-native';
import {
  GestureHandlerRootView, PanGestureHandler, State,
  PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { useUIStore } from '../store/useUIStore';
import { haptic } from '../lib/haptics';

type IconName = keyof typeof Ionicons.glyphMap;
const HIDE = 520; // distance to translate the panel fully off-screen

export default function NavMenu() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { menuOpen, closeMenu, openQuickAdd } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const translateY = useRef(new Animated.Value(HIDE)).current;

  useEffect(() => {
    if (menuOpen) {
      setMounted(true);
      translateY.setValue(HIDE);
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }).start();
    } else if (mounted) {
      Animated.timing(translateY, { toValue: HIDE, duration: 200, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [menuOpen]);

  if (!mounted) return null;

  const backdrop = translateY.interpolate({ inputRange: [0, HIDE], outputRange: [1, 0], extrapolate: 'clamp' });

  function onDrag(e: PanGestureHandlerGestureEvent) {
    const ty = e.nativeEvent.translationY;
    translateY.setValue(ty > 0 ? ty : ty * 0.25); // resist upward drag
  }
  function onDragEnd(e: PanGestureHandlerStateChangeEvent) {
    if (e.nativeEvent.state !== State.END) return;
    if (e.nativeEvent.translationY > 110 || e.nativeEvent.velocityY > 800) closeMenu();
    else Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }).start();
  }

  const tiles: { icon: IconName; label: string; sub: string; color: string; to: string }[] = [
    { icon: 'receipt-outline',  label: 'Transactions', sub: 'Historique & recherche', color: t.colors.primary, to: '/transactions' },
    { icon: 'briefcase-outline', label: 'Portefeuille', sub: 'Valeur, impots, frais', color: t.colors.success, to: '/my-portfolio' },
    { icon: 'school-outline', label: 'Coach', sub: 'Regles investissement', color: t.colors.gold, to: '/investment-coach' },
    { icon: 'pie-chart-outline', label: 'Budget',       sub: 'Règle 40 / 20 / 40',    color: t.colors.gold,    to: '/budget' },
    { icon: 'pulse-outline',    label: 'Analyses',     sub: 'Santé & tendances',     color: t.colors.primary, to: '/insights' },
    { icon: 'repeat',           label: 'Récurrents',   sub: 'Salaire, loyer…',       color: '#8B7CFF',        to: '/recurring' },
    { icon: 'settings-outline', label: 'Réglages',     sub: 'Thème, notifications',  color: t.colors.textSecondary, to: '/settings' },
  ];

  function go(to: string) {
    haptic.light();
    closeMenu();
    setTimeout(() => router.push(to as any), 140);
  }
  function newTx() { haptic.light(); closeMenu(); setTimeout(openQuickAdd, 220); }

  const s = StyleSheet.create({
    fill: { flex: 1, justifyContent: 'flex-end' },
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: t.colors.overlay },
    panel: {
      backgroundColor: t.colors.bgElevated,
      borderTopLeftRadius: t.radius.xxl, borderTopRightRadius: t.radius.xxl,
      borderWidth: 1, borderColor: t.colors.border, borderBottomWidth: 0,
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.sm,
      paddingBottom: Math.max(insets.bottom, t.spacing.lg) + t.spacing.sm,
      ...t.shadow.float,
    },
    gripZone: { alignItems: 'center', paddingVertical: t.spacing.sm },
    grip: { width: 42, height: 5, borderRadius: 3, backgroundColor: t.colors.borderStrong },
    title: { ...t.font.micro, color: t.colors.textTertiary, marginBottom: t.spacing.md, marginTop: t.spacing.xs },
    primary: {
      flexDirection: 'row', alignItems: 'center', gap: t.spacing.md,
      backgroundColor: t.colors.primary, borderRadius: t.radius.lg, padding: t.spacing.lg, marginBottom: t.spacing.lg,
    },
    primaryIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    primaryTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
    primarySub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
    tile: {
      width: '47.5%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: t.spacing.md,
      backgroundColor: t.colors.card, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.colors.border,
      padding: t.spacing.md,
    },
    tileIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    tileLabel: { ...t.font.label, color: t.colors.text },
    tileSub: { fontSize: 10, color: t.colors.textTertiary, marginTop: 1 },
  });

  return (
    <Modal transparent visible animationType="none" onRequestClose={closeMenu} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={s.fill}>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <Animated.View style={[s.scrim, { opacity: backdrop }]} />
          </TouchableWithoutFeedback>

          <PanGestureHandler activeOffsetY={10} onGestureEvent={onDrag} onHandlerStateChange={onDragEnd}>
            <Animated.View style={[s.panel, { transform: [{ translateY }] }]}>
              <View style={s.gripZone}><View style={s.grip} /></View>

              <TouchableOpacity style={s.primary} activeOpacity={0.9} onPress={newTx}>
                <View style={s.primaryIcon}><Ionicons name="add" size={26} color="#fff" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.primaryTitle}>Nouvelle transaction</Text>
                  <Text style={s.primarySub}>Dépense ou revenu</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>

              <Text style={s.title}>Aller à</Text>
              <View style={s.grid}>
                {tiles.map(tile => (
                  <TouchableOpacity key={tile.to} style={s.tile} activeOpacity={0.8} onPress={() => go(tile.to)}>
                    <View style={[s.tileIcon, { backgroundColor: tile.color + '22' }]}>
                      <Ionicons name={tile.icon} size={20} color={tile.color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.tileLabel} numberOfLines={1}>{tile.label}</Text>
                      <Text style={s.tileSub} numberOfLines={1}>{tile.sub}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
