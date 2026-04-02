import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../../../src/components/ErrorState';
import LoadingState from '../../../../src/components/LoadingState';
import { useConversationsQuery } from '../../../../src/graphql/generated/graphql';

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

export default function ConversationsScreen() {
  const { data, loading, error, refetch } = useConversationsQuery();

  if (loading) {
    return <LoadingState message="Loading conversations..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || 'Failed to load conversations'}
        onRetry={() => refetch()}
      />
    );
  }

  const conversations = data?.conversations ?? [];

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="conversations-empty">
        <Text style={styles.emptyText}>No conversations yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="conversations-screen">
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        testID="conversations-list"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            testID={`conversation-${item.id}`}
            onPress={() => router.push(`/(app)/parent/messages/${item.id}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.teacher.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardRow}>
                <Text style={styles.teacherName} numberOfLines={1}>
                  {item.teacher.name}
                </Text>
                {item.lastMessage ? (
                  <Text style={styles.timestamp}>
                    {timeAgo(item.lastMessage.createdAt)}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.studentLabel} numberOfLines={1}>
                Re: {item.student.name}
              </Text>
              {item.lastMessage ? (
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage.mine
                    ? `You: ${item.lastMessage.body}`
                    : item.lastMessage.body}
                </Text>
              ) : (
                <Text style={styles.preview}>No messages yet</Text>
              )}
            </View>
            {item.unreadCount > 0 ? (
              <View style={styles.badge} testID={`unread-${item.id}`}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            ) : null}
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
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
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
  cardContent: {
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  studentLabel: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 1,
  },
  preview: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
