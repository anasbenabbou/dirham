import { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/** Pulsing placeholder block for loading states. */
export function Skeleton({ width, height, radius, style }: { width?: number | string; height?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const op = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [op]);
  return (
    <Animated.View
      style={[
        { width: (width ?? '100%') as any, height: height ?? 16, borderRadius: radius ?? t.radius.sm, backgroundColor: t.colors.surface, opacity: op },
        style,
      ]}
    />
  );
}
