import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useUIStore } from '../store/useUIStore';

const SCREEN_W = Dimensions.get('window').width;
const N_TABS   = 4; // real tab slots
const SLOTS    = 5; // visual slots (4 tabs + center)
const SLOT_W   = SCREEN_W / SLOTS;
const IND_W    = 28;

// Visual slot for each route index (skips slot 2 which is center +)
const VISUAL_SLOT = [0, 1, 3, 4];

type IName = React.ComponentProps<typeof Ionicons>['name'];
const TABS: { label: string; icon: IName; active: IName }[] = [
  { label: 'Accueil',   icon: 'home-outline',    active: 'home' },
  { label: 'Cartes',    icon: 'card-outline',    active: 'card' },
  { label: 'Objectifs', icon: 'flag-outline',    active: 'flag' },
  { label: 'Bourse',    icon: 'trending-up-outline', active: 'trending-up' },
];

function indX(routeIdx: number) {
  return VISUAL_SLOT[routeIdx] * SLOT_W + (SLOT_W - IND_W) / 2;
}

export default function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const openQuickAdd = useUIStore(s => s.openQuickAdd);
  const indicatorX   = useRef(new Animated.Value(indX(state.index))).current;
  const scales       = useRef(TABS.map((_, i) => new Animated.Value(i === state.index ? 1 : 0.8))).current;
  const labelOps     = useRef(TABS.map((_, i) => new Animated.Value(i === state.index ? 1 : 0))).current;
  const plusScale    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: indX(state.index),
      useNativeDriver: true,
      tension: 78, friction: 11,
    }).start();

    scales.forEach((sv, i) => {
      Animated.spring(sv, {
        toValue: i === state.index ? 1 : 0.8,
        useNativeDriver: true,
        tension: 78, friction: 11,
      }).start();
    });
    labelOps.forEach((lo, i) => {
      Animated.timing(lo, {
        toValue: i === state.index ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  function pressPlus() {
    Animated.sequence([
      Animated.spring(plusScale, { toValue: 0.88, useNativeDriver: true, tension: 200, friction: 8 }),
      Animated.spring(plusScale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    openQuickAdd();
  }

  const pb = Math.max(insets.bottom, 10);

  return (
    <View style={[s.bar, { paddingBottom: pb }]}>
      {/* Sliding indicator */}
      <Animated.View style={[s.indicator, { transform: [{ translateX: indicatorX }] }]} />

      {/* Tab 0 & 1 */}
      {[0, 1].map(i => {
        const focused = state.index === i;
        return (
          <TouchableOpacity key={i} style={s.tab} onPress={() => navigation.navigate(state.routes[i].name)} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: scales[i] }], alignItems: 'center', gap: 2 }}>
              <Ionicons name={focused ? TABS[i].active : TABS[i].icon} size={24} color={focused ? Colors.primary : Colors.tabBarInactive} />
              <Animated.Text style={[s.label, { opacity: labelOps[i], color: Colors.primary }]} numberOfLines={1}>
                {TABS[i].label}
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}

      {/* Center + button */}
      <View style={s.centerSlot}>
        <Animated.View style={{ transform: [{ scale: plusScale }] }}>
          <TouchableOpacity style={s.plusBtn} onPress={pressPlus} activeOpacity={0.9}>
            <Text style={s.plusTxt}>+</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Tab 2 & 3 */}
      {[2, 3].map(i => {
        const focused = state.index === i;
        return (
          <TouchableOpacity key={i} style={s.tab} onPress={() => navigation.navigate(state.routes[i].name)} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: scales[i] }], alignItems: 'center', gap: 2 }}>
              <Ionicons name={focused ? TABS[i].active : TABS[i].icon} size={24} color={focused ? Colors.primary : Colors.tabBarInactive} />
              <Animated.Text style={[s.label, { opacity: labelOps[i], color: Colors.primary }]} numberOfLines={1}>
                {TABS[i].label}
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
    overflow: 'visible',
    shadowColor: '#0057FF',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 14,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: IND_W,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    minHeight: 56,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  centerSlot: {
    width: SLOT_W,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    overflow: 'visible',
  },
  plusBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: -20,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  plusTxt: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
});
