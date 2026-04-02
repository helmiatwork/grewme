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
  LeaveRequestTypeEnum,
  useCreateLeaveRequestMutation,
  useDeleteLeaveRequestMutation,
  useMyChildrenQuery,
  useParentLeaveRequestsQuery,
} from '../../../../src/graphql/generated/graphql';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FFF3E0', text: '#E65100' },
  APPROVED: { bg: '#E8F5E9', text: '#2E7D32' },
  REJECTED: { bg: '#FFEBEE', text: '#C62828' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function LeaveRequestsScreen() {
  const { data: childrenData, loading: childrenLoading } = useMyChildrenQuery();
  const {
    data: requestsData,
    loading: requestsLoading,
    error: requestsError,
    refetch,
  } = useParentLeaveRequestsQuery();
  const [createLeaveRequest, { loading: creating }] =
    useCreateLeaveRequestMutation();
  const [deleteLeaveRequest] = useDeleteLeaveRequestMutation();

  const [showForm, setShowForm] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<LeaveRequestTypeEnum>(
    LeaveRequestTypeEnum.Sick
  );
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const loading = childrenLoading || requestsLoading;

  if (loading) return <LoadingState />;
  if (requestsError) return <ErrorState message={requestsError.message} />;

  const children = childrenData?.myChildren ?? [];
  const requests = requestsData?.parentLeaveRequests ?? [];

  const resetForm = () => {
    setSelectedChildId(null);
    setRequestType(LeaveRequestTypeEnum.Sick);
    setStartDate(new Date());
    setEndDate(new Date());
    setReason('');
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!selectedChildId) {
      Alert.alert('Error', 'Please select a child');
      return;
    }
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
          studentId: selectedChildId,
          requestType,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          reason: reason.trim(),
        },
      });
      const errors = result.data?.createLeaveRequest?.errors ?? [];
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

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Leave Request',
      'Are you sure you want to delete this leave request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteLeaveRequest({
                variables: { leaveRequestId: id },
              });
              const errors = result.data?.deleteLeaveRequest?.errors ?? [];
              if (errors.length > 0) {
                Alert.alert('Error', errors[0].message);
              } else {
                refetch();
              }
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Failed to delete';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const renderRequest = ({
    item,
  }: {
    item: (typeof requests)[number];
  }) => {
    const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.PENDING;
    const isPending = item.status === LeaveRequestStatusEnum.Pending;

    return (
      <View style={styles.requestCard} testID={`leave-request-${item.id}`}>
        <View style={styles.requestHeader}>
          <Text style={styles.childNameText}>{item.student.name}</Text>
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
              {formatDate(item.startDate)} - {formatDate(item.endDate)} (
              {item.daysCount} day
              {item.daysCount !== 1 ? 's' : ''})
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="medical-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.requestType === LeaveRequestTypeEnum.Sick
                ? 'Sick Leave'
                : 'Excused Absence'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color="#666"
            />
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

        {isPending ? (
          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
            testID={`delete-request-${item.id}`}
          >
            <Ionicons name="trash-outline" size={16} color="#C62828" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container} testID="leave-requests-screen">
      <Pressable
        style={styles.createButton}
        onPress={() => setShowForm(true)}
        testID="new-leave-request-button"
      >
        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>New Leave Request</Text>
      </Pressable>

      {requests.length === 0 ? (
        <View style={styles.emptyState} testID="leave-requests-empty">
          <Ionicons name="document-outline" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No leave requests yet</Text>
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

          <Text style={styles.label}>Child</Text>
          <View style={styles.childPicker}>
            {children.map((child) => (
              <Pressable
                key={child.id}
                style={[
                  styles.childOption,
                  selectedChildId === child.id && styles.childOptionSelected,
                ]}
                onPress={() => setSelectedChildId(child.id)}
                testID={`child-option-${child.id}`}
              >
                <Text
                  style={[
                    styles.childOptionText,
                    selectedChildId === child.id &&
                      styles.childOptionTextSelected,
                  ]}
                >
                  {child.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Type</Text>
          <View style={styles.typePicker}>
            <Pressable
              style={[
                styles.typeOption,
                requestType === LeaveRequestTypeEnum.Sick &&
                  styles.typeOptionSelected,
              ]}
              onPress={() => setRequestType(LeaveRequestTypeEnum.Sick)}
              testID="type-sick"
            >
              <Text
                style={[
                  styles.typeOptionText,
                  requestType === LeaveRequestTypeEnum.Sick &&
                    styles.typeOptionTextSelected,
                ]}
              >
                Sick Leave
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.typeOption,
                requestType === LeaveRequestTypeEnum.Excused &&
                  styles.typeOptionSelected,
              ]}
              onPress={() => setRequestType(LeaveRequestTypeEnum.Excused)}
              testID="type-excused"
            >
              <Text
                style={[
                  styles.typeOptionText,
                  requestType === LeaveRequestTypeEnum.Excused &&
                    styles.typeOptionTextSelected,
                ]}
              >
                Excused
              </Text>
            </Pressable>
          </View>

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
            style={[
              styles.submitButton,
              creating && styles.submitButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={creating}
            testID="submit-leave-request"
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  createButtonText: {
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
  childNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },
  deleteButtonText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
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
  childPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  childOption: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  childOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  childOptionText: {
    fontSize: 15,
    color: '#444',
  },
  childOptionTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  typePicker: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  typeOptionText: {
    fontSize: 15,
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
