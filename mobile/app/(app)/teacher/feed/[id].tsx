import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ErrorState from '../../../../src/components/ErrorState';
import LoadingState from '../../../../src/components/LoadingState';
import {
  FeedPostDocument,
  useCommentOnFeedPostMutation,
  useFeedPostQuery,
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

export default function FeedPostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [commentBody, setCommentBody] = useState('');

  const { data, loading, error, refetch } = useFeedPostQuery({
    variables: { id: id ?? '' },
    skip: !id,
  });

  const [likeFeedPost] = useLikeFeedPostMutation();
  const [commentOnFeedPost, { loading: commenting }] =
    useCommentOnFeedPostMutation({
      refetchQueries: [{ query: FeedPostDocument, variables: { id } }],
    });

  const handleLike = useCallback(() => {
    if (!id || !post) return;
    likeFeedPost({
      variables: { id },
      optimisticResponse: {
        likeFeedPost: {
          feedPost: {
            __typename: 'FeedPostType',
            id,
            likesCount: post.likedByMe ? post.likesCount - 1 : post.likesCount + 1,
            likedByMe: !post.likedByMe,
          },
        },
      },
    });
  }, [id, post, likeFeedPost]);

  const handleComment = useCallback(async () => {
    const trimmed = commentBody.trim();
    if (!trimmed || !id) return;

    setCommentBody('');
    try {
      const result = await commentOnFeedPost({
        variables: { id, body: trimmed },
      });
      const errors = result.data?.commentOnFeedPost?.errors ?? [];
      if (errors.length > 0) {
        setCommentBody(trimmed);
        Alert.alert('Error', errors[0].message);
      }
    } catch {
      setCommentBody(trimmed);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    }
  }, [commentBody, id, commentOnFeedPost]);

  if (loading) {
    return <LoadingState message="Loading post..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || 'Failed to load post'}
        onRetry={() => refetch()}
      />
    );
  }

  const post = data?.feedPost;
  if (!post) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
      testID="feed-post-detail"
    >
      <FlatList
        data={post.comments}
        keyExtractor={(item) => item.id}
        testID="comments-list"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.postSection}>
            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {post.teacher.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.teacherName}>{post.teacher.name}</Text>
                <Text style={styles.meta}>
                  {post.classroom.name} · {timeAgo(post.createdAt)}
                </Text>
              </View>
            </View>

            <Text style={styles.body}>{post.body}</Text>

            {post.taggedStudents.length > 0 ? (
              <View style={styles.tagRow}>
                <Ionicons name="people-outline" size={14} color="#4CAF50" />
                <Text style={styles.tagText}>
                  {post.taggedStudents.map((s) => s.name).join(', ')}
                </Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                style={styles.actionButton}
                onPress={handleLike}
                testID="like-button"
              >
                <Ionicons
                  name={post.likedByMe ? 'heart' : 'heart-outline'}
                  size={20}
                  color={post.likedByMe ? '#F44336' : '#666'}
                />
                <Text
                  style={[
                    styles.actionText,
                    post.likedByMe && styles.actionTextActive,
                  ]}
                >
                  {post.likesCount} like{post.likesCount !== 1 ? 's' : ''}
                </Text>
              </Pressable>
              <View style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={18} color="#666" />
                <Text style={styles.actionText}>
                  {post.commentsCount} comment
                  {post.commentsCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <Text style={styles.commentsTitle}>Comments</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.noComments} testID="no-comments">
            No comments yet. Be the first to comment!
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.comment} testID={`comment-${item.id}`}>
            <View style={styles.commentHeader}>
              <Text style={styles.commenterName}>{item.commenterName}</Text>
              <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.commentBody}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={commentBody}
          onChangeText={setCommentBody}
          placeholder="Write a comment..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          testID="comment-input"
        />
        <Pressable
          style={[
            styles.sendButton,
            (!commentBody.trim() || commenting) && styles.sendButtonDisabled,
          ]}
          onPress={handleComment}
          disabled={!commentBody.trim() || commenting}
          testID="send-comment-button"
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  postSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  meta: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  body: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  tagText: {
    fontSize: 13,
    color: '#4CAF50',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
  actionTextActive: {
    color: '#F44336',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  noComments: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  comment: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commenterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 11,
    color: '#999',
  },
  commentBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 80,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
