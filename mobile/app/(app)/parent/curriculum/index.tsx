import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../../../src/components/ErrorState';
import LoadingState from '../../../../src/components/LoadingState';
import {
  useMyChildrenWithSchoolQuery,
  useSubjectsQuery,
} from '../../../../src/graphql/generated/graphql';

export default function SubjectsListScreen() {
  const {
    data: childrenData,
    loading: childrenLoading,
    error: childrenError,
    refetch: refetchChildren,
  } = useMyChildrenWithSchoolQuery();

  const schoolId =
    childrenData?.myChildren?.[0]?.classrooms?.[0]?.school?.id ?? null;

  const {
    data: subjectsData,
    loading: subjectsLoading,
    error: subjectsError,
    refetch: refetchSubjects,
  } = useSubjectsQuery({
    variables: { schoolId: schoolId ?? '' },
    skip: !schoolId,
  });

  const loading = childrenLoading || subjectsLoading;
  const error = childrenError || subjectsError;

  if (loading) {
    return <LoadingState message="Loading subjects..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || 'Failed to load curriculum'}
        onRetry={() => {
          refetchChildren();
          if (schoolId) {
            refetchSubjects();
          }
        }}
      />
    );
  }

  if (!schoolId) {
    return (
      <View style={styles.emptyContainer} testID="curriculum-no-school">
        <Ionicons name="school-outline" size={48} color="#CCC" />
        <Text style={styles.emptyTitle}>No school found</Text>
        <Text style={styles.emptyHint}>
          Your children must be enrolled in a school to view the curriculum.
        </Text>
      </View>
    );
  }

  const subjects = subjectsData?.subjects ?? [];

  if (subjects.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="curriculum-empty">
        <Ionicons name="book-outline" size={48} color="#CCC" />
        <Text style={styles.emptyTitle}>No subjects yet</Text>
        <Text style={styles.emptyHint}>
          Subjects will appear once the school adds them.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="subjects-list-screen">
      <View style={styles.headerRow}>
        <Text style={styles.header}>Curriculum</Text>
        <Pressable
          testID="yearly-curriculum-link"
          onPress={() => router.push('/(app)/parent/curriculum/yearly')}
        >
          <Text style={styles.yearlyLink}>Yearly Overview</Text>
        </Pressable>
      </View>
      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        testID="subjects-list"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            testID={`subject-card-${item.id}`}
            onPress={() => router.push(`/(app)/parent/curriculum/${item.id}`)}
          >
            <View style={styles.cardContent}>
              <Text style={styles.subjectName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={styles.topicCount}>
                {item.topics?.length ?? 0}{' '}
                {(item.topics?.length ?? 0) === 1 ? 'topic' : 'topics'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  yearlyLink: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  topicCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});
