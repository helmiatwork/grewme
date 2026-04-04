import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ErrorState from '../../../../src/components/ErrorState';
import LoadingState from '../../../../src/components/LoadingState';
import {
  ConversationsDocument,
  useClassroomOverviewQuery,
  useClassroomsQuery,
  useConversationsQuery,
  useCreateConversationMutation,
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

type ModalStep = 'classroom' | 'student';

function NewConversationModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<ModalStep>('classroom');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(
    null
  );

  const { data: classroomsData, loading: classroomsLoading } =
    useClassroomsQuery({
      skip: !visible,
    });

  const { data: overviewData, loading: overviewLoading } =
    useClassroomOverviewQuery({
      variables: { classroomId: selectedClassroomId ?? '' },
      skip: !selectedClassroomId,
    });

  const [createConversation, { loading: creating }] =
    useCreateConversationMutation({
      refetchQueries: [{ query: ConversationsDocument }],
    });

  const handleClose = useCallback(() => {
    setStep('classroom');
    setSelectedClassroomId(null);
    onClose();
  }, [onClose]);

  const handleSelectClassroom = useCallback((classroomId: string) => {
    setSelectedClassroomId(classroomId);
    setStep('student');
  }, []);

  const handleSelectStudent = useCallback(
    async (studentId: string) => {
      if (creating) return;
      try {
        const result = await createConversation({
          variables: { studentId },
        });
        const conversation = result.data?.createConversation.conversation;
        const errors = result.data?.createConversation.errors ?? [];

        if (errors.length > 0) {
          Alert.alert('Error', errors[0].message);
          return;
        }

        if (conversation) {
          handleClose();
          router.push(`/teacher/messages/${conversation.id}`);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to start conversation';
        Alert.alert('Error', message);
      }
    },
    [createConversation, creating, handleClose]
  );

  const classrooms = classroomsData?.classrooms ?? [];
  const students = overviewData?.classroomOverview.students ?? [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      testID="new-conversation-modal"
    >
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          {step === 'student' ? (
            <Pressable
              onPress={() => setStep('classroom')}
              style={modalStyles.backButton}
              testID="modal-back-button"
            >
              <Ionicons name="arrow-back" size={22} color="#333" />
            </Pressable>
          ) : (
            <View style={modalStyles.backButton} />
          )}
          <Text style={modalStyles.title}>
            {step === 'classroom' ? 'Select Classroom' : 'Select Student'}
          </Text>
          <Pressable
            onPress={handleClose}
            style={modalStyles.closeButton}
            testID="modal-close-button"
          >
            <Ionicons name="close" size={22} color="#333" />
          </Pressable>
        </View>

        {step === 'classroom' ? (
          classroomsLoading ? (
            <LoadingState message="Loading classrooms..." />
          ) : classrooms.length === 0 ? (
            <View style={modalStyles.emptyContainer} testID="classrooms-empty">
              <Text style={modalStyles.emptyText}>No classrooms found</Text>
            </View>
          ) : (
            <FlatList
              data={classrooms}
              keyExtractor={(item) => item.id}
              testID="classroom-list"
              contentContainerStyle={modalStyles.listContent}
              renderItem={({ item }) => (
                <Pressable
                  style={modalStyles.row}
                  testID={`classroom-${item.id}`}
                  onPress={() => handleSelectClassroom(item.id)}
                >
                  <Ionicons
                    name="school-outline"
                    size={20}
                    color="#1976D2"
                    style={modalStyles.rowIcon}
                  />
                  <Text style={modalStyles.rowText}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </Pressable>
              )}
            />
          )
        ) : overviewLoading ? (
          <LoadingState message="Loading students..." />
        ) : students.length === 0 ? (
          <View style={modalStyles.emptyContainer} testID="students-empty">
            <Text style={modalStyles.emptyText}>
              No students in this classroom
            </Text>
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => item.studentId}
            testID="student-list"
            contentContainerStyle={modalStyles.listContent}
            renderItem={({ item }) => (
              <Pressable
                style={[modalStyles.row, creating && modalStyles.rowDisabled]}
                testID={`student-${item.studentId}`}
                onPress={() => handleSelectStudent(item.studentId)}
                disabled={creating}
              >
                <View style={modalStyles.studentAvatar}>
                  <Text style={modalStyles.studentAvatarText}>
                    {item.studentName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={modalStyles.rowText}>{item.studentName}</Text>
                {creating ? (
                  <Ionicons name="ellipsis-horizontal" size={18} color="#CCC" />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                )}
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

export default function TeacherConversationsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
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

  return (
    <View style={styles.container} testID="teacher-conversations-screen">
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer} testID="conversations-empty">
          <Text style={styles.emptyText}>No conversations yet</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          testID="conversations-list"
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              testID={`conversation-${item.id}`}
              onPress={() => router.push(`/(app)/teacher/messages/${item.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.parent.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardRow}>
                  <Text style={styles.contactName} numberOfLines={1}>
                    {item.parent.name}
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
      )}

      <Pressable
        style={styles.fab}
        testID="new-conversation-fab"
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={26} color="#fff" />
      </Pressable>

      <NewConversationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
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
  contactName: {
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
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    width: 32,
    alignItems: 'flex-start',
  },
  closeButton: {
    width: 32,
    alignItems: 'flex-end',
  },
  listContent: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    color: '#fff',
    fontSize: 15,
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
