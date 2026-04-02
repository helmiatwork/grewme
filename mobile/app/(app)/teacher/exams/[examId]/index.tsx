import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import LoadingState from '../../../../../src/components/LoadingState';
import ErrorState from '../../../../../src/components/ErrorState';
import { useExamDetailQuery } from '../../../../../src/graphql/generated/graphql';
import {
  formatExamDate,
  examStatusColor,
  formatExamType,
} from '../../../../../src/utils/examHelpers';

export default function ExamDetailScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();

  const { data, loading, error, refetch } = useExamDetailQuery({
    variables: { id: examId ?? '' },
    skip: !examId,
  });

  if (loading) return <LoadingState message="Loading exam..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const exam = data?.exam;

  if (!exam) {
    return (
      <View style={styles.emptyContainer} testID="exam-not-found">
        <Text style={styles.emptyText}>Exam not found</Text>
      </View>
    );
  }

  const questions = [...(exam.examQuestions ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const criteria = [...(exam.rubricCriteria ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const classroomExams = exam.classroomExams ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      testID="exam-detail-screen"
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.breadcrumb}>
          {exam.topic.subject?.name ?? 'Subject'} &gt; {exam.topic.name}
        </Text>
        <Text style={styles.header}>{exam.title}</Text>
        {exam.description ? (
          <Text style={styles.description}>{exam.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>
              {formatExamType(exam.examType)}
            </Text>
          </View>
          {exam.maxScore ? (
            <Text style={styles.metaText}>{exam.maxScore} pts</Text>
          ) : null}
          {exam.durationMinutes ? (
            <Text style={styles.metaText}>{exam.durationMinutes} min</Text>
          ) : null}
        </View>
      </View>

      {/* Questions (MULTIPLE_CHOICE) */}
      {questions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions</Text>
          {questions.map((q) => (
            <View key={q.id} style={styles.card} testID={`question-${q.id}`}>
              <Text style={styles.cardTitle}>
                Q{q.position}. {q.questionText}
              </Text>
              <Text style={styles.cardMeta}>{q.points} pts</Text>
            </View>
          ))}
        </View>
      )}

      {/* Rubric Criteria */}
      {criteria.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rubric Criteria</Text>
          {criteria.map((c) => (
            <View key={c.id} style={styles.card} testID={`criteria-${c.id}`}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{c.name}</Text>
                <Text style={styles.cardMeta}>Max: {c.maxScore}</Text>
              </View>
              {c.description ? (
                <Text style={styles.cardDescription}>{c.description}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {/* Classroom Assignments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Classroom Assignments</Text>
        {classroomExams.length === 0 ? (
          <Text style={styles.emptySection} testID="assignments-empty">
            Not assigned to any classroom yet.
          </Text>
        ) : (
          classroomExams.map((ce) => {
            const submissions = ce.examSubmissions ?? [];
            const submittedCount = submissions.filter(
              (s) => s.status === 'SUBMITTED' || s.status === 'GRADED',
            ).length;
            const gradedCount = submissions.filter(
              (s) => s.status === 'GRADED',
            ).length;

            return (
              <View
                key={ce.id}
                style={styles.assignmentCard}
                testID={`assignment-${ce.id}`}
              >
                <View style={styles.assignmentHeader}>
                  <Text style={styles.classroomName}>
                    {ce.classroom.name}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: examStatusColor(ce.status) },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{ce.status}</Text>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  {ce.scheduledAt ? (
                    <Text style={styles.dateText}>
                      Scheduled: {formatExamDate(ce.scheduledAt)}
                    </Text>
                  ) : null}
                  {ce.dueAt ? (
                    <Text style={styles.dateText}>
                      Due: {formatExamDate(ce.dueAt)}
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.summaryText}>
                  {submittedCount}/{submissions.length} submitted{' '}
                  &middot; {gradedCount}/{submissions.length} graded
                </Text>

                {/* Submissions */}
                {submissions.length > 0 && (
                  <View style={styles.submissionsList}>
                    {submissions.map((sub) => (
                      <Pressable
                        key={sub.id}
                        style={styles.submissionRow}
                        onPress={() =>
                          router.push(
                            `/(app)/teacher/exams/${examId}/grade/${sub.id}`,
                          )
                        }
                        testID={`submission-${sub.id}`}
                      >
                        <View style={styles.submissionInfo}>
                          <Text style={styles.studentName}>
                            {sub.student.name}
                          </Text>
                          <View
                            style={[
                              styles.submissionBadge,
                              {
                                backgroundColor: examStatusColor(sub.status),
                              },
                            ]}
                          >
                            <Text style={styles.submissionBadgeText}>
                              {formatExamType(sub.status)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.submissionMeta}>
                          {sub.score != null ? (
                            <Text style={styles.scoreText}>
                              {sub.score}/{exam.maxScore ?? '?'}
                            </Text>
                          ) : null}
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#CCC"
                          />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  metaChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    textTransform: 'capitalize',
  },
  metaText: {
    fontSize: 13,
    color: '#888',
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
  card: {
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
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  classroomName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  submissionsList: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  submissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  submissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  submissionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  submissionBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  submissionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
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
