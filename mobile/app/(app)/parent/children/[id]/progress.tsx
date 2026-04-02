import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../../../../src/components/ErrorState';
import LineChart from '../../../../../src/components/LineChart';
import type { LineChartDataset } from '../../../../../src/components/LineChart';
import LoadingState from '../../../../../src/components/LoadingState';
import { useStudentProgressQuery } from '../../../../../src/graphql/generated/graphql';

interface ProgressScreenProps {
  id: string;
}

const SKILL_COLORS: Record<string, string> = {
  Reading: '#4CAF50',
  Math: '#2196F3',
  Writing: '#FF9800',
  Logic: '#9C27B0',
  Social: '#F44336',
};

const SKILL_KEYS = ['reading', 'math', 'writing', 'logic', 'social'] as const;

export default function ProgressScreen({ id }: ProgressScreenProps) {
  const { data, loading, error, refetch } = useStudentProgressQuery({
    variables: { studentId: id },
    skip: !id,
  });

  if (loading) {
    return <LoadingState message="Loading progress..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || 'Failed to load progress data'}
        onRetry={() => refetch()}
      />
    );
  }

  const weeks = data?.studentProgress?.weeks;

  if (!weeks || weeks.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="progress-empty">
        <Text style={styles.emptyText}>No progress data available</Text>
      </View>
    );
  }

  const labels = weeks.map((w) => w.period.replace('Week of ', ''));

  const datasets: LineChartDataset[] = SKILL_KEYS.map((key) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    data: weeks.map((w) => w.skills[key] ?? null),
    color: SKILL_COLORS[key.charAt(0).toUpperCase() + key.slice(1)],
  }));

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.min(screenWidth - 32, 400);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      testID="progress-screen"
    >
      <Text style={styles.title}>Weekly Progress</Text>
      <Text style={styles.subtitle}>Last {weeks.length} weeks</Text>
      <View style={styles.chartContainer}>
        <LineChart
          labels={labels}
          datasets={datasets}
          width={chartWidth}
          height={240}
          yMin={0}
          yMax={100}
        />
      </View>
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Latest Week</Text>
        {SKILL_KEYS.map((key) => {
          const latestWeek = weeks[weeks.length - 1];
          const value = latestWeek.skills[key];
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          return (
            <View key={key} style={styles.skillRow}>
              <View style={styles.skillLabelRow}>
                <View
                  style={[
                    styles.skillDot,
                    { backgroundColor: SKILL_COLORS[label] },
                  ]}
                />
                <Text style={styles.skillLabel}>{label}</Text>
              </View>
              <Text style={styles.skillValue}>
                {value != null ? Math.round(value) : '-'}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  chartContainer: {
    marginBottom: 24,
  },
  summarySection: {
    width: '100%',
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  skillLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  skillLabel: {
    fontSize: 15,
    color: '#333',
  },
  skillValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
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
