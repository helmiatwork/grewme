import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../../../../src/components/ErrorState';
import LoadingState from '../../../../../src/components/LoadingState';
import {
  type AttendanceStatusEnum,
  useStudentAttendanceQuery,
} from '../../../../../src/graphql/generated/graphql';

interface AttendanceScreenProps {
  id: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PRESENT: { bg: '#E8F5E9', text: '#2E7D32' },
  SICK: { bg: '#FFF3E0', text: '#E65100' },
  EXCUSED: { bg: '#E3F2FD', text: '#1565C0' },
  UNEXCUSED: { bg: '#FFEBEE', text: '#C62828' },
};

function formatStatus(status: AttendanceStatusEnum): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatusEnum;
  notes?: string | null;
  classroom: { id: string; name: string };
}

export default function AttendanceScreen({ id }: AttendanceScreenProps) {
  const { data, loading, error, refetch } = useStudentAttendanceQuery({
    variables: { studentId: id },
    skip: !id,
  });

  const records = data?.studentAttendance ?? [];

  if (loading && records.length === 0) {
    return <LoadingState message="Loading attendance..." />;
  }

  if (error && records.length === 0) {
    return (
      <ErrorState
        message={error.message || 'Failed to load attendance'}
        onRetry={() => refetch()}
      />
    );
  }

  if (records.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="attendance-empty">
        <Text style={styles.emptyText}>No attendance records available</Text>
      </View>
    );
  }

  const totalDays = records.length;
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const attendanceRate =
    totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
  const absenceCount = totalDays - presentCount;

  const renderItem = ({ item }: { item: AttendanceRecord }) => {
    const colors = STATUS_COLORS[item.status] ?? {
      bg: '#F5F5F5',
      text: '#666',
    };

    return (
      <View style={styles.card} testID={`attendance-item-${item.id}`}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {formatStatus(item.status)}
            </Text>
          </View>
          <Text style={styles.classroomText}>{item.classroom.name}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container} testID="attendance-screen">
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalDays}</Text>
          <Text style={styles.summaryLabel}>Total Days</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{attendanceRate}%</Text>
          <Text style={styles.summaryLabel}>Rate</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{absenceCount}</Text>
          <Text style={styles.summaryLabel}>Absences</Text>
        </View>
      </View>
      <FlatList
        data={records as AttendanceRecord[]}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        testID="attendance-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  classroomText: {
    fontSize: 12,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
