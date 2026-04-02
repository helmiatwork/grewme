import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useAuthStore } from '../../../../src/auth/store';
import {
  SkillCategoryEnum,
  useClassroomOverviewQuery,
  useBulkCreateDailyScoresMutation,
} from '../../../../src/graphql/generated/graphql';
import { SKILL_OPTIONS } from '../../../../src/utils/skillHelpers';

const ENUM_TO_KEY: Record<SkillCategoryEnum, string> = {
  [SkillCategoryEnum.Reading]: 'reading',
  [SkillCategoryEnum.Math]: 'math',
  [SkillCategoryEnum.Writing]: 'writing',
  [SkillCategoryEnum.Logic]: 'logic',
  [SkillCategoryEnum.Social]: 'social',
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type StudentItem = {
  studentId: string;
  studentName: string;
  skills: {
    reading?: number | null;
    math?: number | null;
    writing?: number | null;
    logic?: number | null;
    social?: number | null;
  };
};

export default function BulkScoreScreen() {
  const activeClassroomId = useAuthStore((s) => s.activeClassroomId);

  const [selectedSkill, setSelectedSkill] = useState<SkillCategoryEnum>(
    SkillCategoryEnum.Reading,
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scores, setScores] = useState<Record<string, string>>({});

  const { data, loading } = useClassroomOverviewQuery({
    variables: { classroomId: activeClassroomId ?? '' },
    skip: !activeClassroomId,
  });

  const [bulkCreate, { loading: submitting }] =
    useBulkCreateDailyScoresMutation();

  const students: StudentItem[] =
    data?.classroomOverview?.students ?? [];

  const handleDateChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      setShowDatePicker(Platform.OS === 'ios');
      if (date) {
        setSelectedDate(date);
      }
    },
    [],
  );

  const handleScoreChange = useCallback(
    (studentId: string, value: string) => {
      setScores((prev) => ({ ...prev, [studentId]: value }));
    },
    [],
  );

  const handleSubmit = async () => {
    if (!activeClassroomId) return;
    const filledScores = Object.entries(scores)
      .filter(([, v]) => v.trim() !== '')
      .map(([studentId, v]) => {
        const n = parseInt(v, 10);
        if (isNaN(n) || n < 0 || n > 100) return null;
        return { studentId, score: n };
      })
      .filter(
        (entry): entry is { studentId: string; score: number } =>
          entry !== null,
      );

    if (filledScores.length === 0) {
      Alert.alert('Validation', 'Enter at least one score (0-100)');
      return;
    }

    try {
      const result = await bulkCreate({
        variables: {
          classroomId: activeClassroomId!,
          date: selectedDate.toISOString().split('T')[0],
          skillCategory: selectedSkill,
          scores: filledScores,
        },
        refetchQueries: ['TeacherStudentDetail', 'ClassroomOverview'],
      });

      const errors =
        result.data?.bulkCreateDailyScores?.errors ?? [];
      if (errors.length > 0) {
        Alert.alert('Error', errors[0].message);
      } else {
        Alert.alert('Success', `${filledScores.length} scores saved`, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save scores',
      );
    }
  };

  if (!activeClassroomId) {
    return (
      <View style={styles.centered} testID="no-classroom">
        <Text style={styles.centeredText}>Select a classroom first.</Text>
      </View>
    );
  }

  const activeSkillOption = SKILL_OPTIONS.find(
    (o) => o.value === selectedSkill,
  );
  const skillKey = ENUM_TO_KEY[selectedSkill] as keyof StudentItem['skills'];

  const filledCount = Object.values(scores).filter(
    (v) => v.trim() !== '',
  ).length;

  const renderStudent = ({ item }: { item: StudentItem }) => {
    const currentValue = item.skills[skillKey];
    return (
      <View style={styles.studentRow} testID={`student-row-${item.studentId}`}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.studentName}</Text>
          {currentValue != null && (
            <Text style={styles.hintText}>
              Current: {currentValue}
            </Text>
          )}
        </View>
        <TextInput
          style={styles.scoreInput}
          value={scores[item.studentId] ?? ''}
          onChangeText={(v) => handleScoreChange(item.studentId, v)}
          placeholder="0-100"
          placeholderTextColor="#999"
          keyboardType="numeric"
          maxLength={3}
          testID={`score-input-${item.studentId}`}
        />
      </View>
    );
  };

  return (
    <View style={styles.container} testID="bulk-score-screen">
      {/* Header: Skill Chips + Date Picker */}
      <View style={styles.header}>
        <Text style={styles.label}>Skill Category</Text>
        <View style={styles.chipRow}>
          {SKILL_OPTIONS.map((option) => {
            const isActive = selectedSkill === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive
                      ? option.color
                      : '#E0E0E0',
                  },
                ]}
                onPress={() => setSelectedSkill(option.value)}
                testID={`skill-chip-${option.value}`}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && styles.chipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>Date</Text>
        <Pressable
          style={styles.datePressable}
          onPress={() => setShowDatePicker(true)}
          testID="date-picker-button"
        >
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            maximumDate={new Date()}
            onChange={handleDateChange}
            testID="date-picker"
          />
        )}
      </View>

      {/* Student List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={activeSkillOption?.color ?? '#4CAF50'}
            testID="loading-indicator"
          />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.studentId}
          renderItem={renderStudent}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.centeredText}>No students found.</Text>
            </View>
          }
          testID="student-list"
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
          testID="submit-scores"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              Score {filledCount > 0 ? filledCount : students.length} students
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredText: {
    fontSize: 15,
    color: '#999',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  datePressable: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  studentInfo: {
    flex: 1,
    marginRight: 12,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  scoreInput: {
    width: 70,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
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
