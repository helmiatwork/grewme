import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../../../../src/components/ErrorState';
import LoadingState from '../../../../../src/components/LoadingState';
import { useTopicQuery } from '../../../../../src/graphql/generated/graphql';

export default function TeacherTopicDetailScreen() {
  const { topicId } = useLocalSearchParams<{
    subjectId: string;
    topicId: string;
  }>();

  const { data, loading, error, refetch } = useTopicQuery({
    variables: { id: topicId ?? '' },
    skip: !topicId,
  });

  if (loading) {
    return <LoadingState message="Loading topic..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || 'Failed to load topic'}
        onRetry={() => refetch()}
      />
    );
  }

  const topic = data?.topic;

  if (!topic) {
    return (
      <View style={styles.emptyContainer} testID="topic-not-found">
        <Text style={styles.emptyText}>Topic not found</Text>
      </View>
    );
  }

  const objectives = topic.learningObjectives ?? [];
  const exams = topic.exams ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      testID="topic-detail-screen"
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.breadcrumb}>
          {topic.subject?.name ?? 'Subject'}
        </Text>
        <Text style={styles.header}>{topic.name}</Text>
        {topic.description ? (
          <Text style={styles.description}>{topic.description}</Text>
        ) : null}
      </View>

      {/* Learning Objectives */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Objectives</Text>
        {objectives.length === 0 ? (
          <Text style={styles.emptySection} testID="objectives-empty">
            No learning objectives defined yet.
          </Text>
        ) : (
          objectives.map((lo) => (
            <View
              key={lo.id}
              style={styles.objectiveCard}
              testID={`lo-card-${lo.id}`}
            >
              <Text style={styles.objectiveDescription}>
                {lo.description ?? lo.name}
              </Text>
              <Text style={styles.objectiveMeta}>
                Mastery threshold: {lo.examPassThreshold}%
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Exams */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exams</Text>
        {exams.length === 0 ? (
          <Text style={styles.emptySection} testID="exams-empty">
            No exams for this topic yet.
          </Text>
        ) : (
          exams.map((exam) => (
            <View
              key={exam.id}
              style={styles.examCard}
              testID={`exam-card-${exam.id}`}
            >
              <View style={styles.examHeader}>
                <Text style={styles.examTitle}>{exam.title}</Text>
                <View style={styles.examBadge}>
                  <Text style={styles.examBadgeText}>
                    {exam.examType.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              {exam.description ? (
                <Text style={styles.examDescription}>{exam.description}</Text>
              ) : null}
              {exam.maxScore ? (
                <Text style={styles.examScore}>{exam.maxScore} pts</Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  breadcrumb: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  emptySection: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  objectiveCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  objectiveDescription: {
    fontSize: 14,
    color: '#333',
  },
  objectiveMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  examCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  examBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  examBadgeText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  examDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  examScore: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
