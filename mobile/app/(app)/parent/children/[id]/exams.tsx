import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../../../../src/components/ErrorState';
import LoadingState from '../../../../../src/components/LoadingState';
import { useStudentMasteriesQuery } from '../../../../../src/graphql/generated/graphql';

interface ExamsScreenProps {
  id: string;
}

interface MasteryRecord {
  id: string;
  examMastered: boolean;
  dailyMastered: boolean;
  mastered: boolean;
  learningObjective: {
    id: string;
    description: string;
    topic: {
      id: string;
      name: string;
      subject: {
        id: string;
        name: string;
      };
    };
  };
}

function masteryStatus(record: MasteryRecord): 'mastered' | 'partial' | 'none' {
  if (record.mastered || (record.examMastered && record.dailyMastered))
    return 'mastered';
  if (record.examMastered || record.dailyMastered) return 'partial';
  return 'none';
}

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  mastered: { bg: '#E8F5E9', text: '#2E7D32', label: 'Mastered' },
  partial: { bg: '#FFF8E1', text: '#F57F17', label: 'In Progress' },
  none: { bg: '#F5F5F5', text: '#999', label: 'Not Started' },
};

export default function ExamsScreen({ id }: ExamsScreenProps) {
  const { data, loading, error, refetch } = useStudentMasteriesQuery({
    variables: { studentId: id },
    skip: !id,
  });

  const records = data?.studentMasteries ?? [];

  if (loading && records.length === 0) {
    return <LoadingState message="Loading exam mastery..." />;
  }

  if (error && records.length === 0) {
    return (
      <ErrorState
        message={error.message || 'Failed to load exam data'}
        onRetry={() => refetch()}
      />
    );
  }

  if (records.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="exams-empty">
        <Text style={styles.emptyText}>No exam mastery data available</Text>
      </View>
    );
  }

  const masteredCount = records.filter(
    (r) => masteryStatus(r as MasteryRecord) === 'mastered'
  ).length;
  const partialCount = records.filter(
    (r) => masteryStatus(r as MasteryRecord) === 'partial'
  ).length;
  const notStartedCount = records.length - masteredCount - partialCount;

  const renderItem = ({ item }: { item: MasteryRecord }) => {
    const status = masteryStatus(item);
    const style = STATUS_STYLES[status];

    return (
      <View style={styles.card} testID={`mastery-item-${item.id}`}>
        <View style={styles.cardHeader}>
          <View style={styles.objectiveInfo}>
            <Text style={styles.subjectText}>
              {item.learningObjective.topic.subject.name}
            </Text>
            <Text style={styles.topicText}>
              {item.learningObjective.topic.name}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
            <Text style={[styles.statusText, { color: style.text }]}>
              {style.label}
            </Text>
          </View>
        </View>
        <Text style={styles.descriptionText}>
          {item.learningObjective.description}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container} testID="exams-screen">
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#2E7D32' }]}>
            {masteredCount}
          </Text>
          <Text style={styles.summaryLabel}>Mastered</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#F57F17' }]}>
            {partialCount}
          </Text>
          <Text style={styles.summaryLabel}>In Progress</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#999' }]}>
            {notStartedCount}
          </Text>
          <Text style={styles.summaryLabel}>Not Started</Text>
        </View>
      </View>
      <FlatList
        data={records as MasteryRecord[]}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        testID="exams-list"
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
    marginBottom: 8,
  },
  objectiveInfo: {
    flex: 1,
    marginRight: 8,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  topicText: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
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
