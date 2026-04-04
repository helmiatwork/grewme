import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ErrorState from '../../../../src/components/ErrorState';
import LoadingState from '../../../../src/components/LoadingState';
import {
  useClassroomEventsQuery,
  useDeleteClassroomEventMutation,
} from '../../../../src/graphql/generated/graphql';
import CreateEventModal from './CreateEventModal';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatMonthDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

function formatLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function sameDay(a: string, b: string): boolean {
  return a === b;
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDay = first.getDay();
  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= lastDate; d++) {
    days.push(d);
  }
  return days;
}

function toDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export default function TeacherCalendarScreen() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    toDateString(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [modalVisible, setModalVisible] = useState(false);

  const monthParam = formatMonthDate(viewDate);

  const { data, loading, error, refetch } = useClassroomEventsQuery({
    variables: { month: monthParam },
  });

  const [deleteClassroomEvent] = useDeleteClassroomEventMutation({
    refetchQueries: ['ClassroomEvents'],
  });

  const events = data?.classroomEvents ?? [];

  const eventDateSet = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      set.add(e.eventDate);
    }
    return set;
  }, [events]);

  const selectedEvents = useMemo(
    () => events.filter((e) => sameDay(e.eventDate, selectedDate)),
    [events, selectedDate]
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  const goToPrevMonth = useCallback(() => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleDeleteEvent = useCallback(
    (id: string, title: string) => {
      Alert.alert('Delete Event', `Delete "${title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteClassroomEvent({ variables: { id } });
              const payload = result.data?.deleteClassroomEvent;
              if (payload?.errors?.length) {
                Alert.alert('Error', payload.errors[0].message);
              }
            } catch (err) {
              const message =
                err instanceof Error ? err.message : 'Something went wrong.';
              Alert.alert('Error', message);
            }
          },
        },
      ]);
    },
    [deleteClassroomEvent]
  );

  if (loading && !data) {
    return <LoadingState message="Loading calendar..." />;
  }

  if (error && !data) {
    return (
      <ErrorState
        message={error.message || 'Failed to load events'}
        onRetry={() => refetch()}
      />
    );
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  return (
    <View style={styles.container} testID="teacher-calendar-screen">
      <View style={styles.monthNav}>
        <Pressable onPress={goToPrevMonth} testID="prev-month">
          <Text style={styles.navArrow}>{'<'}</Text>
        </Pressable>
        <Text style={styles.monthLabel} testID="month-label">
          {formatLabel(viewDate)}
        </Text>
        <Pressable onPress={goToNextMonth} testID="next-month">
          <Text style={styles.navArrow}>{'>'}</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <View key={w} style={styles.weekCell}>
            <Text style={styles.weekText}>{w}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: empty spacer cells have no meaningful identity
              <View key={`empty-${idx}`} style={styles.dayCell} />
            );
          }
          const dateStr = toDateString(year, month, day);
          const hasEvent = eventDateSet.has(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <Pressable
              key={dateStr}
              style={[styles.dayCell, isSelected && styles.dayCellSelected]}
              onPress={() => setSelectedDate(dateStr)}
              testID={`day-${day}`}
            >
              <Text
                style={[styles.dayText, isSelected && styles.dayTextSelected]}
              >
                {day}
              </Text>
              {hasEvent ? <View style={styles.eventDot} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Events on {selectedDate}</Text>
      <FlatList
        data={selectedEvents}
        keyExtractor={(item) => item.id}
        testID="events-list"
        contentContainerStyle={styles.eventsList}
        ListEmptyComponent={
          <Text style={styles.emptyText} testID="no-events">
            No events for this day
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onLongPress={
              item.isMine
                ? () => handleDeleteEvent(item.id, item.title)
                : undefined
            }
            testID={`event-${item.id}`}
          >
            <View style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <View style={styles.eventHeaderRight}>
                  {item.startTime ? (
                    <Text style={styles.eventTime}>
                      {item.startTime}
                      {item.endTime ? ` - ${item.endTime}` : ''}
                    </Text>
                  ) : null}
                  {item.isMine ? (
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color="#E53935"
                      style={styles.deleteIcon}
                      testID={`delete-icon-${item.id}`}
                    />
                  ) : null}
                </View>
              </View>
              {item.description ? (
                <Text style={styles.eventDesc}>{item.description}</Text>
              ) : null}
              <Text style={styles.eventMeta}>
                {item.classroom.name} -- {item.creatorName}
              </Text>
            </View>
          </Pressable>
        )}
      />

      <Pressable
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        testID="create-event-fab"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <CreateEventModal
        visible={modalVisible}
        selectedDate={selectedDate}
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4CAF50',
    paddingHorizontal: 8,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: '#4CAF50',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  eventTime: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 8,
  },
  deleteIcon: {
    marginLeft: 8,
  },
  eventDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  eventMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
});
