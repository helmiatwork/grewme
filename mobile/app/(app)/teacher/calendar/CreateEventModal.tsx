import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useClassroomsQuery,
  useCreateClassroomEventMutation,
} from '../../../../src/graphql/generated/graphql';

interface CreateEventModalProps {
  visible: boolean;
  selectedDate: string;
  onClose: () => void;
}

interface CreateEventForm {
  classroomId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

const EMPTY_FORM: CreateEventForm = {
  classroomId: '',
  title: '',
  description: '',
  startTime: '',
  endTime: '',
};

export default function CreateEventModal({
  visible,
  selectedDate,
  onClose,
}: CreateEventModalProps) {
  const [form, setForm] = useState<CreateEventForm>(EMPTY_FORM);

  const { data: classroomsData } = useClassroomsQuery();
  const classrooms = classroomsData?.classrooms ?? [];

  const [createClassroomEvent, { loading: creating }] =
    useCreateClassroomEventMutation({
      refetchQueries: ['ClassroomEvents'],
    });

  const handleClose = useCallback(() => {
    setForm(EMPTY_FORM);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!form.title.trim()) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    const classroomId = form.classroomId || classrooms[0]?.id;
    if (!classroomId) {
      Alert.alert('Validation', 'Please select a classroom.');
      return;
    }
    try {
      const result = await createClassroomEvent({
        variables: {
          classroomId,
          title: form.title.trim(),
          description: form.description.trim() || null,
          eventDate: selectedDate,
          startTime: form.startTime.trim() || null,
          endTime: form.endTime.trim() || null,
        },
      });
      const payload = result.data?.createClassroomEvent;
      if (payload?.errors?.length) {
        Alert.alert('Error', payload.errors[0].message);
        return;
      }
      Alert.alert('Success', 'Event created.');
      handleClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong.';
      Alert.alert('Error', message);
    }
  }, [form, classrooms, selectedDate, createClassroomEvent, handleClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      testID="create-event-modal"
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>New Event — {selectedDate}</Text>
            <Pressable onPress={handleClose} testID="close-modal">
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {classrooms.length > 1 ? (
              <View style={styles.field}>
                <Text style={styles.label}>Classroom</Text>
                <View style={styles.pickerRow}>
                  {classrooms.map((c) => (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.pickerOption,
                        form.classroomId === c.id &&
                          styles.pickerOptionSelected,
                      ]}
                      onPress={() =>
                        setForm((prev) => ({ ...prev, classroomId: c.id }))
                      }
                      testID={`classroom-option-${c.id}`}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          form.classroomId === c.id &&
                            styles.pickerOptionTextSelected,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, title: text }))
                }
                placeholder="Event title"
                testID="title-input"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={form.description}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, description: text }))
                }
                placeholder="Optional description"
                multiline
                numberOfLines={3}
                testID="description-input"
              />
            </View>

            <View style={styles.timeRow}>
              <View style={[styles.field, styles.timeField]}>
                <Text style={styles.label}>Start time</Text>
                <TextInput
                  style={styles.input}
                  value={form.startTime}
                  onChangeText={(text) =>
                    setForm((prev) => ({ ...prev, startTime: text }))
                  }
                  placeholder="09:00"
                  testID="start-time-input"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.field, styles.timeField]}>
                <Text style={styles.label}>End time</Text>
                <TextInput
                  style={styles.input}
                  value={form.endTime}
                  onChangeText={(text) =>
                    setForm((prev) => ({ ...prev, endTime: text }))
                  }
                  placeholder="10:00"
                  testID="end-time-input"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Pressable
              style={[styles.submitButton, creating && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={creating}
              testID="submit-event-button"
            >
              <Text style={styles.submitText}>
                {creating ? 'Creating…' : 'Create Event'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  required: {
    color: '#E53935',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  timeField: {
    flex: 1,
    marginBottom: 0,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#F5F5F5',
  },
  pickerOptionSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  pickerOptionText: {
    fontSize: 13,
    color: '#555',
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#1976D2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
