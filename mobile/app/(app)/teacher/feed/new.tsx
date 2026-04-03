import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  FeedPostsDocument,
  useClassroomsQuery,
  useCreateFeedPostMutation,
} from '../../../../src/graphql/generated/graphql';

export default function NewFeedPostScreen() {
  const [body, setBody] = useState('');
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>(
    []
  );

  const { data: classroomsData, loading: classroomsLoading } =
    useClassroomsQuery();
  const [createFeedPost, { loading: creating }] = useCreateFeedPostMutation({
    refetchQueries: [{ query: FeedPostsDocument, variables: { first: 20 } }],
  });

  const classrooms = classroomsData?.classrooms ?? [];

  const toggleClassroom = (id: string) => {
    setSelectedClassroomIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!body.trim()) {
      Alert.alert('Error', 'Please write something to post');
      return;
    }
    if (selectedClassroomIds.length === 0) {
      Alert.alert('Error', 'Please select at least one classroom');
      return;
    }

    try {
      const result = await createFeedPost({
        variables: {
          classroomIds: selectedClassroomIds,
          body: body.trim(),
        },
      });
      const errors = result.data?.createFeedPost?.errors ?? [];
      if (errors.length > 0) {
        Alert.alert('Error', errors[0].message);
      } else {
        router.back();
      }
    } catch {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} testID="new-post-screen">
      <Text style={styles.label}>Classrooms</Text>
      {classroomsLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <View style={styles.classroomPicker}>
          {classrooms.map((c) => {
            const selected = selectedClassroomIds.includes(c.id);
            return (
              <Pressable
                key={c.id}
                style={[
                  styles.classroomChip,
                  selected && styles.classroomChipSelected,
                ]}
                onPress={() => toggleClassroom(c.id)}
                testID={`classroom-${c.id}`}
              >
                <Text
                  style={[
                    styles.classroomChipText,
                    selected && styles.classroomChipTextSelected,
                  ]}
                >
                  {c.name}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark" size={16} color="#2E7D32" />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.label}>Post content</Text>
      <TextInput
        style={styles.bodyInput}
        value={body}
        onChangeText={setBody}
        placeholder="Share an update with parents..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={6}
        maxLength={5000}
        testID="post-body-input"
      />

      <Pressable
        style={[styles.submitButton, creating && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={creating}
        testID="submit-post-button"
      >
        {creating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Post</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  classroomPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classroomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  classroomChipSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  classroomChipText: {
    fontSize: 14,
    color: '#444',
  },
  classroomChipTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  bodyInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 140,
    textAlignVertical: 'top',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    padding: 16,
  },
});
