import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ErrorState from '../../../../../src/components/ErrorState';
import LoadingState from '../../../../../src/components/LoadingState';
import {
  type SkillCategoryEnum,
  useStudentDailyScoresQuery,
} from '../../../../../src/graphql/generated/graphql';

interface HistoryScreenProps {
  id: string;
}

const SKILL_COLORS: Record<string, string> = {
  READING: '#4CAF50',
  MATH: '#2196F3',
  WRITING: '#FF9800',
  LOGIC: '#9C27B0',
  SOCIAL: '#F44336',
};

function formatCategory(category: SkillCategoryEnum): string {
  return category.charAt(0) + category.slice(1).toLowerCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface ScoreNode {
  id: string;
  date: string;
  skillCategory: SkillCategoryEnum;
  score: number;
  notes?: string | null;
}

const PAGE_SIZE = 20;

export default function HistoryScreen({ id }: HistoryScreenProps) {
  const { data, loading, error, refetch, fetchMore } =
    useStudentDailyScoresQuery({
      variables: { studentId: id, first: PAGE_SIZE },
      skip: !id,
    });

  const edges = data?.studentDailyScores?.edges ?? [];
  const pageInfo = data?.studentDailyScores?.pageInfo;
  const hasNextPage = pageInfo?.hasNextPage ?? false;

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || !pageInfo?.endCursor) return;
    fetchMore({
      variables: {
        after: pageInfo.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...prev,
          studentDailyScores: {
            ...fetchMoreResult.studentDailyScores,
            edges: [
              ...prev.studentDailyScores.edges,
              ...fetchMoreResult.studentDailyScores.edges,
            ],
          },
        };
      },
    });
  }, [hasNextPage, pageInfo?.endCursor, fetchMore]);

  if (loading && edges.length === 0) {
    return <LoadingState message="Loading history..." />;
  }

  if (error && edges.length === 0) {
    return (
      <ErrorState
        message={error.message || 'Failed to load score history'}
        onRetry={() => refetch()}
      />
    );
  }

  if (edges.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="history-empty">
        <Text style={styles.emptyText}>No score history available</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: { node: ScoreNode } }) => {
    const { node } = item;
    const categoryColor = SKILL_COLORS[node.skillCategory] ?? '#666';

    return (
      <View style={styles.card} testID={`history-item-${node.id}`}>
        <View style={styles.cardHeader}>
          <View
            style={[styles.categoryBadge, { backgroundColor: categoryColor }]}
          >
            <Text style={styles.categoryText}>
              {formatCategory(node.skillCategory)}
            </Text>
          </View>
          <Text style={styles.scoreText}>{node.score}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(node.date)}</Text>
        {node.notes ? <Text style={styles.notesText}>{node.notes}</Text> : null}
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasNextPage) return null;
    return (
      <Pressable
        style={styles.loadMoreButton}
        onPress={handleLoadMore}
        testID="load-more-button"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.loadMoreText}>Load More</Text>
        )}
      </Pressable>
    );
  };

  return (
    <FlatList
      data={edges}
      renderItem={renderItem}
      keyExtractor={(item) => item.node.id}
      contentContainerStyle={styles.listContainer}
      ListFooterComponent={renderFooter}
      testID="history-list"
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
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
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
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
  loadMoreButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
