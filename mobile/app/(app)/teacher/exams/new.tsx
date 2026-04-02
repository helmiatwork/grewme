import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { useTeacherSchoolId } from '../../../../src/hooks/useTeacherSchoolId';
import {
  ExamTypeEnum,
  useCreateExamMutation,
  useSubjectsQuery,
} from '../../../../src/graphql/generated/graphql';

interface QuestionDraft {
  id: string;
  questionText: string;
  options: string;
  correctAnswer: string;
  points: string;
}

interface CriteriaDraft {
  id: string;
  name: string;
  description: string;
  maxScore: string;
}

let nextId = 0;
function uid(): string {
  nextId += 1;
  return `draft-${nextId}`;
}

const EXAM_TYPES: { value: ExamTypeEnum; label: string }[] = [
  { value: ExamTypeEnum.ScoreBased, label: 'Score' },
  { value: ExamTypeEnum.MultipleChoice, label: 'Multiple Choice' },
  { value: ExamTypeEnum.Rubric, label: 'Rubric' },
  { value: ExamTypeEnum.PassFail, label: 'Pass/Fail' },
];

export default function CreateExamScreen() {
  const { schoolId: activeSchoolId } = useTeacherSchoolId();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState<ExamTypeEnum>(
    ExamTypeEnum.ScoreBased,
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null,
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [maxScore, setMaxScore] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [rubricCriteria, setRubricCriteria] = useState<CriteriaDraft[]>([]);

  const { data: subjectsData, loading: subjectsLoading } = useSubjectsQuery({
    variables: { schoolId: activeSchoolId ?? '' },
    skip: !activeSchoolId,
  });

  const [createExam, { loading: creating }] = useCreateExamMutation();

  const subjects = subjectsData?.subjects ?? [];
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const topics = selectedSubject?.topics ?? [];

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }
    if (!selectedTopicId) {
      Alert.alert('Validation', 'Please select a topic');
      return;
    }

    try {
      const result = await createExam({
        refetchQueries: ['ClassroomExams'],
        variables: {
          input: {
            title: title.trim(),
            description: description.trim() || undefined,
            examType,
            topicId: selectedTopicId,
            maxScore: maxScore ? parseInt(maxScore, 10) : undefined,
            durationMinutes: durationMinutes
              ? parseInt(durationMinutes, 10)
              : undefined,
            questions:
              examType === ExamTypeEnum.MultipleChoice
                ? questions.map((q, i) => ({
                    questionText: q.questionText,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    points: parseInt(q.points, 10) || 1,
                    position: i + 1,
                  }))
                : undefined,
            rubricCriteria:
              examType === ExamTypeEnum.Rubric
                ? rubricCriteria.map((c, i) => ({
                    name: c.name,
                    description: c.description || undefined,
                    maxScore: parseInt(c.maxScore, 10) || 10,
                    position: i + 1,
                  }))
                : undefined,
          },
        },
      });

      const errors = result.data?.createExam?.errors ?? [];
      if (errors.length > 0) {
        Alert.alert('Error', errors[0].message);
      } else {
        Alert.alert('Success', 'Exam created', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to create exam',
      );
    }
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { id: uid(), questionText: '', options: '', correctAnswer: '', points: '1' },
    ]);
  };

  const updateQuestion = (
    index: number,
    field: keyof QuestionDraft,
    value: string,
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    );
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const addCriteria = () => {
    setRubricCriteria((prev) => [
      ...prev,
      { id: uid(), name: '', description: '', maxScore: '10' },
    ]);
  };

  const updateCriteria = (
    index: number,
    field: keyof CriteriaDraft,
    value: string,
  ) => {
    setRubricCriteria((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  };

  const removeCriteria = (index: number) => {
    setRubricCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      testID="create-exam-screen"
    >
      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Exam title"
          placeholderTextColor="#999"
          testID="input-title"
        />
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional description"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          testID="input-description"
        />
      </View>

      {/* Exam Type */}
      <View style={styles.field}>
        <Text style={styles.label}>Exam Type *</Text>
        <View style={styles.chipRow}>
          {EXAM_TYPES.map((t) => (
            <Pressable
              key={t.value}
              style={[
                styles.chip,
                examType === t.value && styles.chipActive,
              ]}
              onPress={() => setExamType(t.value)}
              testID={`type-${t.value}`}
            >
              <Text
                style={[
                  styles.chipText,
                  examType === t.value && styles.chipTextActive,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Topic selection */}
      <View style={styles.field}>
        <Text style={styles.label}>Topic *</Text>
        {subjectsLoading ? (
          <ActivityIndicator size="small" color="#4CAF50" />
        ) : (
          <>
            <Text style={styles.sublabel}>Select Subject</Text>
            <View style={styles.chipRow}>
              {subjects.map((s) => (
                <Pressable
                  key={s.id}
                  style={[
                    styles.chip,
                    selectedSubjectId === s.id && styles.chipActive,
                  ]}
                  onPress={() => {
                    setSelectedSubjectId(s.id);
                    setSelectedTopicId(null);
                  }}
                  testID={`subject-${s.id}`}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedSubjectId === s.id && styles.chipTextActive,
                    ]}
                  >
                    {s.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {selectedSubjectId && (
              <>
                <Text style={[styles.sublabel, { marginTop: 8 }]}>
                  Select Topic
                </Text>
                <View style={styles.chipRow}>
                  {topics.map((t) => (
                    <Pressable
                      key={t.id}
                      style={[
                        styles.chip,
                        selectedTopicId === t.id && styles.chipActive,
                      ]}
                      onPress={() => setSelectedTopicId(t.id)}
                      testID={`topic-${t.id}`}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedTopicId === t.id && styles.chipTextActive,
                        ]}
                      >
                        {t.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </View>

      {/* Max Score (SCORE_BASED only) */}
      {examType === ExamTypeEnum.ScoreBased && (
        <View style={styles.field}>
          <Text style={styles.label}>Max Score</Text>
          <TextInput
            style={styles.input}
            value={maxScore}
            onChangeText={setMaxScore}
            placeholder="e.g. 100"
            placeholderTextColor="#999"
            keyboardType="numeric"
            testID="input-max-score"
          />
        </View>
      )}

      {/* Duration */}
      <View style={styles.field}>
        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          placeholder="e.g. 60"
          placeholderTextColor="#999"
          keyboardType="numeric"
          testID="input-duration"
        />
      </View>

      {/* Multiple Choice Questions */}
      {examType === ExamTypeEnum.MultipleChoice && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions</Text>
          {questions.map((q, i) => (
            <View key={q.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>Question {i + 1}</Text>
                <Pressable
                  onPress={() => removeQuestion(i)}
                  testID={`remove-question-${i}`}
                >
                  <Ionicons name="trash-outline" size={18} color="#F44336" />
                </Pressable>
              </View>
              <TextInput
                style={styles.input}
                value={q.questionText}
                onChangeText={(v) => updateQuestion(i, 'questionText', v)}
                placeholder="Question text"
                placeholderTextColor="#999"
                testID={`question-text-${i}`}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                value={q.options}
                onChangeText={(v) => updateQuestion(i, 'options', v)}
                placeholder="Options (comma-separated)"
                placeholderTextColor="#999"
                testID={`question-options-${i}`}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={q.correctAnswer}
                  onChangeText={(v) => updateQuestion(i, 'correctAnswer', v)}
                  placeholder="Correct answer"
                  placeholderTextColor="#999"
                  testID={`question-answer-${i}`}
                />
                <TextInput
                  style={[styles.input, { width: 60, marginLeft: 8 }]}
                  value={q.points}
                  onChangeText={(v) => updateQuestion(i, 'points', v)}
                  placeholder="Pts"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  testID={`question-points-${i}`}
                />
              </View>
            </View>
          ))}
          <Pressable
            style={styles.addButton}
            onPress={addQuestion}
            testID="add-question"
          >
            <Ionicons name="add-circle-outline" size={18} color="#4CAF50" />
            <Text style={styles.addButtonText}>Add Question</Text>
          </Pressable>
        </View>
      )}

      {/* Rubric Criteria */}
      {examType === ExamTypeEnum.Rubric && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rubric Criteria</Text>
          {rubricCriteria.map((c, i) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>Criteria {i + 1}</Text>
                <Pressable
                  onPress={() => removeCriteria(i)}
                  testID={`remove-criteria-${i}`}
                >
                  <Ionicons name="trash-outline" size={18} color="#F44336" />
                </Pressable>
              </View>
              <TextInput
                style={styles.input}
                value={c.name}
                onChangeText={(v) => updateCriteria(i, 'name', v)}
                placeholder="Criteria name"
                placeholderTextColor="#999"
                testID={`criteria-name-${i}`}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                value={c.description}
                onChangeText={(v) => updateCriteria(i, 'description', v)}
                placeholder="Description (optional)"
                placeholderTextColor="#999"
                testID={`criteria-desc-${i}`}
              />
              <TextInput
                style={[styles.input, { marginTop: 8, width: 100 }]}
                value={c.maxScore}
                onChangeText={(v) => updateCriteria(i, 'maxScore', v)}
                placeholder="Max score"
                placeholderTextColor="#999"
                keyboardType="numeric"
                testID={`criteria-score-${i}`}
              />
            </View>
          ))}
          <Pressable
            style={styles.addButton}
            onPress={addCriteria}
            testID="add-criteria"
          >
            <Ionicons name="add-circle-outline" size={18} color="#4CAF50" />
            <Text style={styles.addButtonText}>Add Criteria</Text>
          </Pressable>
        </View>
      )}

      {/* Submit */}
      <Pressable
        style={[styles.submitButton, creating && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={creating}
        testID="submit-exam"
      >
        {creating ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Create Exam</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  sublabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    marginBottom: 6,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    fontWeight: '600',
    color: '#666',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
