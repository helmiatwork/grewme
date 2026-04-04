import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ErrorState from '../../../../src/components/ErrorState';
import LoadingState from '../../../../src/components/LoadingState';
import {
  type LeaveRequestStatusEnum,
  useMyTeacherLeaveBalanceQuery,
  useMyTeacherLeaveRequestsQuery,
} from '../../../../src/graphql/generated/graphql';
import CreateLeaveModal from './CreateLeaveModal';
import { STATUS_COLORS, STATUS_FILTERS, formatDate } from './shared';

const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  PERSONAL: 'Personal Leave',
};

export default function MyLeaveTab() {
  const [activeFilter, setActiveFilter] =
    useState<LeaveRequestStatusEnum | null>(null);

  const {
    data: requestsData,
    loading: requestsLoading,
    error: requestsError,
    refetch,
  } = useMyTeacherLeaveRequestsQuery({
    variables: { status: activeFilter ?? undefined },
  });

  const { data: balanceData, loading: balanceLoading } =
    useMyTeacherLeaveBalanceQuery();

  const [showForm, setShowForm] = useState(false);

  const loading = requestsLoading || balanceLoading;

  if (loading) return <LoadingState />;
  if (requestsError) return <ErrorState message={requestsError.message} />;

  const requests = requestsData?.myTeacherLeaveRequests ?? [];
  const balance = balanceData?.myTeacherLeaveBalance;

  const renderRequest = ({
    item,
  }: {
    item: (typeof requests)[number];
  }) => {
    const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.PENDING;

    return (
      <View style={styles.requestCard} testID={`leave-item-${item.id}`}>
        <View style={styles.requestHeader}>
          <View style={[styles.typeBadge, { backgroundColor: '#E3F2FD' }]}>
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
              {formatDate(item.startDate)} — {formatDate(item.endDate)} (
              {item.daysCount} day{item.daysCount !== 1 ? 's' : ''})
            </Text>
          </View>
          {item.halfDaySession ? (
            <View style={styles.detailRow}>
              <Ionicons name="partly-sunny-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                Half day ({item.halfDaySession})
              </Text>
            </View>
          ) : null}
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
      </View>
    );
  };

  return (
    <View style={styles.container} testID="teacher-my-leave-tab">
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
          const testId = f.value
            ? `filter-${f.value.toLowerCase()}`
            : 'filter-all';
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
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
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
      <CreateLeaveModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onCreated={() => {
          setShowForm(false);
          refetch();
        }}
      />
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
});
