import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { AREAS } from '@/content';
import { useFeedback } from '@/hooks/useFeedback';
import { useI18n } from '@/hooks/useI18n';
import type { AreaProgress } from '@/hooks/useProgress';
import type { AreaId } from '@/models';
import { areaThemes, colors, radius, spacing } from '@/theme';

const MAP_HEIGHT = 560;
const NODE = 64;

interface WorldMapProps {
  progress: AreaProgress[];
  onSelect: (id: AreaId) => void;
}

/** Illustrated world map: each area is a node, connected along the unlock path. */
export function WorldMap({ progress, onSelect }: WorldMapProps) {
  const { t, l } = useI18n();
  const feedback = useFeedback();
  const [width, setWidth] = useState(0);
  const byId = new Map(progress.map((p) => [p.id, p] as const));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const pos = (x: number, y: number) => ({ left: (x / 100) * width, top: (y / 100) * MAP_HEIGHT });

  const pathD = AREAS.map((a, i) => {
    const p = pos(a.map.x, a.map.y);
    return `${i === 0 ? 'M' : 'L'} ${p.left} ${p.top}`;
  }).join(' ');

  return (
    <View style={styles.root} onLayout={onLayout}>
      <LinearGradient colors={['#1B2150', '#2F3A78', '#C8A46A']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      {width > 0 ? (
        <>
          <Svg width={width} height={MAP_HEIGHT} style={StyleSheet.absoluteFill} pointerEvents="none">
            {Array.from({ length: 28 }, (_, i) => (
              <Circle
                key={i}
                cx={((i * 37) % 100) * (width / 100)}
                cy={((i * 53) % 45) * (MAP_HEIGHT / 100)}
                r={i % 3 === 0 ? 1.8 : 1.1}
                fill="rgba(255,255,255,0.7)"
              />
            ))}
            <Path d={pathD} stroke="rgba(255,255,255,0.55)" strokeWidth={4} strokeDasharray="2 10" strokeLinecap="round" fill="none" />
          </Svg>
          {AREAS.map((area) => {
            const p = byId.get(area.id);
            const unlocked = p?.unlocked ?? false;
            const theme = areaThemes[area.id];
            const { left, top } = pos(area.map.x, area.map.y);
            const name = l(area.name);
            const state = !unlocked
              ? t('common.locked')
              : p?.mastered
                ? t('map.mastered')
                : `${p?.completed ?? 0}/${p?.total ?? 0}`;
            return (
              <Pressable
                key={area.id}
                accessibilityRole="button"
                accessibilityLabel={`${name}. ${state}. ${t('area.knowledge', { percent: p?.knowledge ?? 0 })}`}
                onPress={() => {
                  feedback.tap();
                  onSelect(area.id);
                }}
                style={[styles.node, { left: left - 70, top: top - NODE / 2 }]}
              >
                <View style={[styles.circle, { backgroundColor: unlocked ? theme.accent : colors.locked }, p?.mastered && styles.mastered]}>
                  <Icon name={unlocked ? theme.icon : 'lock'} size={28} color={colors.textOnDark} />
                </View>
                <View style={styles.label}>
                  <AppText variant="tiny" align="center" numberOfLines={2} color={colors.text}>
                    {name}
                  </AppText>
                  {unlocked ? (
                    <AppText variant="tiny" align="center" color={p?.mastered ? colors.goldDeep : colors.textMuted}>
                      {p?.mastered ? `★ ${t('map.mastered')}` : `${p?.completed}/${p?.total}`}
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: MAP_HEIGHT, borderRadius: radius.xl, overflow: 'hidden' },
  node: { position: 'absolute', width: 140, alignItems: 'center', gap: spacing.xs },
  circle: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  mastered: { borderColor: colors.gold, borderWidth: 4 },
  label: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, maxWidth: 138 },
});
