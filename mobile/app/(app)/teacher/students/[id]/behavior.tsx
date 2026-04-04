import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useStudentBehaviorHistoryQuery } from '../../../../../src/graphql/generated/graphql';
import BehaviorBadge from '../../../../../src/components/BehaviorBadge';
import LoadingState from '../../../../../src/components/LoadingState';
import ErrorState from '../../../../../src/components/ErrorState';

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StudentBehaviorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading, error, refetch } = useStudentBehaviorHistoryQuery({
    variables: { studentId: id! },
    skip: !id,
  });

  if (loading) return <LoadingState message="Loading behavior history..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const history = data?.studentBehaviorHistory ?? [];

  const netPoints = history.reduce((sum, item) => sum + item.pointValue, 0);
  const positiveCount = history.filter((item) => item.behaviorCategory.isPositive).length;
  const negativeCount = history.filter((item) => !item.behaviorCategory.isPositive).length;

  return (
    <View style={styles.container} testID="student-behavior-screen">
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text
            style={[
              styles.summaryValue,
              netPoints >= 0 ? styles.positiveValue : styles.negativeValue,
            ]}
            testID="net-points"
          >
            {netPoints >= 0 ? `+${netPoints}` : `${netPoints}`}
          </Text>
          <Text style={styles.summaryLabel}>Net Points</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, styles.positiveValue]}>
            {positiveCount}
          </Text>
          <Text style={styles.summaryLabel}>Positive</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, styles.negativeValue]}>
            {negativeCount}
          </Text>
          <Text style={styles.summaryLabel}>Negative</Text>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card} testID={`behavior-item-${item.id}`}>
            <View style={styles.cardHeader}>
              <BehaviorBadge
                name={item.behaviorCategory.name}
                pointValue={item.pointValue}
                isPositive={item.behaviorCategory.isPositive}
                icon={item.behaviorCategory.icon ?? undefined}
                color={item.behaviorCategory.color ?? undefined}
              />
              {item.revokable && (
                <TouchableOpacity
                  style={styles.revokeButton}
                  testID={`revoke-btn-${item.id}`}
                  onPress={() => {
                    // Revoke mutation not yet available in schema
                  }}
                >
                  <Text style={styles.revokeButtonText}>Revoke</Text>
                </TouchableOpacity>
              )}
            </View>
            {item.note ? (
              <Text style={styles.note}>{item.note}</Text>
            ) : null}
            <View style={styles.cardFooter}>
              <Text style={styles.date}>{formatDate(item.awardedAt)}</Text>
              <Text style={styles.teacher}>by {item.teacher.name}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No behavior history yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
  },
  positiveValue: {
    color: '#2E7D32',
  },
  negativeValue: {
    color: '#C62828',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  revokeButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  revokeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C62828',
  },
  note: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  teacher: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 15,
    marginTop: 32,
  },
});
