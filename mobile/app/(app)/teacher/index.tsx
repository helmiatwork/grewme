import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useClassroomsQuery,
  useClassroomBehaviorTodayQuery,
} from '../../../src/graphql/generated/graphql';
import { useAuthStore } from '../../../src/auth/store';

export default function TeacherDashboardScreen() {
  const activeClassroomId = useAuthStore((s) => s.activeClassroomId);
  const setActiveClassroomId = useAuthStore((s) => s.setActiveClassroomId);
  const setActiveSchoolId = useAuthStore((s) => s.setActiveSchoolId);

  const {
    data: classroomsData,
    loading: classroomsLoading,
    error: classroomsError,
  } = useClassroomsQuery();

  useEffect(() => {
    const classrooms = classroomsData?.classrooms;
    if (classrooms && classrooms.length > 0 && !activeClassroomId) {
      setActiveClassroomId(classrooms[0].id);
      setActiveSchoolId(classrooms[0].school.id);
    }
  }, [
    classroomsData,
    activeClassroomId,
    setActiveClassroomId,
    setActiveSchoolId,
  ]);

  const {
    data: behaviorData,
    loading: behaviorLoading,
    error: behaviorError,
  } = useClassroomBehaviorTodayQuery({
    variables: { classroomId: activeClassroomId! },
    skip: !activeClassroomId,
  });

  if (classroomsLoading) {
    return (
      <View style={styles.centered} testID="loading-state">
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading classrooms...</Text>
      </View>
    );
  }

  if (classroomsError) {
    return (
      <View style={styles.centered} testID="error-state">
        <Text style={styles.errorText}>
          Failed to load classrooms: {classroomsError.message}
        </Text>
      </View>
    );
  }

  if (behaviorError) {
    return (
      <View style={styles.centered} testID="error-state">
        <Text style={styles.errorText}>
          Failed to load behavior data: {behaviorError.message}
        </Text>
      </View>
    );
  }

  const classrooms = classroomsData?.classrooms ?? [];
  const activeClassroom = classrooms.find((c) => c.id === activeClassroomId);
  const behaviorStudents = behaviorData?.classroomBehaviorToday ?? [];

  return (
    <View style={styles.container} testID="teacher-dashboard">
      <View style={styles.header}>
        <Text style={styles.classroomName} testID="classroom-name">
          {activeClassroom?.name ?? 'No Classroom'}
        </Text>
        <Text style={styles.subtitle}>Today's Behavior Summary</Text>
      </View>

      {behaviorLoading ? (
        <View style={styles.centered} testID="behavior-loading">
          <ActivityIndicator size="small" color="#4CAF50" />
        </View>
      ) : (
        <FlatList
          testID="behavior-list"
          data={behaviorStudents}
          keyExtractor={(item) => item.student.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                No behavior data for today yet.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.studentRow} testID={`student-row-${item.student.id}`}>
              <View style={styles.studentHeader}>
                <Text style={styles.studentName}>{item.student.name}</Text>
                <Text style={styles.totalPoints} testID={`total-points-${item.student.id}`}>
                  {item.totalPoints} pts
                </Text>
              </View>

              <View style={styles.badgeRow}>
                <View style={[styles.badge, styles.positiveBadge]}>
                  <Text style={styles.badgeText}>
                    +{item.positiveCount}
                  </Text>
                </View>
                <View style={[styles.badge, styles.negativeBadge]}>
                  <Text style={styles.badgeText}>
                    -{item.negativeCount}
                  </Text>
                </View>
              </View>

              {item.recentPoints.length > 0 && (
                <View style={styles.recentSection}>
                  <Text style={styles.recentLabel}>Recent:</Text>
                  {item.recentPoints.map((point) => (
                    <View key={point.id} style={styles.recentPoint}>
                      <Text
                        style={[
                          styles.recentPointText,
                          point.behaviorCategory.isPositive
                            ? styles.positiveText
                            : styles.negativeText,
                        ]}
                      >
                        {point.behaviorCategory.isPositive ? '+' : ''}
                        {point.pointValue} {point.behaviorCategory.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        />
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
  },
  classroomName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  },
  studentRow: {
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
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  positiveBadge: {
    backgroundColor: '#E8F5E9',
  },
  negativeBadge: {
    backgroundColor: '#FFEBEE',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recentSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  recentLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  recentPoint: {
    marginTop: 2,
  },
  recentPointText: {
    fontSize: 13,
  },
  positiveText: {
    color: '#388E3C',
  },
  negativeText: {
    color: '#D32F2F',
  },
});
