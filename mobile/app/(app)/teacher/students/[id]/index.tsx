import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import RadarChart from '../../../../../src/components/RadarChart';
import LineChart from '../../../../../src/components/LineChart';
import type { LineChartDataset } from '../../../../../src/components/LineChart';
import LoadingState from '../../../../../src/components/LoadingState';
import ErrorState from '../../../../../src/components/ErrorState';
import {
  SkillCategoryEnum,
  useTeacherStudentDetailQuery,
  useCreateDailyScoreMutation,
} from '../../../../../src/graphql/generated/graphql';

const SKILL_COLORS: Record<string, string> = {
  Reading: '#4CAF50',
  Math: '#2196F3',
  Writing: '#FF9800',
  Logic: '#9C27B0',
  Social: '#F44336',
};

const SKILL_KEYS = ['reading', 'math', 'writing', 'logic', 'social'] as const;

const SKILL_OPTIONS: { value: SkillCategoryEnum; label: string }[] = [
  { value: SkillCategoryEnum.Reading, label: 'Reading' },
  { value: SkillCategoryEnum.Math, label: 'Math' },
  { value: SkillCategoryEnum.Writing, label: 'Writing' },
  { value: SkillCategoryEnum.Logic, label: 'Logic' },
  { value: SkillCategoryEnum.Social, label: 'Social' },
];

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading, error, refetch } = useTeacherStudentDetailQuery({
    variables: { studentId: id ?? '' },
    skip: !id,
  });

  const [createDailyScore, { loading: submitting }] =
    useCreateDailyScoreMutation();

  const [showScoreForm, setShowScoreForm] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillCategoryEnum>(
    SkillCategoryEnum.Reading,
  );
  const [scoreValue, setScoreValue] = useState('');
  const [scoreNotes, setScoreNotes] = useState('');

  if (loading) {
    return <LoadingState message="Loading student details..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || 'Failed to load student details'}
        onRetry={() => refetch()}
      />
    );
  }

  const radar = data?.studentRadar;
  const weeks = data?.studentProgress?.weeks ?? [];
  const scoreEdges = data?.studentDailyScores?.edges ?? [];

  const skills = {
    reading: radar?.skills.reading ?? 0,
    math: radar?.skills.math ?? 0,
    writing: radar?.skills.writing ?? 0,
    logic: radar?.skills.logic ?? 0,
    social: radar?.skills.social ?? 0,
  };

  // Progress chart data
  const labels = weeks.map((w) => w.period.replace('Week of ', ''));
  const datasets: LineChartDataset[] = SKILL_KEYS.map((key) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    data: weeks.map((w) => w.skills[key] ?? null),
    color: SKILL_COLORS[key.charAt(0).toUpperCase() + key.slice(1)],
  }));
  const chartWidth = Math.min(Dimensions.get('window').width - 32, 400);

  const handleSubmitScore = async () => {
    const parsed = parseInt(scoreValue, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      Alert.alert('Invalid Score', 'Score must be an integer between 0 and 100.');
      return;
    }

    const scoreDate = new Date().toISOString().split('T')[0];

    try {
      const result = await createDailyScore({
        variables: {
          input: {
            studentId: id!,
            date: scoreDate,
            skillCategory: selectedSkill,
            score: parsed,
            notes: scoreNotes.trim() || undefined,
          },
        },
        refetchQueries: ['TeacherStudentDetail'],
      });

      const errors = result.data?.createDailyScore?.errors;
      if (errors && errors.length > 0) {
        Alert.alert('Error', errors.map((e) => e.message).join(', '));
        return;
      }

      Alert.alert('Success', 'Daily score recorded.');
      setScoreValue('');
      setScoreNotes('');
      setShowScoreForm(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      Alert.alert('Error', message);
    }
  };

  const formatSkillCategory = (cat: string) =>
    cat
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <View style={s.container} testID="student-detail-screen">
      <ScrollView contentContainerStyle={s.scrollContent}>
        {/* Header */}
        <View style={s.header} testID="student-header">
          <Text style={s.studentName}>{radar?.studentName ?? 'Student'}</Text>
          <Text style={s.subtitle}>Skill Overview</Text>
        </View>

        {/* Radar Chart */}
        <View style={s.card} testID="radar-section">
          <View style={s.chartCenter}>
            <RadarChart skills={skills} size={260} />
          </View>
          <View style={s.skillBreakdown}>
            {SKILL_KEYS.map((key) => {
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              const value = skills[key];
              return (
                <View key={key} style={s.skillRow} testID={`skill-row-${key}`}>
                  <View style={s.skillLabelRow}>
                    <View
                      style={[s.skillDot, { backgroundColor: SKILL_COLORS[label] }]}
                    />
                    <Text style={s.skillLabel}>{label}</Text>
                  </View>
                  <Text style={s.skillValue}>
                    {value != null ? Math.round(value) : '-'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Progress Chart */}
        {weeks.length > 0 && (
          <View style={s.card} testID="progress-section">
            <Text style={s.sectionTitle}>Weekly Progress</Text>
            <View style={s.chartCenter}>
              <LineChart
                labels={labels}
                datasets={datasets}
                width={chartWidth}
                height={200}
                yMin={0}
                yMax={100}
              />
            </View>
          </View>
        )}

        {/* Score Form Toggle */}
        <Pressable
          style={s.toggleBtn}
          onPress={() => setShowScoreForm((prev) => !prev)}
          testID="toggle-score-form"
        >
          <Ionicons
            name={showScoreForm ? 'close-circle-outline' : 'add-circle-outline'}
            size={20}
            color="#fff"
          />
          <Text style={s.toggleBtnText}>
            {showScoreForm ? 'Cancel' : 'Add Score'}
          </Text>
        </Pressable>

        {/* Score Form */}
        {showScoreForm && (
          <View style={s.card} testID="score-form">
            <Text style={s.sectionTitle}>New Daily Score</Text>

            {/* Skill Chips */}
            <View style={s.chipRow} testID="skill-chips">
              {SKILL_OPTIONS.map((opt) => {
                const active = selectedSkill === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setSelectedSkill(opt.value)}
                    testID={`chip-${opt.value}`}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Score Input */}
            <Text style={s.inputLabel}>Score (0-100)</Text>
            <TextInput
              style={s.textInput}
              value={scoreValue}
              onChangeText={setScoreValue}
              keyboardType="numeric"
              placeholder="Enter score"
              maxLength={3}
              testID="score-input"
            />

            {/* Notes Input */}
            <Text style={s.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[s.textInput, s.textArea]}
              value={scoreNotes}
              onChangeText={setScoreNotes}
              placeholder="Add notes..."
              multiline
              numberOfLines={3}
              testID="notes-input"
            />

            {/* Submit */}
            <Pressable
              style={[s.submitBtn, submitting && s.submitBtnDisabled]}
              onPress={handleSubmitScore}
              disabled={submitting}
              testID="submit-score-btn"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.submitBtnText}>Save Score</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Recent Scores */}
        {scoreEdges.length > 0 && (
          <View style={s.card} testID="recent-scores-section">
            <Text style={s.sectionTitle}>Recent Scores</Text>
            {scoreEdges.map(({ node }) => (
              <View
                key={node.id}
                style={s.scoreCard}
                testID={`score-card-${node.id}`}
              >
                <View style={s.scoreCardHeader}>
                  <Text style={s.scoreDate}>{node.date}</Text>
                  <Text style={s.scoreCategory}>
                    {formatSkillCategory(node.skillCategory)}
                  </Text>
                </View>
                <Text style={s.scoreNum}>{node.score}</Text>
                {node.notes ? (
                  <Text style={s.scoreNotes}>{node.notes}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  studentName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  chartCenter: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  skillBreakdown: {
    marginTop: 12,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 6,
  },
  toggleBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#4CAF50',
  },
  chipText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  scoreCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scoreDate: {
    fontSize: 13,
    color: '#999',
  },
  scoreCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  scoreNum: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  scoreNotes: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
});
