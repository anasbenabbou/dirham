import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useUIStore } from '../store/useUIStore';

const SCREEN_W = Dimensions.get('window').width;
const SLOTS    = 5;               // 4 tabs + center action
const SLOT_W   = SCREEN_W / SLOTS;
const IND_W    = 26;
const VISUAL_SLOT = [0, 1, 3, 4]; // route index → visual slot (slot 2 = center +)

type IName = React.ComponentProps<typeof Ionicons>['name'];
const TABS: { label: string; icon: IName; active: IName }[] = [
  { label: 'Accueil',   icon: 'home-outline',        active: 'home'        },
  { label: 'Comptes',   icon: 'card-outline',        active: 'card'        },
  { label: 'Objectifs', icon: 'flag-outline',        active: 'flag'        },
  { label: 'Bourse',    icon: 'stats-chart-outline', active: 'stats-chart' },
];

const indX = (routeIdx: number) => VISUAL_SLOT[routeIdx] * SLOT_W + (SLOT_W - IND_W) / 2;

export default function TabBar({ state, navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const openQuickAdd = useUIStore(s => s.openQuickAdd);
  const indicatorX = useRef(new Animated.Value(indX(state.index))).current;
  const scales     = useRef(TABS.map((_, i) => new Animated.Value(i === state.index ? 1 : 0.85))).current;
  const plusScale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(indicatorX, { toValue: indX(state.index), useNativeDriver: true, tension: 78, friction: 11 }).start();
    scales.forEach((sv, i) =>
      Animated.spring(sv, { toValue: i === state.index ? 1 : 0.85, useNativeDriver: true, tension: 78, friction: 11 }).start()
    );
  }, [state.index]);

  function pressPlus() {
    Animated.sequence([
      Animated.spring(plusScale, { toValue: 0.88, useNativeDriver: true, tension: 200, friction: 8 }),
      Animated.spring(plusScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    openQuickAdd();
  }

  const pb = Math.max(insets.bottom, 10);

  const s = StyleSheet.create({
    bar: {
      flexDirection: 'row', alignItems: 'flex-end', overflow: 'visible',
      backgroundColor: t.colors.tabBar,
      borderTopWidth: 1, borderTopColor: t.colors.border,
      paddingBottom: pb,
      ...t.shadow.card,
    },
    indicator: { position: 'absolute', top: 0, width: IND_W, height: 3, borderRadius: 2, backgroundColor: t.colors.primary },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, minHeight: 58, gap: 3 },
    label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
    centerSlot: { width: SLOT_W, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8, overflow: 'visible' },
    plusBtn: {
      width: 56, height: 56, borderRadius: 28, marginBottom: 4, marginTop: -22,
      backgroundColor: t.colors.primary, justifyContent: 'center', alignItems: 'center',
      borderWidth: 4, borderColor: t.colors.tabBar,
      ...t.shadow.float,
    },
  });

  const renderTab = (i: number) => {
    const focused = state.index === i;
    return (
      <TouchableOpacity key={i} style={s.tab} activeOpacity={0.7}
        onPress={() => navigation.navigate(state.routes[i].name)}>
        <Animated.View style={{ transform: [{ scale: scales[i] }], alignItems: 'center', gap: 3 }}>
          <Ionicons name={focused ? TABS[i].active : TABS[i].icon} size={23}
            color={focused ? t.colors.primary : t.colors.textTertiary} />
          <Text style={[s.label, { color: focused ? t.colors.primary : t.colors.textTertiary }]} numberOfLines={1}>
            {TABS[i].label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.bar}>
      <Animated.View style={[s.indicator, { transform: [{ translateX: indicatorX }] }]} />
      {[0, 1].map(renderTab)}
      <View style={s.centerSlot}>
        <Animated.View style={{ transform: [{ scale: plusScale }] }}>
          <TouchableOpacity style={s.plusBtn} onPress={pressPlus} activeOpacity={0.9}>
            <Ionicons name="add" size={30} color={t.colors.onPrimary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
      {[2, 3].map(renderTab)}
    </View>
  );
}
