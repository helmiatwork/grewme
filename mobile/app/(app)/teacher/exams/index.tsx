import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  useClassroomExamsQuery,
  type ClassroomExamStatusEnum,
} from '../../../../src/graphql/generated/graphql';
import { useAuthStore } from '../../../../src/auth/store';
import LoadingState from '../../../../src/components/LoadingState';
import ErrorState from '../../../../src/components/ErrorState';

const STATUS_FILTERS: Array<{
  label: string;
  value: ClassroomExamStatusEnum | null;
}> = [
  { label: 'All', value: null },
  { label: 'Active', value: 'ACTIVE' as ClassroomExamStatusEnum },
  { label: 'Draft', value: 'DRAFT' as ClassroomExamStatusEnum },
  { label: 'Closed', value: 'CLOSED' as ClassroomExamStatusEnum },
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return '#4CAF50';
    case 'DRAFT':
      return '#FF9800';
    case 'CLOSED':
      return '#9E9E9E';
    default:
      return '#666';
  }
}

export default function TeacherExamsListScreen() {
  const activeClassroomId = useAuthStore((s) => s.activeClassroomId);
  const [statusFilter, setStatusFilter] =
    useState<ClassroomExamStatusEnum | null>(null);

  const { data, loading, error, refetch } = useClassroomExamsQuery({
    variables: {
      classroomId: activeClassroomId ?? '',
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    skip: !activeClassroomId,
  });

  const classroomExams = data?.classroomExams ?? [];

  if (!activeClassroomId) {
    return (
      <View style={styles.container} testID="exams-no-classroom">
        <Text style={styles.emptyText}>
          Select a classroom to view exams.
        </Text>
      </View>
    );
  }

  if (loading) return <LoadingState message="Loading exams..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <View style={styles.container} testID="exams-list-screen">
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.label}
            style={[
              styles.filterChip,
              statusFilter === f.value && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(f.value)}
            testID={`filter-${f.label.toLowerCase()}`}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === f.value && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.createButton}
        onPress={() => router.push('/(app)/teacher/exams/new')}
        testID="create-exam-button"
      >
        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create Exam</Text>
      </Pressable>

      <FlatList
        data={classroomExams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        testID="exams-list"
        renderItem={({ item }) => {
          const submittedCount = item.examSubmissions.filter(
            (s) => s.status === 'SUBMITTED' || s.status === 'GRADED',
          ).length;
          const gradedCount = item.examSubmissions.filter(
            (s) => s.status === 'GRADED',
          ).length;
          const totalSubmissions = item.examSubmissions.length;

          return (
            <Pressable
              style={styles.examCard}
              onPress={() =>
                router.push(`/(app)/teacher/exams/${item.exam.id}`)
              }
              testID={`exam-card-${item.id}`}
            >
              <View style={styles.examCardHeader}>
                <Text style={styles.examTitle} numberOfLines={1}>
                  {item.exam.title}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColor(item.status) },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
              </View>

              {item.exam.description ? (
                <Text style={styles.examDescription} numberOfLines={2}>
                  {item.exam.description}
                </Text>
              ) : null}

              <View style={styles.examMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color="#888" />
                  <Text style={styles.metaText}>
                    {item.scheduledAt
                      ? formatDate(item.scheduledAt)
                      : 'No date'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="document-text-outline" size={14} color="#888" />
                  <Text style={styles.metaText}>
                    {item.exam.examType.replaceAll('_', ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.submissionStats}>
                <Text style={styles.statText}>
                  {submittedCount}/{totalSubmissions} submitted
                </Text>
                <Text style={styles.statSeparator}>|</Text>
                <Text style={styles.statText}>
                  {gradedCount}/{totalSubmissions} graded
                </Text>
              </View>

              {item.dueAt ? (
                <Text style={styles.dueDate}>
                  Due: {formatDate(item.dueAt)}
                </Text>
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer} testID="exams-empty">
            <Ionicons name="document-text-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No exams found</Text>
            <Text style={styles.emptySubtext}>
              Create an exam to get started
            </Text>
          </View>
        }
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
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#4CAF50',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  examCard: {
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
  examCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  examDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  examMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  submissionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statSeparator: {
    color: '#CCC',
    fontSize: 12,
  },
  dueDate: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#AAA',
    fontSize: 14,
    marginTop: 4,
  },
});
