import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';

/* ── Line chart with area fill ─────────────────────────────────────────── */
export function LineChart({
  data, width, height = 140, color, labels,
}: { data: number[]; width: number; height?: number; color?: string; labels?: string[] }) {
  const t = useTheme();
  const stroke = color ?? t.colors.primary;
  const pad = 8;
  const h = height - 20; // leave room for labels
  if (data.length < 2) {
    return <View style={{ height, justifyContent: 'center' }}><Text style={{ color: t.colors.textSecondary, textAlign: 'center', fontSize: 13 }}>Pas assez de données.</Text></View>;
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`;

  return (
    <View>
      <Svg width={width} height={h}>
        <Defs>
          <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stroke} stopOpacity={0.28} />
            <Stop offset="1" stopColor={stroke} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#area)" />
        <Path d={line} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => i === pts.length - 1 && <Circle key={i} cx={p.x} cy={p.y} r={4} fill={stroke} />)}
      </Svg>
      {labels && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          {labels.map((l, i) => <Text key={i} style={{ fontSize: 10, color: t.colors.textTertiary }}>{l}</Text>)}
        </View>
      )}
    </View>
  );
}

/* ── Two-line normalized comparison chart ─────────────────────────────── */
export function CompareChart({
  primary, secondary, width, height = 150, primaryColor, secondaryColor, labels,
}: {
  primary: number[];
  secondary: number[];
  width: number;
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
  labels?: string[];
}) {
  const t = useTheme();
  const a = normalize(primary);
  const b = normalize(secondary);
  const n = Math.min(a.length, b.length);
  if (n < 2) {
    return <View style={{ height, justifyContent: 'center' }}><Text style={{ color: t.colors.textSecondary, textAlign: 'center', fontSize: 13 }}>Historique insuffisant.</Text></View>;
  }
  const p = a.slice(-n);
  const s = b.slice(-n);
  const all = [...p, ...s];
  const max = Math.max(...all, 1);
  const min = Math.min(...all, -1);
  const range = max - min || 1;
  const pad = 8;
  const h = height - 20;
  const pathFor = (series: number[]) => series.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / (series.length - 1);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  return (
    <View>
      <Svg width={width} height={h}>
        <Path d={pathFor(s)} stroke={secondaryColor ?? t.colors.textTertiary} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Path d={pathFor(p)} stroke={primaryColor ?? t.colors.success} strokeWidth={2.8} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
      {labels && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          {labels.map((l, i) => <Text key={i} style={{ fontSize: 10, color: t.colors.textTertiary }}>{l}</Text>)}
        </View>
      )}
    </View>
  );
}

function normalize(data: number[]): number[] {
  const base = data.find(v => v > 0) ?? 0;
  if (base <= 0) return [];
  return data.map(v => ((v - base) / base) * 100);
}

/* ── Grouped/colored bars ──────────────────────────────────────────────── */
export function Bars({
  data, width, height = 130,
}: { data: { value: number; label: string; color?: string }[]; width: number; height?: number }) {
  const t = useTheme();
  const max = Math.max(...data.map(d => d.value), 1);
  const barH = height - 22;
  const slot = width / data.length;
  const bw = Math.min(slot * 0.5, 26);
  return (
    <View>
      <Svg width={width} height={barH}>
        {data.map((d, i) => {
          const hgt = Math.max((d.value / max) * (barH - 6), d.value > 0 ? 4 : 0);
          const x = i * slot + (slot - bw) / 2;
          return <Path key={i} d={roundedTopRect(x, barH - hgt, bw, hgt, 4)} fill={d.color ?? t.colors.primary} />;
        })}
      </Svg>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {data.map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: t.colors.textTertiary }}>{d.label}</Text>
        ))}
      </View>
    </View>
  );
}

function roundedTopRect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

/* ── Donut / allocation chart ──────────────────────────────────────────── */
export function Donut({
  data, size = 160, thickness = 22, centerLabel, centerSub,
}: {
  data: { value: number; color: string }[];
  size?: number; thickness?: number; centerLabel?: string; centerSub?: string;
}) {
  const t = useTheme();
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} stroke={t.colors.surface} strokeWidth={thickness} fill="none" />
        {data.map((d, i) => {
          const len = (d.value / total) * circ;
          const seg = (
            <Circle
              key={i} cx={c} cy={c} r={r} stroke={d.color} strokeWidth={thickness} fill="none"
              strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset}
              strokeLinecap="butt" transform={`rotate(-90 ${c} ${c})`}
            />
          );
          offset += len;
          return seg;
        })}
      </Svg>
      {(centerLabel || centerSub) && (
        <View style={StyleSheet.absoluteFillObject as any} pointerEvents="none">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {centerLabel && <Text style={{ fontSize: 18, fontWeight: '800', color: t.colors.text }}>{centerLabel}</Text>}
            {centerSub && <Text style={{ fontSize: 11, color: t.colors.textSecondary, marginTop: 2 }}>{centerSub}</Text>}
          </View>
        </View>
      )}
    </View>
  );
}
