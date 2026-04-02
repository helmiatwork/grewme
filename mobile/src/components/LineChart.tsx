import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

export interface LineChartDataset {
  label: string;
  data: (number | null)[];
  color: string;
}

export interface LineChartProps {
  labels: string[];
  datasets: LineChartDataset[];
  width?: number;
  height?: number;
  yMin?: number;
  yMax?: number;
}

const PADDING = { top: 20, right: 16, bottom: 40, left: 40 };

export default function LineChart({
  labels,
  datasets,
  width = 320,
  height = 220,
  yMin = 0,
  yMax = 100,
}: LineChartProps) {
  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  const xStep = labels.length > 1 ? chartWidth / (labels.length - 1) : 0;
  const yRange = yMax - yMin || 1;

  function toX(index: number): number {
    return PADDING.left + index * xStep;
  }

  function toY(value: number): number {
    return PADDING.top + chartHeight - ((value - yMin) / yRange) * chartHeight;
  }

  function buildPoints(data: (number | null)[]): string {
    return data
      .map((v, i) => (v != null ? `${toX(i)},${toY(v)}` : null))
      .filter(Boolean)
      .join(' ');
  }

  // Y-axis tick values
  const yTicks = [0, 25, 50, 75, 100].filter((t) => t >= yMin && t <= yMax);

  return (
    <View testID="line-chart">
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <Line
            key={`grid-${tick}`}
            x1={PADDING.left}
            y1={toY(tick)}
            x2={PADDING.left + chartWidth}
            y2={toY(tick)}
            stroke="#E0E0E0"
            strokeWidth={1}
          />
        ))}
        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <SvgText
            key={`y-label-${tick}`}
            x={PADDING.left - 6}
            y={toY(tick) + 4}
            fontSize={10}
            fill="#999"
            textAnchor="end"
          >
            {tick}
          </SvgText>
        ))}
        {/* X-axis labels */}
        {labels.map((label, i) => (
          <SvgText
            key={`x-label-${label}`}
            x={toX(i)}
            y={height - 8}
            fontSize={9}
            fill="#999"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}
        {/* Data lines */}
        {datasets.map((ds) => {
          const points = buildPoints(ds.data);
          if (!points) return null;
          return (
            <React.Fragment key={ds.label}>
              <Polyline
                points={points}
                fill="none"
                stroke={ds.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {ds.data.map((v, i) =>
                v != null ? (
                  <Circle
                    key={`${ds.label}-dot-${i}`}
                    cx={toX(i)}
                    cy={toY(v)}
                    r={3}
                    fill={ds.color}
                  />
                ) : null
              )}
            </React.Fragment>
          );
        })}
      </Svg>
      {/* Legend */}
      <View style={styles.legend} testID="line-chart-legend">
        {datasets.map((ds) => (
          <View key={ds.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: ds.color }]} />
            <Text style={styles.legendLabel}>{ds.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#666',
  },
});
