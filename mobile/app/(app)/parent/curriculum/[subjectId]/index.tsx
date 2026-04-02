import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../../../../src/components/ErrorState';
import LoadingState from '../../../../../src/components/LoadingState';
import { useSubjectQuery } from '../../../../../src/graphql/generated/graphql';

export default function SubjectTopicsScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();

  const { data, loading, error, refetch } = useSubjectQuery({
    variables: { id: subjectId ?? '' },
    skip: !subjectId,
  });

  if (loading) {
    return <LoadingState message="Loading topics..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || 'Failed to load subject'}
        onRetry={() => refetch()}
      />
    );
  }

  const subject = data?.subject;

  if (!subject) {
    return (
      <View style={styles.emptyContainer} testID="subject-not-found">
        <Text style={styles.emptyText}>Subject not found</Text>
      </View>
    );
  }

  const topics = subject.topics ?? [];

  return (
    <View style={styles.container} testID="subject-topics-screen">
      <View style={styles.headerSection}>
        <Text style={styles.header}>{subject.name}</Text>
        {subject.description ? (
          <Text style={styles.description}>{subject.description}</Text>
        ) : null}
      </View>

      {topics.length === 0 ? (
        <View style={styles.emptyContainer} testID="topics-empty">
          <Text style={styles.emptyText}>No topics yet</Text>
        </View>
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(item) => item.id}
          testID="topics-list"
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              testID={`topic-card-${item.id}`}
              onPress={() =>
                router.push(`/(app)/parent/curriculum/${subjectId}/${item.id}`)
              }
            >
              <View style={styles.cardContent}>
                <Text style={styles.topicName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.topicDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.loCount}>
                  {item.learningObjectives?.length ?? 0} LO
                  {(item.learningObjectives?.length ?? 0) === 1 ? '' : 's'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#CCC" />
              </View>
            </Pressable>
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
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  topicName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  topicDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loCount: {
    fontSize: 12,
    color: '#999',
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
