import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useClassroomOverviewQuery } from '../../../../src/graphql/generated/graphql';
import { useAuthStore } from '../../../../src/auth/store';
import RadarChart from '../../../../src/components/RadarChart';

export default function ClassOverviewScreen() {
  const activeClassroomId = useAuthStore((s) => s.activeClassroomId);

  // classroomOverview returns ALL students + radar data in ONE call
  // Do NOT call studentRadar per student (N+1)
  const { data, loading, error } = useClassroomOverviewQuery({
    variables: { classroomId: activeClassroomId! },
    skip: !activeClassroomId,
  });

  if (!activeClassroomId) {
    return (
      <View style={styles.centered} testID="no-classroom-state">
        <Text style={styles.emptyText}>
          No classroom selected. Go to Dashboard first.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered} testID="loading-state">
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered} testID="error-state">
        <Text style={styles.errorText}>
          Failed to load class overview: {error.message}
        </Text>
      </View>
    );
  }

  const overview = data?.classroomOverview;
  const students = overview?.students ?? [];

  return (
    <View style={styles.container} testID="class-overview">
      <View style={styles.header}>
        <Text style={styles.classroomName}>
          {overview?.classroomName ?? 'Class Overview'}
        </Text>
        <Text style={styles.subtitle}>{students.length} students</Text>
      </View>

      <FlatList
        testID="students-list"
        data={students}
        keyExtractor={(item) => item.studentId}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No students in this class.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.studentCard}
            testID={`student-card-${item.studentId}`}
            onPress={() =>
              router.push({
                pathname: '/(app)/teacher/behavior',
                params: { studentId: item.studentId },
              })
            }
          >
            <Text style={styles.studentName}>{item.studentName}</Text>
            <RadarChart
              skills={{
                reading: item.skills.reading ?? 0,
                math: item.skills.math ?? 0,
                writing: item.skills.writing ?? 0,
                logic: item.skills.logic ?? 0,
                social: item.skills.social ?? 0,
              }}
              size={120}
            />
          </Pressable>
        )}
      />
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
  columnWrapper: {
    justifyContent: 'space-between',
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
});
