import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import LoadingState from '../../../../../../src/components/LoadingState';
import ErrorState from '../../../../../../src/components/ErrorState';
import {
  useExamSubmissionDetailQuery,
  useGradeExamSubmissionMutation,
} from '../../../../../../src/graphql/generated/graphql';

interface RubricScoreLocal {
  criteriaId: string;
  criteriaName: string;
  maxScore: number;
  score: string;
  feedback: string;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusColor(status: string): string {
  switch (status) {
    case 'SUBMITTED':
      return '#2196F3';
    case 'GRADED':
      return '#4CAF50';
    case 'IN_PROGRESS':
      return '#FF9800';
    case 'NOT_STARTED':
      return '#9E9E9E';
    default:
      return '#666';
  }
}

export default function GradeSubmissionScreen() {
  const { examId, submissionId } = useLocalSearchParams<{
    examId: string;
    submissionId: string;
  }>();

  const { data, loading, error, refetch } = useExamSubmissionDetailQuery({
    variables: { id: submissionId ?? '' },
    skip: !submissionId,
  });

  const [gradeSubmission, { loading: grading }] =
    useGradeExamSubmissionMutation();

  const [score, setScore] = useState('');
  const [passed, setPassed] = useState<boolean | null>(null);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [rubricScores, setRubricScores] = useState<RubricScoreLocal[]>([]);

  const submission = data?.examSubmission;
  const exam = submission?.classroomExam?.exam;
  const examType = exam?.examType ?? '';

  // Pre-populate from existing grading data
  useEffect(() => {
    if (!submission) return;

    if (submission.score != null) {
      setScore(String(submission.score));
    }
    if (submission.passed != null) {
      setPassed(submission.passed);
    }
    if (submission.teacherNotes) {
      setTeacherNotes(submission.teacherNotes);
    }

    // Pre-populate rubric scores
    if (exam?.rubricCriteria && exam.rubricCriteria.length > 0) {
      const existingScores = submission.rubricScores ?? [];
      setRubricScores(
        [...exam.rubricCriteria]
          .sort((a, b) => a.position - b.position)
          .map((c) => {
            const existing = existingScores.find(
              (rs) => rs.rubricCriteria.id === c.id,
            );
            return {
              criteriaId: c.id,
              criteriaName: c.name,
              maxScore: c.maxScore,
              score: existing ? String(existing.score) : '',
              feedback: existing?.feedback ?? '',
            };
          }),
      );
    }
  }, [submission, exam]);

  if (loading) return <LoadingState message="Loading submission..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (!submission || !exam) {
    return (
      <View style={styles.emptyContainer} testID="submission-not-found">
        <Text style={styles.emptyText}>Submission not found</Text>
      </View>
    );
  }

  const answers = submission.examAnswers ?? [];

  const mcTotalScore = answers.reduce(
    (sum, a) => sum + (a.pointsAwarded ?? 0),
    0,
  );

  const rubricTotalScore = rubricScores.reduce(
    (sum, rs) => sum + (parseInt(rs.score, 10) || 0),
    0,
  );

  const handleGrade = async () => {
    try {
      const input: {
        examSubmissionId: string;
        score?: number;
        passed?: boolean;
        teacherNotes?: string;
        rubricScores?: Array<{
          rubricCriteriaId: string;
          score: number;
          feedback?: string;
        }>;
      } = {
        examSubmissionId: submissionId!,
        teacherNotes: teacherNotes.trim() || undefined,
      };

      if (examType === 'SCORE_BASED') {
        input.score = parseFloat(score) || 0;
      } else if (examType === 'MULTIPLE_CHOICE') {
        input.score = mcTotalScore;
      } else if (examType === 'PASS_FAIL') {
        input.passed = passed ?? false;
      } else if (examType === 'RUBRIC') {
        input.score = rubricTotalScore;
        input.rubricScores = rubricScores.map((rs) => ({
          rubricCriteriaId: rs.criteriaId,
          score: parseInt(rs.score, 10) || 0,
          feedback: rs.feedback.trim() || undefined,
        }));
      }

      const result = await gradeSubmission({ variables: { input } });
      const errors = result.data?.gradeExamSubmission?.errors ?? [];

      if (errors.length > 0) {
        Alert.alert('Error', errors[0].message);
      } else {
        Alert.alert('Success', 'Submission graded', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to grade submission',
      );
    }
  };

  const updateRubricScore = (index: number, value: string) => {
    setRubricScores((prev) =>
      prev.map((rs, i) => (i === index ? { ...rs, score: value } : rs)),
    );
  };

  const updateRubricFeedback = (index: number, value: string) => {
    setRubricScores((prev) =>
      prev.map((rs, i) => (i === index ? { ...rs, feedback: value } : rs)),
    );
  };

  return (
    <View style={styles.wrapper} testID="grade-submission-screen">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Student Header */}
        <View style={styles.headerSection}>
          <Text style={styles.studentName}>{submission.student.name}</Text>
          <View style={styles.headerMeta}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor(submission.status) },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {submission.status.replace('_', ' ')}
              </Text>
            </View>
            {submission.submittedAt ? (
              <Text style={styles.dateText}>
                Submitted: {formatDate(submission.submittedAt)}
              </Text>
            ) : null}
          </View>
          <Text style={styles.examInfo}>
            {exam.title} &middot;{' '}
            {exam.examType.replace('_', ' ')}
            {exam.maxScore ? ` &middot; ${exam.maxScore} pts` : ''}
          </Text>
        </View>

