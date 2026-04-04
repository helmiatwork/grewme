import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import RadarChart from '../../../src/components/RadarChart';
import ErrorState from '../../../src/components/ErrorState';
import {
  useMyChildrenQuery,
  useStudentRadarQuery,
} from '../../../src/graphql/generated/graphql';

// Per-child card: fetches its own radar data.
// N+1 note: parents have at most 1-3 children — individual queries are acceptable here.
function ChildCard({ id, name }: { id: string; name: string }) {
  const { data, loading } = useStudentRadarQuery({
    variables: { studentId: id },
  });

  const skills = data?.studentRadar?.skills;

  return (
    <Pressable
      style={styles.card}
      testID={`child-card-${id}`}
      onPress={() => router.push(`/(app)/parent/children/${id}/radar`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.childName}>{name}</Text>
          <Text style={styles.cardSubtext}>Tap to view details</Text>
        </View>
      </View>

      <View style={styles.radarContainer}>
        {loading ? (
          <ActivityIndicator size="small" color="#4CAF50" />
        ) : skills ? (
          <RadarChart skills={skills} size={120} />
        ) : (
          <Text style={styles.noDataText}>No skill data yet</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function ParentDashboardScreen() {
  const { data, loading, error, refetch } = useMyChildrenQuery();

  if (loading) {
    return (
      <View style={styles.centered} testID="loading-state">
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading children...</Text>
      </View>
    );
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

  return (
    <View style={styles.container} testID="parent-dashboard">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Your children's skill overview</Text>
      </View>

      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No children found.</Text>
          </View>
        }
        renderItem={({ item }) => <ChildCard id={item.id} name={item.name} />}
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  cardInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  cardSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
  },
  noDataText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
