import { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useUIStore } from '../store/useUIStore';
import { haptic } from '../lib/haptics';

const SCREEN_W = Dimensions.get('window').width;
const SLOT_W = SCREEN_W / 5;

type IName = React.ComponentProps<typeof Ionicons>['name'];
const TABS: { label: string; icon: IName; active: IName }[] = [
  { label: 'Accueil',   icon: 'home-outline',        active: 'home'        },
  { label: 'Comptes',   icon: 'card-outline',        active: 'card'        },
  { label: 'Objectifs', icon: 'flag-outline',        active: 'flag'        },
  { label: 'Bourse',    icon: 'stats-chart-outline', active: 'stats-chart' },
];

export default function TabBar({ state, navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const openQuickAdd = useUIStore(s => s.openQuickAdd);
  const openMenu = useUIStore(s => s.openMenu);
  const plusScale = useRef(new Animated.Value(1)).current;

  function pressPlus() {
    haptic.light();
    Animated.sequence([
      Animated.spring(plusScale, { toValue: 0.9, useNativeDriver: true, tension: 200, friction: 8 }),
      Animated.spring(plusScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    openQuickAdd();
  }
  // Swipe up on the bar — or long-press the + — opens the navigation menu.
  function onBarPan(e: PanGestureHandlerStateChangeEvent) {
    if (e.nativeEvent.state === State.ACTIVE) { haptic.light(); openMenu(); }
  }

  const pb = Math.max(insets.bottom, 10);

  const s = StyleSheet.create({
    bar: {
      flexDirection: 'row', alignItems: 'flex-end', overflow: 'visible',
      backgroundColor: t.colors.tabBar,
      borderTopLeftRadius: 26, borderTopRightRadius: 26,
      borderWidth: 1, borderBottomWidth: 0, borderColor: t.colors.border,
      paddingTop: 12, paddingBottom: pb,
      shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: t.scheme === 'dark' ? 0.4 : 0.08, shadowRadius: 16, elevation: 16,
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    iconWrap: { paddingHorizontal: 18, paddingVertical: 5, borderRadius: t.radius.pill, marginBottom: 3 },
    iconWrapOn: { backgroundColor: t.colors.primarySoft },
    label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
    centerSlot: { width: SLOT_W, alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' },
    plusBtn: {
      width: 58, height: 58, borderRadius: 29, marginBottom: 6, marginTop: -26,
      backgroundColor: t.colors.primary, justifyContent: 'center', alignItems: 'center',
      borderWidth: 5, borderColor: t.colors.tabBar,
      shadowColor: t.colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 12,
    },
  });

  const renderTab = (i: number) => {
    const focused = state.index === i;
    const color = focused ? t.colors.primary : t.colors.textTertiary;
    return (
      <TouchableOpacity key={i} style={s.tab} activeOpacity={0.7}
        onPress={() => navigation.navigate(state.routes[i].name)}>
        <View style={[s.iconWrap, focused && s.iconWrapOn]}>
          <Ionicons name={focused ? TABS[i].active : TABS[i].icon} size={22} color={color} />
        </View>
        <Text style={[s.label, { color }]} numberOfLines={1}>{TABS[i].label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <PanGestureHandler activeOffsetY={-14} onHandlerStateChange={onBarPan}>
      <View style={s.bar}>
        {[0, 1].map(renderTab)}
        <View style={s.centerSlot}>
          <Animated.View style={{ transform: [{ scale: plusScale }] }}>
            <TouchableOpacity style={s.plusBtn} onPress={pressPlus} onLongPress={() => { haptic.light(); openMenu(); }} activeOpacity={0.9}>
              <Ionicons name="add" size={30} color={t.colors.onPrimary} />
            </TouchableOpacity>
          </Animated.View>
        </View>
        {[2, 3].map(renderTab)}
      </View>
    </PanGestureHandler>
  );
}
