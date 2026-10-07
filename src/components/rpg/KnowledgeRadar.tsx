import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getArea } from '@/content';
import type { AreaProgress } from '@/hooks/useProgress';
import { useI18n } from '@/hooks/useI18n';
import { areaThemes, colors, fonts, spacing } from '@/theme';

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 84;

function point(index: number, count: number, value: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return { x: CENTER + Math.cos(angle) * RADIUS * value, y: CENTER + Math.sin(angle) * RADIUS * value };
}

/** Radar chart of the eight knowledge stats (0–100 %). Decorative; the list below carries the values for screen readers. */
export function KnowledgeRadar({ areas }: { areas: AreaProgress[] }) {
  const { l } = useI18n();
  const count = areas.length;
  const shape = areas
    .map((a, i) => point(i, count, Math.max(0.04, a.knowledge / 100)))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <View style={styles.center} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <Polygon
            key={ring}
            points={areas.map((_, i) => point(i, count, ring)).map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        {areas.map((_, i) => {
          const p = point(i, count, 1);
          return <Line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke={colors.border} strokeWidth={1} />;
        })}
        <Polygon points={shape} fill="rgba(15,122,110,0.28)" stroke={colors.primary} strokeWidth={2.5} />
        {areas.map((a, i) => {
          const p = point(i, count, Math.max(0.04, a.knowledge / 100));
          return <Circle key={a.id} cx={p.x} cy={p.y} r={4} fill={areaThemes[a.id].accent} />;
        })}
        {areas.map((a, i) => {
          const p = point(i, count, 1.3);
          // Long stat names wrap onto two lines so they stay inside the chart.
          const words = l(getArea(a.id)?.statName).split(' ');
          const lines = words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : words;
          return lines.map((line, row) => (
            <SvgText
              key={`label-${a.id}-${row}`}
              x={p.x}
              y={p.y + 4 + (row - (lines.length - 1) / 2) * 13}
              fontSize={11}
              fontFamily={fonts.bold}
              fill={colors.textMuted}
              textAnchor="middle"
            >
              {line}
            </SvgText>
          ));
        })}
      </Svg>
    </View>
  );
}

/** Accessible list version of the knowledge stats. */
export function KnowledgeList({ areas }: { areas: AreaProgress[] }) {
  const { l } = useI18n();
  return (
    <View style={styles.list}>
      {areas.map((a) => {
        const name = l(getArea(a.id)?.statName);
        return (
          <View key={a.id} style={styles.row} accessible accessibilityLabel={`${name}: ${a.knowledge} %`}>
            <AppText variant="small" style={styles.name}>
              {name}
            </AppText>
            <ProgressBar progress={a.knowledge / 100} color={areaThemes[a.id].accent} style={styles.bar} />
            <AppText variant="small" color={colors.textMuted} style={styles.value}>
              {a.knowledge}%
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { width: 96 },
  bar: { flex: 1, width: undefined },
  value: { width: 44, textAlign: 'right' },
});
