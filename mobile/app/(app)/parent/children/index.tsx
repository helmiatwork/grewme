import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../../../src/components/ErrorState';
import LoadingState from '../../../../src/components/LoadingState';
import { useMyChildrenQuery } from '../../../../src/graphql/generated/graphql';

export default function ChildrenListScreen() {
  const { data, loading, error, refetch } = useMyChildrenQuery();

  if (loading) {
    return <LoadingState message="Loading children..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || 'Failed to load children'}
        onRetry={() => refetch()}
      />
    );
  }

  const children = data?.myChildren ?? [];

  if (children.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="children-empty">
        <Text style={styles.emptyText}>No children found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="children-list-screen">
      <Text style={styles.header}>My Children</Text>
      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        testID="children-list"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            testID={`child-card-${item.id}`}
            onPress={() =>
              router.push(`/(app)/parent/children/${item.id}/radar`)
            }
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.childName}>{item.name}</Text>
              <Text style={styles.cardSubtext}>Tap to view skills</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
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
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: '#CCC',
    fontWeight: '600',
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
