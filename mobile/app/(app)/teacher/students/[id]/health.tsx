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
import { useLocalSearchParams } from 'expo-router';
import {
  useStudentHealthCheckupsQuery,
  useCreateHealthCheckupMutation,
} from '../../../../../src/graphql/generated/graphql';
import LoadingState from '../../../../../src/components/LoadingState';
import ErrorState from '../../../../../src/components/ErrorState';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calcBmi(weightKg: string, heightCm: string): string | null {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  if (!w || !h || h <= 0) return null;
  const bmi = w / Math.pow(h / 100, 2);
  return bmi.toFixed(1);
}

export default function StudentHealthScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [showForm, setShowForm] = useState(false);
  const [measuredAt, setMeasuredAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState('');
  const [notes, setNotes] = useState('');

  const { data, loading, error, refetch } = useStudentHealthCheckupsQuery({
    variables: { studentId: id },
    skip: !id,
  });

  const [createCheckup, { loading: submitting }] =
    useCreateHealthCheckupMutation({
      onCompleted: () => refetch(),
    });

  const checkups = data?.studentHealthCheckups ?? [];

  const resetForm = () => {
    setMeasuredAt(new Date());
    setWeightKg('');
    setHeightCm('');
    setHeadCircumferenceCm('');
    setNotes('');
    setShowDatePicker(false);
  };

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setMeasuredAt(date);
  };

  const handleSubmit = async () => {
    if (!id) return;

    try {
      const result = await createCheckup({
        variables: {
          studentId: id,
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
        setShowForm(false);
      }
    } catch (_e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  if (loading) return <LoadingState message="Loading health records..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const previewBmi = calcBmi(weightKg, heightCm);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="student-health-screen"
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Health Checkups</Text>
        <Pressable
          style={styles.toggleButton}
          onPress={() => {
            resetForm();
            setShowForm((v) => !v);
          }}
          testID="toggle-form"
        >
          <Text style={styles.toggleButtonText}>
            {showForm ? 'Cancel' : '+ New'}
          </Text>
        </Pressable>
      </View>

      {/* New Checkup Form */}
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Record New Checkup</Text>

          {/* Date */}
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

          {previewBmi && (
            <Text style={styles.bmiPreview}>
              Estimated BMI: {previewBmi}
            </Text>
          )}

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

          <Pressable
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting}
            testID="submit-checkup"
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Saving...' : 'Record Checkup'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Checkup History */}
      {checkups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No health checkups recorded yet.</Text>
        </View>
      ) : (
        checkups.map((checkup) => (
          <View key={checkup.id} style={styles.checkupCard} testID={`checkup-${checkup.id}`}>
            <Text style={styles.checkupDate}>{checkup.measuredAt}</Text>
            <View style={styles.metricsRow}>
              {checkup.weightKg != null && (
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{checkup.weightKg} kg</Text>
                  <Text style={styles.metricLabel}>Weight</Text>
                </View>
              )}
              {checkup.heightCm != null && (
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{checkup.heightCm} cm</Text>
                  <Text style={styles.metricLabel}>Height</Text>
                </View>
              )}
              {checkup.bmi != null && (
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{checkup.bmi.toFixed(1)}</Text>
                  <Text style={styles.metricLabel}>BMI</Text>
                </View>
              )}
              {checkup.headCircumferenceCm != null && (
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{checkup.headCircumferenceCm} cm</Text>
                  <Text style={styles.metricLabel}>Head</Text>
                </View>
              )}
            </View>
            {checkup.bmiCategory && (
              <Text style={styles.bmiCategory}>{checkup.bmiCategory}</Text>
            )}
            {checkup.notes && (
              <Text style={styles.checkupNotes}>{checkup.notes}</Text>
            )}
          </View>
        ))
      )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  toggleButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  notesInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
  },
  pickerText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  bmiPreview: {
    fontSize: 13,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
  },
  checkupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  checkupDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metric: {
    alignItems: 'center',
    minWidth: 64,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  metricLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  bmiCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  checkupNotes: {
    fontSize: 13,
    color: '#555',
    marginTop: 8,
  },
});
