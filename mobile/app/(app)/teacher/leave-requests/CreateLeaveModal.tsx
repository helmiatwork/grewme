import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  HalfDaySessionEnum,
  TeacherLeaveRequestTypeEnum,
  useCreateTeacherLeaveRequestMutation,
} from '../../../../src/graphql/generated/graphql';

const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  PERSONAL: 'Personal Leave',
};

interface CreateLeaveModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateLeaveModal({
  visible,
  onClose,
  onCreated,
}: CreateLeaveModalProps) {
  const [createLeaveRequest, { loading: creating }] =
    useCreateTeacherLeaveRequestMutation();

  const [requestType, setRequestType] = useState<TeacherLeaveRequestTypeEnum>(
    TeacherLeaveRequestTypeEnum.Annual
  );
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [halfDay, setHalfDay] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const resetForm = () => {
    setRequestType(TeacherLeaveRequestTypeEnum.Annual);
    setStartDate(new Date());
    setEndDate(new Date());
    setReason('');
    setHalfDay(false);
    onClose();
  };

  const handleCreate = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please enter a reason');
      return;
    }
    if (endDate < startDate) {
      Alert.alert('Error', 'End date must be on or after start date');
      return;
    }

    try {
      const result = await createLeaveRequest({
        variables: {
          input: {
            requestType,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            reason: reason.trim(),
            halfDaySession: halfDay ? HalfDaySessionEnum.Morning : undefined,
          },
        },
      });
      const errors = result.data?.createTeacherLeaveRequest?.errors ?? [];
      if (errors.length > 0) {
        Alert.alert('Error', errors[0].message);
      } else {
        resetForm();
        onCreated();
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : 'Failed to create leave request';
      Alert.alert('Error', msg);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetForm}
    >
      <ScrollView style={styles.formContainer} testID="leave-request-form">
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>New Leave Request</Text>
          <Pressable onPress={resetForm} testID="close-form-button">
            <Ionicons name="close" size={24} color="#666" />
          </Pressable>
        </View>

        {/* Type Picker */}
        <Text style={styles.label}>Leave Type</Text>
        <View style={styles.typePicker}>
          {(
            [
              TeacherLeaveRequestTypeEnum.Annual,
              TeacherLeaveRequestTypeEnum.Sick,
              TeacherLeaveRequestTypeEnum.Personal,
            ] as const
          ).map((t) => (
            <Pressable
              key={t}
              style={[
                styles.typeOption,
                requestType === t && styles.typeOptionSelected,
              ]}
              onPress={() => setRequestType(t)}
              testID={`type-${t.toLowerCase()}`}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  requestType === t && styles.typeOptionTextSelected,
                ]}
              >
                {TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Start Date */}
        <Text style={styles.label}>Start Date</Text>
        <Pressable
          style={styles.dateButton}
          onPress={() => setShowStartPicker(true)}
          testID="start-date-button"
        >
          <Ionicons name="calendar-outline" size={18} color="#666" />
          <Text style={styles.dateButtonText}>
            {startDate.toLocaleDateString()}
          </Text>
        </Pressable>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_event, date) => {
              setShowStartPicker(Platform.OS === 'ios');
              if (date) {
                setStartDate(date);
                if (date > endDate) setEndDate(date);
              }
            }}
            testID="start-date-picker"
          />
        )}

        {/* End Date */}
        <Text style={styles.label}>End Date</Text>
        <Pressable
          style={styles.dateButton}
          onPress={() => setShowEndPicker(true)}
          testID="end-date-button"
        >
          <Ionicons name="calendar-outline" size={18} color="#666" />
          <Text style={styles.dateButtonText}>
            {endDate.toLocaleDateString()}
          </Text>
        </Pressable>
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            minimumDate={startDate}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_event, date) => {
              setShowEndPicker(Platform.OS === 'ios');
              if (date) setEndDate(date);
            }}
            testID="end-date-picker"
          />
        )}

        {/* Half Day Toggle */}
        <Pressable
          style={styles.halfDayToggle}
          onPress={() => setHalfDay((v) => !v)}
          testID="half-day-toggle"
        >
          <View style={[styles.toggleBox, halfDay && styles.toggleBoxActive]}>
            {halfDay ? (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            ) : null}
          </View>
          <Text style={styles.halfDayLabel}>Half day (morning)</Text>
        </Pressable>

        {/* Reason */}
        <Text style={styles.label}>Reason</Text>
        <TextInput
          style={styles.reasonInput}
          value={reason}
          onChangeText={setReason}
          placeholder="Enter the reason for leave..."
          multiline
          numberOfLines={3}
          testID="reason-input"
        />

        <Pressable
          style={[styles.submitButton, creating && styles.submitButtonDisabled]}
          onPress={handleCreate}
          disabled={creating}
          testID="submit-leave"
        >
          {creating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Request</Text>
          )}
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  typePicker: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  typeOptionSelected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  typeOptionText: {
    fontSize: 13,
    color: '#666',
  },
  typeOptionTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#333',
  },
  halfDayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  toggleBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBoxActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  halfDayLabel: {
    fontSize: 15,
    color: '#333',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
