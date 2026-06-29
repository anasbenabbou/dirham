import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const COLORS = ['#F0B90B', '#0ECB81', '#3D7BFF', '#FF6FD8', '#3DD6C4', '#FF8A3D', '#8B7CFF'];

function colorFor(ticker: string): string {
  const n = ticker.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return COLORS[n % COLORS.length];
}

export default function CompanyAvatar({
  ticker, size = 36,
}: {
  ticker: string;
  size?: number;
}) {
  const t = useTheme();
  const color = colorFor(ticker);
  const label = ticker.replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase();
  const s = StyleSheet.create({
    root: {
      width: size, height: size, borderRadius: Math.max(8, size / 3),
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: `${color}22`,
      borderWidth: 1, borderColor: `${color}66`,
    },
    txt: { fontSize: size <= 34 ? 10 : 11, fontWeight: '800', color: t.colors.text },
  });
  return (
    <View style={s.root}>
      <Text style={s.txt} numberOfLines={1}>{label}</Text>
    </View>
  );
}
