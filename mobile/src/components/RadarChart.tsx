import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text } from 'react-native-svg';

export interface RadarChartProps {
  skills: {
    reading: number;
    math: number;
    writing: number;
    logic: number;
    social: number;
  };
  size?: number;
}

const SKILL_LABELS: Array<{
  key: keyof RadarChartProps['skills'];
  label: string;
}> = [
  { key: 'reading', label: 'Reading' },
  { key: 'math', label: 'Math' },
  { key: 'writing', label: 'Writing' },
  { key: 'logic', label: 'Logic' },
  { key: 'social', label: 'Social' },
];

const GRID_LEVELS = [0.33, 0.66, 1.0];
const ANGLE_OFFSET = -Math.PI / 2; // Start from top

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleIndex: number,
  total: number
): { x: number; y: number } {
  const angle = ANGLE_OFFSET + (2 * Math.PI * angleIndex) / total;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

function buildPolygonPoints(
  centerX: number,
  centerY: number,
  radius: number,
  values: number[]
): string {
  return values
    .map((value, i) => {
      const clampedValue = Math.max(0, Math.min(100, value ?? 0));
      const r = (clampedValue / 100) * radius;
      const point = polarToCartesian(centerX, centerY, r, i, values.length);
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

function buildGridPoints(
  centerX: number,
  centerY: number,
  radius: number,
  count: number
): string {
  return Array.from({ length: count })
    .map((_, i) => {
      const point = polarToCartesian(centerX, centerY, radius, i, count);
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

export default function RadarChart({ skills, size = 200 }: RadarChartProps) {
  const center = size / 2;
  const radius = size * 0.35;
  const labelOffset = radius + 24;

  const values = SKILL_LABELS.map(({ key }) => skills[key] ?? 0);

  return (
    <View
      style={{ alignItems: 'center', justifyContent: 'center' }}
      testID="radar-chart"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid levels */}
        {GRID_LEVELS.map((level) => (
          <Polygon
            key={`grid-${level}`}
            points={buildGridPoints(center, center, radius * level, 5)}
            fill="none"
            stroke="#E0E0E0"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {SKILL_LABELS.map((_, i) => {
          const point = polarToCartesian(center, center, radius, i, 5);
          return (
            <Line
              key={`axis-${SKILL_LABELS[i].key}`}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="#E0E0E0"
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={buildPolygonPoints(center, center, radius, values)}
          fill="rgba(76, 175, 80, 0.3)"
          stroke="#4CAF50"
          strokeWidth={2}
          testID="radar-data-polygon"
        />

        {/* Center dot */}
        <Circle cx={center} cy={center} r={2} fill="#999" />

        {/* Labels */}
        <G>
          {SKILL_LABELS.map(({ label }, i) => {
            const point = polarToCartesian(center, center, labelOffset, i, 5);
            return (
              <Text
                key={`label-${label}`}
                x={point.x}
                y={point.y}
                fontSize={11}
                fill="#333"
                textAnchor="middle"
                alignmentBaseline="central"
              >
                {label}
              </Text>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
