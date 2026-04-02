import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../../../../src/components/ErrorState';
import LoadingState from '../../../../../src/components/LoadingState';
import { useStudentHealthCheckupsQuery } from '../../../../../src/graphql/generated/graphql';

interface HealthScreenProps {
  id: string;
}

const BMI_COLORS: Record<string, { bg: string; text: string }> = {
  severely_underweight: { bg: '#FFEBEE', text: '#C62828' },
  underweight: { bg: '#FFF3E0', text: '#E65100' },
  normal: { bg: '#E8F5E9', text: '#2E7D32' },
  overweight: { bg: '#FFF3E0', text: '#E65100' },
  obese: { bg: '#FFEBEE', text: '#C62828' },
};

function formatBmiCategory(category: string): string {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface HealthRecord {
  id: string;
  measuredAt: string;
  weightKg?: number | null;
  heightCm?: number | null;
  headCircumferenceCm?: number | null;
  bmi?: number | null;
  bmiCategory?: string | null;
  notes?: string | null;
}

export default function HealthScreen({ id }: HealthScreenProps) {
  const { data, loading, error, refetch } = useStudentHealthCheckupsQuery({
    variables: { studentId: id },
    skip: !id,
  });

  const records = data?.studentHealthCheckups ?? [];

  if (loading && records.length === 0) {
    return <LoadingState message="Loading health records..." />;
  }

  if (error && records.length === 0) {
    return (
      <ErrorState
        message={error.message || 'Failed to load health records'}
        onRetry={() => refetch()}
      />
    );
  }

  if (records.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="health-empty">
        <Text style={styles.emptyText}>
          No health checkup records available
        </Text>
      </View>
    );
  }

  const latest = records[0] as HealthRecord;

  const renderItem = ({ item }: { item: HealthRecord }) => {
    const bmiColors = item.bmiCategory
      ? (BMI_COLORS[item.bmiCategory] ?? { bg: '#F5F5F5', text: '#666' })
      : null;

    return (
      <View style={styles.card} testID={`health-item-${item.id}`}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{formatDate(item.measuredAt)}</Text>
          {item.bmiCategory && bmiColors ? (
            <View style={[styles.bmiBadge, { backgroundColor: bmiColors.bg }]}>
              <Text style={[styles.bmiText, { color: bmiColors.text }]}>
                {formatBmiCategory(item.bmiCategory)}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.metricsRow}>
          {item.heightCm != null ? (
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{item.heightCm}</Text>
              <Text style={styles.metricLabel}>cm</Text>
            </View>
          ) : null}
          {item.weightKg != null ? (
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{item.weightKg}</Text>
              <Text style={styles.metricLabel}>kg</Text>
            </View>
          ) : null}
          {item.bmi != null ? (
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{item.bmi.toFixed(1)}</Text>
              <Text style={styles.metricLabel}>BMI</Text>
            </View>
          ) : null}
          {item.headCircumferenceCm != null ? (
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{item.headCircumferenceCm}</Text>
              <Text style={styles.metricLabel}>head cm</Text>
            </View>
          ) : null}
        </View>
        {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container} testID="health-screen">
      {latest ? (
        <View style={styles.latestCard}>
          <Text style={styles.latestTitle}>Latest Checkup</Text>
          <View style={styles.latestMetrics}>
            {latest.heightCm != null ? (
              <View style={styles.latestMetric}>
                <Text style={styles.latestValue}>{latest.heightCm}</Text>
                <Text style={styles.latestLabel}>Height (cm)</Text>
              </View>
            ) : null}
            {latest.weightKg != null ? (
              <View style={styles.latestMetric}>
                <Text style={styles.latestValue}>{latest.weightKg}</Text>
                <Text style={styles.latestLabel}>Weight (kg)</Text>
              </View>
            ) : null}
            {latest.bmi != null ? (
              <View style={styles.latestMetric}>
                <Text style={styles.latestValue}>{latest.bmi.toFixed(1)}</Text>
                <Text style={styles.latestLabel}>BMI</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
      <FlatList
        data={records as HealthRecord[]}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        testID="health-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  latestCard: {
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  latestTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  latestMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  latestMetric: {
    alignItems: 'center',
  },
  latestValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  latestLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  bmiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bmiText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  metricLabel: {
    fontSize: 11,
    color: '#999',
  },
  notesText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
