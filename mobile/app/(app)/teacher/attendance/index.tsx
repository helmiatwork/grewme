import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useCallback, useMemo, useState } from 'react';
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
import { useAuthStore } from '../../../../src/auth/store';
import {
  AttendanceStatusEnum,
  ClassroomAttendanceDocument,
  type ClassroomAttendanceQuery,
  useBulkRecordAttendanceMutation,
  useClassroomAttendanceQuery,
  useClassroomsQuery,
} from '../../../../src/graphql/generated/graphql';

type AttendanceRecord = ClassroomAttendanceQuery['classroomAttendance'][number];

interface LocalRecord {
  studentId: string;
  studentName: string;
  status: AttendanceStatusEnum;
  notes: string;
}

const STATUS_OPTIONS: {
  value: AttendanceStatusEnum;
  label: string;
  color: string;
}[] = [
  { value: AttendanceStatusEnum.Present, label: 'Present', color: '#4CAF50' },
  { value: AttendanceStatusEnum.Sick, label: 'Sick', color: '#FF9800' },
  { value: AttendanceStatusEnum.Excused, label: 'Excused', color: '#2196F3' },
  {
    value: AttendanceStatusEnum.Unexcused,
    label: 'Unexcused',
    color: '#F44336',
  },
];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function TeacherAttendanceScreen() {
  const activeClassroomId = useAuthStore((s) => s.activeClassroomId);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localRecords, setLocalRecords] = useState<LocalRecord[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const { data: classroomsData, loading: classroomsLoading } =
    useClassroomsQuery();

  const classroomId = activeClassroomId ?? classroomsData?.classrooms?.[0]?.id;
  const activeClassroom = classroomsData?.classrooms?.find(
    (c) => c.id === classroomId
  );

  const {
    data: attendanceData,
    loading: attendanceLoading,
    error: attendanceError,
    refetch,
  } = useClassroomAttendanceQuery({
    variables: {
      classroomId: classroomId ?? '',
      date: formatDate(selectedDate),
    },
    skip: !classroomId,
    onCompleted: (data) => {
      setLocalRecords(
        data.classroomAttendance.map((r: AttendanceRecord) => ({
          studentId: r.student.id,
          studentName: r.student.name,
          status: r.status,
          notes: r.notes ?? '',
        }))
      );
      setHasLocalChanges(false);
    },
  });

  const [bulkRecord, { loading: saving }] = useBulkRecordAttendanceMutation();

  const onDateChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      setShowDatePicker(Platform.OS === 'ios');
      if (date) {
        setSelectedDate(date);
        setHasLocalChanges(false);
      }
    },
    []
  );

  const updateStatus = useCallback(
    (studentId: string, status: AttendanceStatusEnum) => {
      setLocalRecords((prev) =>
        prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
      );
      setHasLocalChanges(true);
    },
    []
  );

  const updateNotes = useCallback((studentId: string, notes: string) => {
    setLocalRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, notes } : r))
    );
    setHasLocalChanges(true);
  }, []);

  const markAllPresent = useCallback(() => {
    setLocalRecords((prev) =>
      prev.map((r) => ({ ...r, status: AttendanceStatusEnum.Present }))
    );
    setHasLocalChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!classroomId || localRecords.length === 0) return;

    try {
      const result = await bulkRecord({
        variables: {
          classroomId,
          date: formatDate(selectedDate),
          records: localRecords.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            notes: r.notes || undefined,
          })),
        },
        refetchQueries: [
          {
            query: ClassroomAttendanceDocument,
            variables: {
              classroomId,
              date: formatDate(selectedDate),
            },
          },
        ],
      });

      const errors = result.data?.bulkRecordAttendance?.errors ?? [];
      if (errors.length > 0) {
        Alert.alert(
          'Some errors occurred',
          errors.map((e) => e.message).join('\n')
        );
      } else {
        Alert.alert('Success', 'Attendance saved successfully');
        setHasLocalChanges(false);
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save attendance'
      );
    }
  }, [classroomId, selectedDate, localRecords, bulkRecord]);

  const summaryText = useMemo(() => {
    if (localRecords.length === 0) return '';
    const present = localRecords.filter(
      (r) => r.status === AttendanceStatusEnum.Present
    ).length;
    const absent = localRecords.length - present;
    return `${present} present, ${absent} absent`;
  }, [localRecords]);

  if (classroomsLoading) {
    return (
      <View style={styles.centered} testID="loading-state">
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading classrooms...</Text>
      </View>
    );
  }

  if (attendanceError) {
    return (
      <View style={styles.centered} testID="error-state">
        <Text style={styles.errorText}>
          Failed to load attendance: {attendanceError.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="teacher-attendance">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.classroomName} testID="classroom-name">
          {activeClassroom?.name ?? 'Attendance'}
        </Text>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
          testID="date-picker-button"
        >
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </Pressable>
      </View>

      {showDatePicker && (
        <DateTimePicker
          testID="date-picker"
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Summary bar */}
      {localRecords.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText} testID="attendance-summary">
            {summaryText}
          </Text>
          <Pressable
            onPress={markAllPresent}
            style={styles.markAllButton}
            testID="mark-all-present"
          >
            <Text style={styles.markAllText}>Mark All Present</Text>
          </Pressable>
        </View>
      )}

      {/* Attendance list */}
      {attendanceLoading ? (
        <View style={styles.centered} testID="attendance-loading">
          <ActivityIndicator size="small" color="#4CAF50" />
        </View>
      ) : (
        <FlatList
          testID="attendance-list"
          data={localRecords}
          keyExtractor={(item) => item.studentId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText} testID="empty-text">
                No students found for this classroom and date.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={styles.studentCard}
              testID={`student-row-${item.studentId}`}
            >
              <Text style={styles.studentName}>{item.studentName}</Text>

              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => updateStatus(item.studentId, opt.value)}
                    style={[
                      styles.statusChip,
                      item.status === opt.value && {
                        backgroundColor: opt.color,
                      },
                    ]}
                    testID={`status-${item.studentId}-${opt.value}`}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        item.status === opt.value &&
                          styles.statusChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.notesInput}
                placeholder="Add notes..."
                placeholderTextColor="#999"
                value={item.notes}
                onChangeText={(text) => updateNotes(item.studentId, text)}
                testID={`notes-${item.studentId}`}
              />
            </View>
          )}
        />
      )}

      {/* Save button */}
      {localRecords.length > 0 && (
        <View style={styles.footer}>
          <Pressable
            onPress={handleSave}
            disabled={saving || !hasLocalChanges}
            style={[
              styles.saveButton,
              (saving || !hasLocalChanges) && styles.saveButtonDisabled,
            ]}
            testID="save-button"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {hasLocalChanges ? 'Save Attendance' : 'Saved'}
              </Text>
            )}
          </Pressable>
        </View>
      )}
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
    padding: 24,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classroomName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  dateButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  summaryText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  markAllButton: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#388E3C',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#333',
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
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
