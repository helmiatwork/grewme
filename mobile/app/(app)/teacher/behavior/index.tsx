import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  useBehaviorCategoriesQuery,
  useAwardBehaviorPointMutation,
} from '../../../../src/graphql/generated/graphql';
import { useAuthStore } from '../../../../src/auth/store';
import BehaviorBadge from '../../../../src/components/BehaviorBadge';
import LoadingState from '../../../../src/components/LoadingState';
import ErrorState from '../../../../src/components/ErrorState';

export default function AwardBehaviorScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const activeSchoolId = useAuthStore((s) => s.activeSchoolId);
  const activeClassroomId = useAuthStore((s) => s.activeClassroomId);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const { data, loading, error, refetch } = useBehaviorCategoriesQuery({
    variables: { schoolId: activeSchoolId! },
    skip: !activeSchoolId,
  });

  const [awardPoint, { loading: awarding }] = useAwardBehaviorPointMutation();

  const categories = data?.behaviorCategories ?? [];
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setNote('');
    setModalVisible(true);
  };

  const handleConfirmAward = async () => {
    if (!studentId || !activeClassroomId || !selectedCategoryId) return;

    try {
      const result = await awardPoint({
        variables: {
          studentId,
          classroomId: activeClassroomId,
          behaviorCategoryId: selectedCategoryId,
          note: note.trim() || undefined,
        },
      });

      const payload = result.data?.awardBehaviorPoint;
      if (payload?.errors && payload.errors.length > 0) {
        Alert.alert('Cannot Award', payload.errors[0].message);
      } else if (payload?.behaviorPoint) {
        Alert.alert(
          'Point Awarded',
          `Daily total: ${payload.dailyTotal} points`,
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setModalVisible(false);
      setSelectedCategoryId(null);
      setNote('');
    }
  };

  if (!studentId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No student selected</Text>
      </View>
    );
  }

  if (loading) return <LoadingState message="Loading categories..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <View style={styles.container} testID="award-behavior-screen">
      <Text style={styles.title}>Award Behavior Point</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(item.id)}
            testID={`category-${item.id}`}
          >
            <BehaviorBadge
              name={item.name}
              pointValue={item.pointValue}
              isPositive={item.isPositive}
              icon={item.icon}
              color={item.color}
            />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No behavior categories available</Text>
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              Award: {selectedCategory?.name}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedCategory?.isPositive ? '+' : ''}
              {selectedCategory?.pointValue} point
              {Math.abs(selectedCategory?.pointValue ?? 0) !== 1 ? 's' : ''}
            </Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note (optional)"
              value={note}
              onChangeText={setNote}
              multiline
              testID="note-input"
            />
            <Pressable
              style={[styles.confirmButton, awarding && styles.disabledButton]}
              onPress={handleConfirmAward}
              disabled={awarding}
              testID="confirm-award-button"
            >
              <Text style={styles.confirmButtonText}>
                {awarding ? 'Awarding...' : 'Confirm'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
              testID="cancel-button"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  grid: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 15,
    marginTop: 32,
  },
  errorText: {
    textAlign: 'center',
    color: '#C62828',
    fontSize: 16,
    marginTop: 32,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#1A1A1A',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 15,
  },
});
