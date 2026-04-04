import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
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
  type TeacherStudentLeaveRequestsQuery,
  useReviewLeaveRequestMutation,
  useTeacherStudentLeaveRequestsQuery,
} from '../../../../src/graphql/generated/graphql';
import {
  STATUS_COLORS,
  STATUS_FILTERS,
  formatDate,
  sharedStyles,
} from './shared';

const TYPE_LABELS: Record<string, string> = {
  EXCUSED: 'Excused',
  SICK: 'Sick Leave',
};

type LeaveRequest = TeacherStudentLeaveRequestsQuery['leaveRequests'][number];

export default function StudentLeaveTab() {
  const [activeFilter, setActiveFilter] =
    useState<LeaveRequestStatusEnum | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, loading, error, refetch } = useTeacherStudentLeaveRequestsQuery(
    {
      variables: { status: activeFilter ?? undefined },
    }
  );

  const [reviewLeaveRequest, { loading: reviewing }] =
    useReviewLeaveRequestMutation();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  const requests = data?.leaveRequests ?? [];

  const handleApprove = (item: LeaveRequest) => {
    Alert.alert(
      'Approve Leave Request',
      `Approve leave for ${item.student.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              const result = await reviewLeaveRequest({
                variables: {
                  leaveRequestId: item.id,
                  decision: LeaveRequestStatusEnum.Approved,
                },
                refetchQueries: ['TeacherStudentLeaveRequests'],
              });
              const errors = result.data?.reviewLeaveRequest?.errors ?? [];
              if (errors.length > 0) {
                Alert.alert('Error', errors[0].message);
              }
            } catch (e: unknown) {
              const msg =
                e instanceof Error ? e.message : 'Failed to approve request';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const handleReject = (item: LeaveRequest) => {
    setRejectTarget(item);
    setRejectionReason('');
  };

  const handleSubmitReject = async () => {
    if (!rejectTarget || !rejectionReason.trim()) {
      Alert.alert('Error', 'A rejection reason is required');
      return;
    }
    try {
      const result = await reviewLeaveRequest({
        variables: {
          leaveRequestId: rejectTarget.id,
          decision: LeaveRequestStatusEnum.Rejected,
          rejectionReason: rejectionReason.trim(),
        },
        refetchQueries: ['TeacherStudentLeaveRequests'],
      });
      const errors = result.data?.reviewLeaveRequest?.errors ?? [];
      if (errors.length > 0) {
        Alert.alert('Error', errors[0].message);
      } else {
        setRejectTarget(null);
        setRejectionReason('');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to reject request';
      Alert.alert('Error', msg);
    }
  };

  const renderRequest = ({ item }: { item: LeaveRequest }) => {
    const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.PENDING;
    const isPending = item.status === LeaveRequestStatusEnum.Pending;

    return (
      <View style={s.requestCard} testID={`student-leave-item-${item.id}`}>
        <View style={s.requestHeader}>
          <View style={[s.typeBadge, { backgroundColor: '#E3F2FD' }]}>
            <Text style={s.typeBadgeText}>
              {TYPE_LABELS[item.requestType] ?? item.requestType}
            </Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[s.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={s.requestDetails}>
          <View style={s.detailRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={s.detailText}>
              <Text style={styles.bold}>{item.student.name}</Text>
              {' · Parent: '}
              {item.parent.name}
            </Text>
          </View>
          <View style={s.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={s.detailText}>
              {formatDate(item.startDate)} — {formatDate(item.endDate)} (
              {item.daysCount} day{item.daysCount !== 1 ? 's' : ''})
            </Text>
          </View>
          <View style={s.detailRow}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color="#666"
            />
            <Text style={s.detailText}>{item.reason}</Text>
          </View>
          {item.rejectionReason ? (
            <View style={s.detailRow}>
              <Ionicons name="alert-circle-outline" size={16} color="#C62828" />
              <Text style={[s.detailText, { color: '#C62828' }]}>
                Rejection: {item.rejectionReason}
              </Text>
            </View>
          ) : null}
        </View>

        {isPending ? (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(item)}
              disabled={reviewing}
              testID={`approve-btn-${item.id}`}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>Approve</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item)}
              disabled={reviewing}
              testID={`reject-btn-${item.id}`}
            >
              <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={s.container} testID="student-leave-tab">
      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterContainer}
        contentContainerStyle={s.filterContent}
      >
        {STATUS_FILTERS.map((f) => {
          const isActive = activeFilter === f.value;
          const testId = f.value
            ? `student-filter-${f.value.toLowerCase()}`
            : 'student-filter-all';
          return (
            <Pressable
              key={f.label}
              style={[s.filterChip, isActive && s.filterChipActive]}
              onPress={() => {
                setActiveFilter(f.value);
                refetch({ status: f.value ?? undefined });
              }}
              testID={testId}
            >
              <Text
                style={[s.filterChipText, isActive && s.filterChipTextActive]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List / Empty State */}
      {requests.length === 0 ? (
        <View style={s.emptyState} testID="student-leave-empty-state">
          <Ionicons name="document-outline" size={48} color="#CCC" />
          <Text style={s.emptyText}>No student leave requests</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={s.list}
          testID="student-leave-requests-list"
        />
      )}

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectTarget !== null}
        transparent
        animationType="fade"
        testID="reject-modal"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Leave Request</Text>
            <Text style={styles.modalSubtitle}>
              {rejectTarget
                ? `Reason for rejecting ${rejectTarget.student.name}'s request:`
                : ''}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
              testID="rejection-reason-input"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => {
                  setRejectTarget(null);
                  setRejectionReason('');
                }}
                testID="reject-cancel-btn"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalRejectBtn, reviewing && styles.disabledBtn]}
                onPress={handleSubmitReject}
                disabled={reviewing}
                testID="reject-submit-btn"
              >
                <Text style={styles.modalRejectText}>
                  {reviewing ? 'Rejecting...' : 'Reject'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = sharedStyles;

const styles = StyleSheet.create({
  bold: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#C62828',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modalRejectBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#C62828',
  },
  modalRejectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
