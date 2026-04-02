import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  useClassroomOverviewQuery,
  useCreateHealthCheckupMutation,
} from '../../../../src/graphql/generated/graphql';
import { useAuthStore } from '../../../../src/auth/store';
import LoadingState from '../../../../src/components/LoadingState';
import ErrorState from '../../../../src/components/ErrorState';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function HealthCheckupsScreen() {
  const activeClassroomId = useAuthStore((s) => s.activeClassroomId);

  const [studentId, setStudentId] = useState('');
  const [measuredAt, setMeasuredAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState('');
  const [notes, setNotes] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);

  const { data, loading, error, refetch } = useClassroomOverviewQuery({
    variables: { classroomId: activeClassroomId! },
    skip: !activeClassroomId,
  });

  const [createCheckup, { loading: submitting }] =
    useCreateHealthCheckupMutation();

  const students = data?.classroomOverview?.students ?? [];

  const selectedStudent = students.find((s) => s.studentId === studentId);

  const resetForm = () => {
    setStudentId('');
    setMeasuredAt(new Date());
    setWeightKg('');
    setHeightCm('');
    setHeadCircumferenceCm('');
    setNotes('');
  };

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setMeasuredAt(date);
  };

  const handleSubmit = async () => {
    if (!studentId) {
      Alert.alert('Validation', 'Please select a student.');
      return;
    }

    try {
      const result = await createCheckup({
        variables: {
          studentId,
          measuredAt: formatDate(measuredAt),
          weightKg: weightKg ? parseFloat(weightKg) : undefined,
          heightCm: heightCm ? parseFloat(heightCm) : undefined,
          headCircumferenceCm: headCircumferenceCm
            ? parseFloat(headCircumferenceCm)
            : undefined,
          notes: notes.trim() || undefined,
        },
      });

      const payload = result.data?.createHealthCheckup;
      if (payload?.errors && payload.errors.length > 0) {
        Alert.alert('Error', payload.errors[0].message);
        return;
      }

      const checkup = payload?.healthCheckup;
      if (checkup) {
        const bmiInfo = checkup.bmi
          ? `\nBMI: ${checkup.bmi.toFixed(1)} (${checkup.bmiCategory ?? 'N/A'})`
          : '';
        Alert.alert('Success', `Health checkup recorded.${bmiInfo}`);
        resetForm();
      }
    } catch (_e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  if (loading) return <LoadingState message="Loading students..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="health-checkup-screen"
    >
      <Text style={styles.title}>Record Health Checkup</Text>

      {/* Student Picker */}
      <Text style={styles.label}>Student *</Text>
      <Pressable
        style={styles.pickerButton}
        onPress={() => setPickerVisible(!pickerVisible)}
        testID="student-picker-button"
      >
        <Text
          style={selectedStudent ? styles.pickerText : styles.pickerPlaceholder}
        >
          {selectedStudent?.studentName ?? 'Select a student'}
        </Text>
      </Pressable>
      {pickerVisible && (
        <View style={styles.pickerDropdown} testID="student-picker-dropdown">
          {students.map((s) => (
            <Pressable
              key={s.studentId}
              style={[
                styles.pickerItem,
                s.studentId === studentId && styles.pickerItemSelected,
              ]}
              onPress={() => {
                setStudentId(s.studentId);
                setPickerVisible(false);
              }}
              testID={`student-option-${s.studentId}`}
            >
              <Text style={styles.pickerItemText}>{s.studentName}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Date Picker */}
      <Text style={styles.label}>Date *</Text>
      <Pressable
        style={styles.pickerButton}
        onPress={() => setShowDatePicker(true)}
        testID="date-picker-button"
      >
        <Text style={styles.pickerText}>{formatDate(measuredAt)}</Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={measuredAt}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          testID="date-picker"
        />
      )}

      {/* Weight */}
      <Text style={styles.label}>Weight (kg)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 15.5"
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="decimal-pad"
        testID="weight-input"
      />

      {/* Height */}
      <Text style={styles.label}>Height (cm)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 95.0"
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="decimal-pad"
        testID="height-input"
      />

      {/* Head Circumference */}
      <Text style={styles.label}>Head Circumference (cm)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 48.5"
        value={headCircumferenceCm}
        onChangeText={setHeadCircumferenceCm}
        keyboardType="decimal-pad"
        testID="head-circumference-input"
      />

      {/* Notes */}
      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Optional notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
        testID="notes-input"
      />

      {/* Submit */}
      <Pressable
        style={[styles.submitButton, submitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={submitting}
        testID="submit-button"
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Saving...' : 'Record Checkup'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1A1A1A',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  pickerPlaceholder: {
    fontSize: 15,
    color: '#999',
  },
  pickerDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  pickerItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
