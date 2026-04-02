import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useStudentBehaviorHistoryQuery } from '../../../../src/graphql/generated/graphql';
import BehaviorBadge from '../../../../src/components/BehaviorBadge';
import LoadingState from '../../../../src/components/LoadingState';
import ErrorState from '../../../../src/components/ErrorState';

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BehaviorHistoryScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();

  const { data, loading, error, refetch } = useStudentBehaviorHistoryQuery({
    variables: { studentId: studentId! },
    skip: !studentId,
  });

  if (!studentId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No student selected</Text>
      </View>
    );
  }

  if (loading) return <LoadingState message="Loading history..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const history = data?.studentBehaviorHistory ?? [];

  return (
    <View style={styles.container} testID="behavior-history-screen">
      <Text style={styles.title}>Behavior History</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card} testID={`history-item-${item.id}`}>
            <View style={styles.cardHeader}>
              <BehaviorBadge
                name={item.behaviorCategory.name}
                pointValue={item.pointValue}
                isPositive={item.behaviorCategory.isPositive}
                icon={item.behaviorCategory.icon}
                color={item.behaviorCategory.color}
              />
              {item.revokable && (
                <Text style={styles.revokableTag} testID="revokable-tag">
                  Revokable
                </Text>
              )}
            </View>
            {item.note ? (
              <Text style={styles.note} testID="history-note">
                {item.note}
              </Text>
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
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  listContent: {
    paddingBottom: 16,
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
  revokableTag: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '600',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
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
  errorText: {
    textAlign: 'center',
    color: '#C62828',
    fontSize: 16,
    marginTop: 32,
  },
});
