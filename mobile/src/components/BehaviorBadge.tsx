import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface BehaviorBadgeProps {
  name: string;
  pointValue: number;
  isPositive: boolean;
  color?: string;
  icon?: string;
}

const DEFAULT_POSITIVE_COLOR = '#E8F5E9';
const DEFAULT_NEGATIVE_COLOR = '#FFEBEE';
const POSITIVE_TEXT_COLOR = '#2E7D32';
const NEGATIVE_TEXT_COLOR = '#C62828';

export default function BehaviorBadge({
  name,
  pointValue,
  isPositive,
  color,
  icon,
}: BehaviorBadgeProps) {
  const backgroundColor =
    color ?? (isPositive ? DEFAULT_POSITIVE_COLOR : DEFAULT_NEGATIVE_COLOR);
  const textColor = isPositive ? POSITIVE_TEXT_COLOR : NEGATIVE_TEXT_COLOR;
  const pointLabel = isPositive ? `+${pointValue}` : `${pointValue}`;

  return (
    <View
      style={[styles.container, { backgroundColor }]}
      testID="behavior-badge"
    >
      {icon ? (
        <Text style={styles.icon} testID="behavior-badge-icon">
          {icon}
        </Text>
      ) : null}
      <Text
        style={[styles.name, { color: textColor }]}
        testID="behavior-badge-name"
      >
        {name}
      </Text>
      <Text
        style={[styles.points, { color: textColor }]}
        testID="behavior-badge-points"
      >
        {pointLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
  },
  points: {
    fontSize: 13,
    fontWeight: '700',
  },
});
