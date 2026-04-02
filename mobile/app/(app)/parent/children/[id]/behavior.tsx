import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../../../../src/components/ErrorState';
import LoadingState from '../../../../../src/components/LoadingState';
import { useStudentBehaviorHistoryQuery } from '../../../../../src/graphql/generated/graphql';

interface BehaviorScreenProps {
  id: string;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface BehaviorRecord {
  id: string;
  pointValue: number;
  note?: string | null;
  awardedAt: string;
  revokable: boolean;
  teacher: { id: string; name: string };
  behaviorCategory: {
    name: string;
    isPositive: boolean;
    icon: string;
    color: string;
  };
}

export default function BehaviorScreen({ id }: BehaviorScreenProps) {
  const { data, loading, error, refetch } = useStudentBehaviorHistoryQuery({
    variables: { studentId: id },
    skip: !id,
  });

  const records = data?.studentBehaviorHistory ?? [];

  if (loading && records.length === 0) {
    return <LoadingState message="Loading behavior..." />;
  }

  if (error && records.length === 0) {
    return (
      <ErrorState
        message={error.message || 'Failed to load behavior history'}
        onRetry={() => refetch()}
      />
    );
  }

  if (records.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="behavior-empty">
        <Text style={styles.emptyText}>No behavior records available</Text>
      </View>
    );
  }

  const totalPoints = records.reduce((sum, r) => sum + r.pointValue, 0);
  const positiveCount = records.filter((r) => r.pointValue > 0).length;
  const negativeCount = records.filter((r) => r.pointValue < 0).length;

  const renderItem = ({ item }: { item: BehaviorRecord }) => {
    const isPositive = item.behaviorCategory.isPositive;

    return (
      <View style={styles.card} testID={`behavior-item-${item.id}`}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryIcon}>
              {item.behaviorCategory.icon}
            </Text>
            <Text style={styles.categoryName}>
              {item.behaviorCategory.name}
            </Text>
          </View>
          <Text
            style={[
              styles.pointValue,
              { color: isPositive ? '#2E7D32' : '#C62828' },
            ]}
          >
            {isPositive ? '+' : ''}
            {item.pointValue}
          </Text>
        </View>
        <Text style={styles.teacherText}>By {item.teacher.name}</Text>
        <Text style={styles.dateText}>{formatDateTime(item.awardedAt)}</Text>
        {item.note ? <Text style={styles.notesText}>{item.note}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container} testID="behavior-screen">
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text
            style={[
              styles.summaryValue,
              { color: totalPoints >= 0 ? '#2E7D32' : '#C62828' },
            ]}
          >
            {totalPoints}
          </Text>
          <Text style={styles.summaryLabel}>Total Points</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#2E7D32' }]}>
            {positiveCount}
          </Text>
          <Text style={styles.summaryLabel}>Positive</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#C62828' }]}>
            {negativeCount}
          </Text>
          <Text style={styles.summaryLabel}>Negative</Text>
        </View>
      </View>
      <FlatList
        data={records as BehaviorRecord[]}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        testID="behavior-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    textTransform: 'uppercase',
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
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  pointValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  teacherText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
