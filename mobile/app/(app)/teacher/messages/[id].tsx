import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
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
  ConversationDocument,
  useConversationQuery,
  useSendMessageMutation,
} from '../../../../src/graphql/generated/graphql';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TeacherConversationChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [body, setBody] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data, loading, error, refetch } = useConversationQuery({
    variables: { id: id ?? '' },
    skip: !id,
  });

  const [sendMessage, { loading: sending }] = useSendMessageMutation({
    refetchQueries: [{ query: ConversationDocument, variables: { id } }],
  });

  const handleSend = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed || !id) return;

    setBody('');
    await sendMessage({
      variables: { conversationId: id, body: trimmed },
    });
  }, [body, id, sendMessage]);

  if (loading) {
    return <LoadingState message="Loading messages..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || 'Failed to load conversation'}
        onRetry={() => refetch()}
      />
    );
  }

  const conversation = data?.conversation;
  const messages = conversation?.messages ?? [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
      testID="teacher-chat-screen"
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        testID="messages-list"
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.mine ? styles.bubbleMine : styles.bubbleTheirs,
            ]}
            testID={`message-${item.id}`}
          >
            {!item.mine ? (
              <Text style={styles.senderName}>{item.senderName}</Text>
            ) : null}
            <Text
              style={[
                styles.bubbleText,
                item.mine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
              ]}
            >
              {item.body}
            </Text>
            <Text
              style={[
                styles.timeText,
                item.mine ? styles.timeTextMine : styles.timeTextTheirs,
              ]}
            >
              {formatTime(item.createdAt)}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          maxLength={2000}
          testID="message-input"
        />
        <Pressable
          style={[
            styles.sendButton,
            (!body.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!body.trim() || sending}
          testID="send-button"
        >
          <Text style={styles.sendText}>Send</Text>
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
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
  },
  bubbleMine: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
    elevation: 1,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  bubbleTextTheirs: {
    color: '#333',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeTextMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeTextTheirs: {
    color: '#999',
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
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