        {/* MULTIPLE_CHOICE — Show answers */}
        {examType === 'MULTIPLE_CHOICE' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Answers</Text>
            {answers.map((a) => (
              <View
                key={a.id}
                style={styles.answerCard}
                testID={`answer-${a.id}`}
              >
                <Text style={styles.questionText}>
                  {a.examQuestion.questionText}
                </Text>
                <View style={styles.answerRow}>
                  <Ionicons
                    name={
                      a.correct
                        ? 'checkmark-circle'
                        : 'close-circle'
                    }
                    size={18}
                    color={a.correct ? '#4CAF50' : '#F44336'}
                  />
                  <Text style={styles.answerText}>
                    {a.selectedAnswer ?? 'No answer'}
                  </Text>
                </View>
                {!a.correct && a.examQuestion.correctAnswer ? (
                  <Text style={styles.correctAnswer}>
                    Correct: {a.examQuestion.correctAnswer}
                  </Text>
                ) : null}
                <Text style={styles.pointsText}>
                  {a.pointsAwarded}/{a.examQuestion.points} pts
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Score</Text>
              <Text style={styles.totalValue}>
                {mcTotalScore}/{exam.maxScore ?? '?'}
              </Text>
            </View>
          </View>
        )}

        {/* SCORE_BASED — Score input */}
        {examType === 'SCORE_BASED' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Score</Text>
            <View style={styles.scoreInputRow}>
              <TextInput
                style={[styles.input, styles.scoreInput]}
                value={score}
                onChangeText={setScore}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                testID="input-score"
              />
              <Text style={styles.scoreMax}>
                / {exam.maxScore ?? '?'}
              </Text>
            </View>
          </View>
        )}

        {/* RUBRIC — Criteria scores */}
        {examType === 'RUBRIC' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rubric Scoring</Text>
            {rubricScores.map((rs, i) => (
              <View
                key={rs.criteriaId}
                style={styles.rubricCard}
                testID={`rubric-${rs.criteriaId}`}
              >
                <View style={styles.rubricHeader}>
                  <Text style={styles.rubricName}>{rs.criteriaName}</Text>
                  <Text style={styles.rubricMax}>/ {rs.maxScore}</Text>
                </View>
                <TextInput
                  style={[styles.input, { width: 80 }]}
                  value={rs.score}
                  onChangeText={(v) => updateRubricScore(i, v)}
                  placeholder="0"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  testID={`rubric-score-${i}`}
                />
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  value={rs.feedback}
                  onChangeText={(v) => updateRubricFeedback(i, v)}
                  placeholder="Feedback (optional)"
                  placeholderTextColor="#999"
                  testID={`rubric-feedback-${i}`}
                />
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{rubricTotalScore}</Text>
            </View>
          </View>
        )}

        {/* PASS_FAIL — Toggle */}
        {examType === 'PASS_FAIL' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Result</Text>
            <View style={styles.passFailRow}>
              <Pressable
                style={[
                  styles.passFailChip,
                  passed === true && styles.passChipActive,
                ]}
                onPress={() => setPassed(true)}
                testID="pass-button"
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={passed === true ? '#FFFFFF' : '#4CAF50'}
                />
                <Text
                  style={[
                    styles.passFailText,
                    passed === true && styles.passFailTextActive,
                  ]}
                >
                  Pass
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.passFailChip,
                  passed === false && styles.failChipActive,
                ]}
                onPress={() => setPassed(false)}
                testID="fail-button"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={passed === false ? '#FFFFFF' : '#F44336'}
                />
                <Text
                  style={[
                    styles.passFailText,
                    passed === false && styles.passFailTextActive,
                  ]}
                >
                  Fail
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Teacher Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teacher Notes</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={teacherNotes}
            onChangeText={setTeacherNotes}
            placeholder="Add notes about this submission..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            testID="input-teacher-notes"
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[
            styles.gradeButton,
            grading && styles.gradeButtonDisabled,
          ]}
          onPress={handleGrade}
          disabled={grading}
          testID="submit-grade"
        >
          {grading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.gradeButtonText}>
              {submission.status === 'GRADED'
                ? 'Update Grade'
                : 'Submit Grade'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  studentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
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
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  examInfo: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
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
  answerCard: {
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
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  answerText: {
    fontSize: 14,
    color: '#333',
  },
  correctAnswer: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  pointsText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  scoreInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreInput: {
    width: 100,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 20,
    color: '#888',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rubricCard: {
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
  rubricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rubricName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  rubricMax: {
    fontSize: 13,
    color: '#888',
  },
  passFailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  passFailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  passChipActive: {
    backgroundColor: '#4CAF50',
  },
  failChipActive: {
    backgroundColor: '#F44336',
  },
  passFailText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  passFailTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  gradeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  gradeButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  gradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
