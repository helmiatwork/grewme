import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ErrorState from '../../../../src/components/ErrorState';
import LoadingState from '../../../../src/components/LoadingState';
import {
  LeaveRequestStatusEnum,
  TeacherLeaveRequestTypeEnum,
  useCreateTeacherLeaveRequestMutation,
  useMyTeacherLeaveBalanceQuery,
  useMyTeacherLeaveRequestsQuery,
} from '../../../../src/graphql/generated/graphql';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FFF3E0', text: '#E65100' },
  APPROVED: { bg: '#E8F5E9', text: '#2E7D32' },
  REJECTED: { bg: '#FFEBEE', text: '#C62828' },
};

const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  PERSONAL: 'Personal Leave',
};

const STATUS_FILTERS: Array<{ label: string; value: LeaveRequestStatusEnum | null }> = [
  { label: 'All', value: null },
  { label: 'Pending', value: LeaveRequestStatusEnum.Pending },
  { label: 'Approved', value: LeaveRequestStatusEnum.Approved },
  { label: 'Rejected', value: LeaveRequestStatusEnum.Rejected },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TeacherMyLeaveScreen() {
  const [activeFilter, setActiveFilter] = useState<LeaveRequestStatusEnum | null>(null);

  const {
    data: requestsData,
    loading: requestsLoading,
    error: requestsError,
    refetch,
  } = useMyTeacherLeaveRequestsQuery({
    variables: { status: activeFilter ?? undefined },
  });

  const {
    data: balanceData,
    loading: balanceLoading,
  } = useMyTeacherLeaveBalanceQuery();

  const [createLeaveRequest, { loading: creating }] =
    useCreateTeacherLeaveRequestMutation();

  const [showForm, setShowForm] = useState(false);
  const [requestType, setRequestType] = useState<TeacherLeaveRequestTypeEnum>(
    TeacherLeaveRequestTypeEnum.Annual
  );
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [halfDay, setHalfDay] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const loading = requestsLoading || balanceLoading;

  if (loading) return <LoadingState />;
  if (requestsError) return <ErrorState message={requestsError.message} />;

  const requests = requestsData?.myTeacherLeaveRequests ?? [];
  const balance = balanceData?.myTeacherLeaveBalance;

  const resetForm = () => {
    setRequestType(TeacherLeaveRequestTypeEnum.Annual);
    setStartDate(new Date());
    setEndDate(new Date());
    setReason('');
    setHalfDay(false);
    setShowForm(false);
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
            halfDaySession: halfDay ? 'MORNING' : undefined,
          },
        },
      });
      const errors = result.data?.createTeacherLeaveRequest?.errors ?? [];
      if (errors.length > 0) {
        Alert.alert('Error', errors[0].message);
      } else {
        resetForm();
        refetch();
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : 'Failed to create leave request';
      Alert.alert('Error', msg);
    }
  };

  const renderRequest = ({
    item,
  }: {
    item: (typeof requests)[number];
  }) => {
    const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.PENDING;

    return (
      <View style={styles.requestCard} testID={`leave-item-${item.id}`}>
        <View style={styles.requestHeader}>
          <View
            style={[styles.typeBadge, { backgroundColor: '#E3F2FD' }]}
          >
            <Text style={styles.typeBadgeText}>
              {TYPE_LABELS[item.requestType] ?? item.requestType}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatDate(item.startDate)} — {formatDate(item.endDate)}{' '}
              ({item.daysCount} day{item.daysCount !== 1 ? 's' : ''})
            </Text>
          </View>
          {item.halfDaySession ? (
            <View style={styles.detailRow}>
              <Ionicons name="partly-sunny-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Half day ({item.halfDaySession})</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.reason}</Text>
          </View>
          {item.rejectionReason ? (
            <View style={styles.detailRow}>
              <Ionicons name="alert-circle-outline" size={16} color="#C62828" />
              <Text style={[styles.detailText, { color: '#C62828' }]}>
                Rejection: {item.rejectionReason}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container} testID="teacher-my-leave-screen">
      {/* Balance Card */}
      {balance ? (
        <View style={styles.balanceCard} testID="leave-balance">
          <Text style={styles.balanceTitle}>Leave Balance</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceLabel}>Annual</Text>
              <Text style={styles.balanceValue}>
                {balance.usedAnnual}/{balance.maxAnnualLeave} used
              </Text>
              <Text style={styles.balanceRemaining}>
                {balance.remainingAnnual} remaining
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceLabel}>Sick</Text>
              <Text style={styles.balanceValue}>
                {balance.usedSick}/{balance.maxSickLeave} used
              </Text>
              <Text style={styles.balanceRemaining}>
                {balance.remainingSick} remaining
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceLabel}>Personal</Text>
              <Text style={styles.balanceValue}>
                {balance.usedPersonal} used
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {STATUS_FILTERS.map((f) => {
          const isActive = activeFilter === f.value;
          const testId = f.value ? `filter-${f.value.toLowerCase()}` : 'filter-all';
          return (
            <Pressable
              key={f.label}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => {
                setActiveFilter(f.value);
                refetch({ status: f.value ?? undefined });
              }}
              testID={testId}
            >
              <Text
                style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* New Request Button */}
      <Pressable
        style={styles.newRequestButton}
        onPress={() => setShowForm(true)}
        testID="new-request-btn"
      >
        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
        <Text style={styles.newRequestButtonText}>New Request</Text>
      </Pressable>

      {/* List / Empty State */}
      {requests.length === 0 ? (
        <View style={styles.emptyState} testID="leave-empty-state">
          <Ionicons name="document-outline" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No leave requests</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.list}
          testID="leave-requests-list"
        />
      )}

      {/* New Request Modal */}
      <Modal
        visible={showForm}
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
              {halfDay ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  balanceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEE',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  balanceRemaining: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  filterContainer: {
    flexGrow: 0,
    marginBottom: 12,
  },
  filterContent: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  newRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  newRequestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 16,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1565C0',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
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
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  typePicker: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeOption: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typeOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#444',
  },
  typeOptionTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  halfDayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  toggleBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBoxActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  halfDayLabel: {
    fontSize: 15,
    color: '#444',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
