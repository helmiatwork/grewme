import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../../../../src/components/ErrorState';
import LoadingState from '../../../../../src/components/LoadingState';
import RadarChart from '../../../../../src/components/RadarChart';
import { useStudentRadarQuery } from '../../../../../src/graphql/generated/graphql';

interface RadarScreenProps {
  id: string;
}

export default function RadarScreen({ id }: RadarScreenProps) {
  const { data, loading, error, refetch } = useStudentRadarQuery({
    variables: { studentId: id },
    skip: !id,
  });

  if (loading) {
    return <LoadingState message="Loading radar..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || 'Failed to load radar data'}
        onRetry={() => refetch()}
      />
    );
  }

  const radar = data?.studentRadar;

  if (!radar) {
    return (
      <View style={styles.emptyContainer} testID="radar-empty">
        <Text style={styles.emptyText}>No radar data available</Text>
      </View>
    );
  }

  const skills = {
    reading: radar.skills.reading ?? 0,
    math: radar.skills.math ?? 0,
    writing: radar.skills.writing ?? 0,
    logic: radar.skills.logic ?? 0,
    social: radar.skills.social ?? 0,
  };

  return (
    <ScrollView contentContainerStyle={styles.container} testID="radar-screen">
      <Text style={styles.studentName}>{radar.studentName}</Text>
      <Text style={styles.subtitle}>Skill Overview</Text>
      <View style={styles.chartContainer}>
        <RadarChart skills={skills} size={280} />
      </View>
      <View style={styles.skillsList}>
        {Object.entries(skills).map(([key, value]) => (
          <View key={key} style={styles.skillRow}>
            <Text style={styles.skillLabel}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
            <Text style={styles.skillValue}>{Math.round(value)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
  },
  studentName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  chartContainer: {
    marginBottom: 24,
  },
  skillsList: {
    width: '100%',
    paddingHorizontal: 16,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
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
