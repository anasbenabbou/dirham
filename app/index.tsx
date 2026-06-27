import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(50)).current;
  const card1 = useRef(new Animated.Value(60)).current;
  const card2 = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(card2, { toValue: 0, tension: 55, friction: 11, useNativeDriver: true }),
      Animated.spring(card1, { toValue: 0, tension: 55, friction: 11, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fade,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  function enter() {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(slide, { toValue: -30, duration: 280, useNativeDriver: true }),
    ]).start(() => router.replace('/(tabs)'));
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Background decoration circles */}
      <View style={[s.circle, s.circleTop]} />
      <View style={[s.circle, s.circleMid]} />

      {/* Card stack */}
      <View style={s.cardArea}>
        <Animated.View style={[s.card, s.cardBack, { transform: [{ translateY: card2 }, { rotate: '-6deg' }] }]}>
          <Text style={s.cardBankBack}>CIH Bank</Text>
        </Animated.View>
        <Animated.View style={[s.card, s.cardFront, { transform: [{ translateY: card1 }, { rotate: '2deg' }] }]}>
          <View style={s.cardHeader}>
            <Text style={s.cardBank}>Attijariwafa</Text>
            <Text style={s.cardContactless}>))))</Text>
          </View>
          <View style={s.cardChip} />
          <Text style={s.cardNum}>•••• •••• •••• 4532</Text>
          <View style={s.cardFooter}>
            <Text style={s.cardHolder}>VOTRE NOM</Text>
            <Text style={s.cardExpiry}>05/28</Text>
          </View>
        </Animated.View>
      </View>

      {/* Text + CTA */}
      <Animated.View style={[s.bottom, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <Text style={s.headline}>Votre argent,{'\n'}sous contrôle.</Text>
        <Text style={s.sub}>Suivez vos dépenses, gérez vos comptes{'\n'}et faites croître votre épargne.</Text>

        <TouchableOpacity style={s.cta} onPress={enter} activeOpacity={0.88}>
          <Text style={s.ctaTxt}>Démarrer</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const CARD_W = width * 0.82;
const CARD_H = CARD_W * 0.58;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060D1F', alignItems: 'center' },

  circle: { position: 'absolute', borderRadius: 999 },
  circleTop: { width: 440, height: 440, top: -140, left: -80, backgroundColor: '#0057FF', opacity: 0.15 },
  circleMid: { width: 300, height: 300, top: height * 0.28, right: -100, backgroundColor: '#0057FF', opacity: 0.08 },

  cardArea: {
    marginTop: height * 0.14,
    width: CARD_W, height: CARD_H + 60,
    position: 'relative', alignItems: 'center',
  },
  card: {
    position: 'absolute', width: CARD_W, height: CARD_H,
    borderRadius: 22, padding: 22,
  },
  cardBack: {
    backgroundColor: '#1A2744',
    top: 30, left: 0,
    justifyContent: 'flex-end',
  },
  cardBankBack: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '600' },
  cardFront: {
    backgroundColor: '#0057FF',
    top: 0,
    shadowColor: '#0057FF',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 18,
    justifyContent: 'space-between',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBank: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  cardContactless: { color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: -2 },
  cardChip: { width: 38, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 8 },
  cardNum: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '500', letterSpacing: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardHolder: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  cardExpiry: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },

  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0C1428',
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingHorizontal: 32, paddingTop: 36, paddingBottom: 56,
    gap: 10,
  },
  headline: { fontSize: 38, fontWeight: '800', color: '#fff', lineHeight: 46, letterSpacing: -1 },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 22, marginTop: 4, marginBottom: 12 },
  cta: {
    backgroundColor: '#0057FF', borderRadius: 18,
    paddingVertical: 18, alignItems: 'center', marginTop: 8,
    shadowColor: '#0057FF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  ctaTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
