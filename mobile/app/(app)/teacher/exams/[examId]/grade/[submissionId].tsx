import React, { useEffect, useRef, useState } from 'react';
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
import {
  formatExamDate,
  examStatusColor,
  formatExamType,
} from '../../../../../../src/utils/examHelpers';

interface RubricScoreLocal {
  criteriaId: string;
  criteriaName: string;
  maxScore: number;
  score: string;
  feedback: string;
}

function parseNumeric(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export default function GradeSubmissionScreen() {
  const { submissionId } = useLocalSearchParams<{
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
  const hasInitialized = useRef(false);

  const submission = data?.examSubmission;
  const exam = submission?.classroomExam?.exam;
  const examType = exam?.examType ?? '';

  useEffect(() => {
    if (!submission || hasInitialized.current) return;
    hasInitialized.current = true;

    if (submission.score != null) setScore(String(submission.score));
    if (submission.passed != null) setPassed(submission.passed);
    if (submission.teacherNotes) setTeacherNotes(submission.teacherNotes);

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
      <View style={s.centered} testID="submission-not-found">
        <Text style={s.emptyText}>Submission not found</Text>
      </View>
    );
  }

  const answers = submission.examAnswers ?? [];
  const mcTotal = answers.reduce((sum, a) => sum + (a.pointsAwarded ?? 0), 0);
  const rubricTotal = rubricScores.reduce(
    (sum, rs) => sum + (parseInt(rs.score, 10) || 0),
    0,
  );

  const handleGrade = async () => {
    if (examType === 'SCORE_BASED' && !score.trim()) {
      Alert.alert('Validation', 'Please enter a score');
      return;
    }
    if (examType === 'PASS_FAIL' && passed === null) {
      Alert.alert('Validation', 'Please select Pass or Fail');
      return;
    }

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
        input.score = parseNumeric(score);
      } else if (examType === 'MULTIPLE_CHOICE') {
        input.score = mcTotal;
      } else if (examType === 'PASS_FAIL') {
        input.passed = passed ?? false;
      } else if (examType === 'RUBRIC') {
        input.score = rubricTotal;
        input.rubricScores = rubricScores.map((rs) => ({
          rubricCriteriaId: rs.criteriaId,
          score: parseInt(rs.score, 10) || 0,
          feedback: rs.feedback.trim() || undefined,
        }));
      }

      const result = await gradeSubmission({
        variables: { input },
        refetchQueries: ['ExamDetail'],
      });
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

  return (
    <View style={s.wrapper} testID="grade-submission-screen">
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Student Header */}
        <View style={s.header}>
          <Text style={s.studentName}>{submission.student.name}</Text>
          <View style={s.headerMeta}>
            <View style={[s.badge, { backgroundColor: examStatusColor(submission.status) }]}>
              <Text style={s.badgeText}>{formatExamType(submission.status)}</Text>
            </View>
            {submission.submittedAt ? (
              <Text style={s.metaText}>
                Submitted: {formatExamDate(submission.submittedAt, true)}
              </Text>
            ) : null}
          </View>
          <Text style={s.examInfo}>
            {exam.title} &middot; {formatExamType(exam.examType)}
            {exam.maxScore ? ` &middot; ${exam.maxScore} pts` : ''}
          </Text>
        </View>

        {/* MULTIPLE_CHOICE */}
        {examType === 'MULTIPLE_CHOICE' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Answers</Text>
            {answers.map((a) => (
              <View key={a.id} style={s.card} testID={`answer-${a.id}`}>
                <Text style={s.cardTitle}>{a.examQuestion.questionText}</Text>
                <View style={s.answerRow}>
                  <Ionicons
                    name={a.correct ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={a.correct ? '#4CAF50' : '#F44336'}
                  />
                  <Text style={s.answerText}>{a.selectedAnswer ?? 'No answer'}</Text>
                </View>
                {!a.correct && a.examQuestion.correctAnswer ? (
                  <Text style={s.correctText}>Correct: {a.examQuestion.correctAnswer}</Text>
                ) : null}
                <Text style={s.pointsText}>
                  {a.pointsAwarded}/{a.examQuestion.points} pts
                </Text>
              </View>
            ))}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total Score</Text>
              <Text style={s.totalValue}>{mcTotal}/{exam.maxScore ?? '?'}</Text>
            </View>
          </View>
        )}

        {/* SCORE_BASED */}
        {examType === 'SCORE_BASED' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Score</Text>
            <View style={s.scoreRow}>
              <TextInput
                style={[s.input, s.scoreInput]}
                value={score}
                onChangeText={setScore}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                testID="input-score"
              />
              <Text style={s.scoreMax}>/ {exam.maxScore ?? '?'}</Text>
            </View>
          </View>
        )}

        {/* RUBRIC */}
        {examType === 'RUBRIC' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Rubric Scoring</Text>
            {rubricScores.map((rs, i) => (
              <View key={rs.criteriaId} style={s.card} testID={`rubric-${rs.criteriaId}`}>
                <View style={s.rubricHeader}>
                  <Text style={s.cardTitle}>{rs.criteriaName}</Text>
                  <Text style={s.metaText}>/ {rs.maxScore}</Text>
                </View>
                <TextInput
                  style={[s.input, { width: 80 }]}
                  value={rs.score}
                  onChangeText={(v) =>
                    setRubricScores((prev) =>
                      prev.map((r, j) => (j === i ? { ...r, score: v } : r)),
                    )
                  }
                  placeholder="0"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  testID={`rubric-score-${i}`}
                />
                <TextInput
                  style={[s.input, { marginTop: 8 }]}
                  value={rs.feedback}
                  onChangeText={(v) =>
                    setRubricScores((prev) =>
                      prev.map((r, j) => (j === i ? { ...r, feedback: v } : r)),
                    )
                  }
                  placeholder="Feedback (optional)"
                  placeholderTextColor="#999"
                  testID={`rubric-feedback-${i}`}
                />
              </View>
            ))}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>{rubricTotal}</Text>
            </View>
          </View>
        )}

        {/* PASS_FAIL */}
        {examType === 'PASS_FAIL' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Result</Text>
            <View style={s.passFailRow}>
              <Pressable
                style={[s.passFailChip, passed === true && s.passActive]}
                onPress={() => setPassed(true)}
                testID="pass-button"
              >
                <Ionicons name="checkmark-circle" size={20} color={passed === true ? '#FFF' : '#4CAF50'} />
                <Text style={[s.passFailText, passed === true && s.passFailTextActive]}>Pass</Text>
              </Pressable>
              <Pressable
                style={[s.passFailChip, passed === false && s.failActive]}
                onPress={() => setPassed(false)}
                testID="fail-button"
              >
                <Ionicons name="close-circle" size={20} color={passed === false ? '#FFF' : '#F44336'} />
                <Text style={[s.passFailText, passed === false && s.passFailTextActive]}>Fail</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Teacher Notes */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Teacher Notes</Text>
          <TextInput
            style={[s.input, s.multiline]}
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

      <View style={s.footer}>
        <Pressable
          style={[s.gradeBtn, grading && s.gradeBtnDisabled]}
          onPress={handleGrade}
          disabled={grading}
          testID="submit-grade"
        >
          {grading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={s.gradeBtnText}>
              {submission.status === 'GRADED' ? 'Update Grade' : 'Submit Grade'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { backgroundColor: '#FFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  studentName: { fontSize: 20, fontWeight: '700', color: '#333' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  metaText: { fontSize: 12, color: '#888' },
  examInfo: { fontSize: 13, color: '#666', marginTop: 6 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#333', marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  answerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  answerText: { fontSize: 14, color: '#333' },
  correctText: { fontSize: 12, color: '#4CAF50', marginTop: 4 },
  pointsText: { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0', marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#4CAF50' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreInput: { width: 100, textAlign: 'center', fontSize: 24, fontWeight: '700' },
  scoreMax: { fontSize: 20, color: '#888' },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12,
    fontSize: 14, color: '#333', backgroundColor: '#FFF',
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  rubricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  passFailRow: { flexDirection: 'row', gap: 12 },
  passFailChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F0F0F0',
  },
  passActive: { backgroundColor: '#4CAF50' },
  failActive: { backgroundColor: '#F44336' },
  passFailText: { fontSize: 15, fontWeight: '600', color: '#666' },
  passFailTextActive: { color: '#FFF' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', padding: 16, borderTopWidth: 1, borderTopColor: '#E0E0E0',
  },
  gradeBtn: { backgroundColor: '#4CAF50', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  gradeBtnDisabled: { backgroundColor: '#BDBDBD' },
  gradeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: '#666' },
});
