import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ErrorState from '../../../../src/components/ErrorState';
import LoadingState from '../../../../src/components/LoadingState';
import {
  useFeedPostsQuery,
  useLikeFeedPostMutation,
} from '../../../../src/graphql/generated/graphql';

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FeedScreen() {
  const { data, loading, error, refetch, fetchMore } = useFeedPostsQuery({
    variables: { first: 20 },
  });

  const [likeFeedPost] = useLikeFeedPostMutation();

  const handleLike = useCallback(
    (postId: string, currentLiked: boolean, currentCount: number) => {
      likeFeedPost({
        variables: { id: postId },
        optimisticResponse: {
          likeFeedPost: {
            feedPost: {
              __typename: 'FeedPostType',
              id: postId,
              likesCount: currentLiked ? currentCount - 1 : currentCount + 1,
              likedByMe: !currentLiked,
            },
          },
        },
      });
    },
    [likeFeedPost]
  );

  const handleLoadMore = useCallback(() => {
    const pageInfo = data?.feedPosts?.pageInfo;
    if (!pageInfo?.hasNextPage) return;
    fetchMore({
      variables: { after: pageInfo.endCursor, first: 20 },
    });
  }, [data, fetchMore]);

  if (loading && !data) {
    return <LoadingState message="Loading feed..." />;
  }

  if (error && !data) {
    return (
      <ErrorState
        message={error.message || 'Failed to load feed'}
        onRetry={() => refetch()}
      />
    );
  }

  const posts = data?.feedPosts?.nodes ?? [];

  return (
    <View style={styles.container} testID="teacher-feed-screen">
      <Pressable
        style={styles.createButton}
        onPress={() => router.push('/(app)/teacher/feed/new')}
        testID="new-post-button"
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.createButtonText}>New Post</Text>
      </Pressable>

      {posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="newspaper-outline" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No posts yet</Text>
          <Text style={styles.emptySubtext}>
            Share updates with parents by creating a post
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          testID="feed-list"
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={loading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              testID={`post-${item.id}`}
              onPress={() => router.push(`/(app)/teacher/feed/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.teacher.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.teacherName}>{item.teacher.name}</Text>
                  <Text style={styles.meta}>
                    {item.classroom.name} · {timeAgo(item.createdAt)}
                  </Text>
                </View>
              </View>

              <Text style={styles.body} numberOfLines={4}>
                {item.body}
              </Text>

              {item.taggedStudents.length > 0 ? (
                <View style={styles.tagRow}>
                  <Ionicons name="people-outline" size={14} color="#4CAF50" />
                  <Text style={styles.tagText}>
                    {item.taggedStudents.map((s) => s.name).join(', ')}
                  </Text>
                </View>
              ) : null}

              {item.mediaUrls.length > 0 ? (
                <View style={styles.mediaIndicator}>
                  <Ionicons name="image-outline" size={14} color="#666" />
                  <Text style={styles.mediaText}>
                    {item.mediaUrls.length} attachment
                    {item.mediaUrls.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleLike(item.id, item.likedByMe, item.likesCount)}
                  testID={`like-${item.id}`}
                >
                  <Ionicons
                    name={item.likedByMe ? 'heart' : 'heart-outline'}
                    size={18}
                    color={item.likedByMe ? '#F44336' : '#666'}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      item.likedByMe && styles.actionTextActive,
                    ]}
                  >
                    {item.likesCount}
                  </Text>
                </Pressable>
                <View style={styles.actionButton}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.actionText}>{item.commentsCount}</Text>
                </View>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  meta: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  body: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  mediaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  mediaText: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#666',
  },
  actionTextActive: {
    color: '#F44336',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});
