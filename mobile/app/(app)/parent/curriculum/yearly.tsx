import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ErrorState from '../../../../src/components/ErrorState';
import LoadingState from '../../../../src/components/LoadingState';
import {
  useAcademicYearsQuery,
  useGradeCurriculumQuery,
} from '../../../../src/graphql/generated/graphql';
import { useParentSchoolId } from '../../../../src/hooks/useParentSchoolId';

export default function YearlyCurriculumScreen() {
  const {
    schoolId,
    availableGrades,
    loading: childrenLoading,
    error: childrenError,
    refetch: refetchChildren,
  } = useParentSchoolId();

  const {
    data: yearsData,
    loading: yearsLoading,
    error: yearsError,
  } = useAcademicYearsQuery({
    variables: { schoolId: schoolId ?? '' },
    skip: !schoolId,
  });

  const academicYears = useMemo(
    () => yearsData?.academicYears ?? [],
    [yearsData]
  );
  const currentYear = useMemo(
    () => academicYears.find((y) => y.current) ?? academicYears[0],
    [academicYears]
  );

  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number>(1);

  useEffect(() => {
    if (currentYear && !selectedYearId) {
      setSelectedYearId(currentYear.id);
    }
  }, [currentYear, selectedYearId]);

  const {
    data: curriculumData,
    loading: curriculumLoading,
    error: curriculumError,
    refetch: refetchCurriculum,
  } = useGradeCurriculumQuery({
    variables: {
      academicYearId: selectedYearId,
      grade: selectedGrade,
    },
    skip: !selectedYearId,
  });

  const loading = childrenLoading || yearsLoading;
  const error = childrenError || yearsError;

  if (loading) {
    return <LoadingState message="Loading yearly curriculum..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || 'Failed to load curriculum'}
        onRetry={() => refetchChildren()}
      />
    );
  }

  if (!schoolId) {
    return (
      <View style={styles.emptyContainer} testID="yearly-no-school">
        <Ionicons name="school-outline" size={48} color="#CCC" />
        <Text style={styles.emptyTitle}>No school found</Text>
        <Text style={styles.emptyHint}>
          Your children must be enrolled to view the yearly curriculum.
        </Text>
      </View>
    );
  }

  if (academicYears.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="yearly-no-years">
        <Ionicons name="calendar-outline" size={48} color="#CCC" />
        <Text style={styles.emptyTitle}>No academic years</Text>
        <Text style={styles.emptyHint}>
          Academic years will appear once the school sets them up.
        </Text>
      </View>
    );
  }

  const items = curriculumData?.gradeCurriculum?.gradeCurriculumItems ?? [];

  return (
    <View style={styles.container} testID="yearly-curriculum-screen">
      <View style={styles.headerSection}>
        <Text style={styles.header}>Yearly Curriculum</Text>
        <Text style={styles.subtitle}>
          View subjects and topics assigned to each grade level.
        </Text>
      </View>

      {/* Academic Year selector */}
      <View style={styles.selectorSection}>
        <Text style={styles.selectorLabel}>Academic Year</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {academicYears.map((year) => (
            <Pressable
              key={year.id}
              style={[
                styles.chip,
                selectedYearId === year.id && styles.chipActive,
              ]}
              onPress={() => setSelectedYearId(year.id)}
              testID={`year-chip-${year.id}`}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedYearId === year.id && styles.chipTextActive,
                ]}
              >
                {year.label}
                {year.current ? ' *' : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Grade selector */}
      <View style={styles.selectorSection}>
        <Text style={styles.selectorLabel}>Grade</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {availableGrades.map((g) => (
            <Pressable
              key={g}
              style={[styles.chip, selectedGrade === g && styles.chipActive]}
              onPress={() => setSelectedGrade(g)}
              testID={`grade-chip-${g}`}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedGrade === g && styles.chipTextActive,
                ]}
              >
                Grade {g}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Curriculum Items */}
      {curriculumLoading ? (
        <LoadingState message="Loading..." />
      ) : curriculumError ? (
        <ErrorState
          message="Failed to load curriculum items"
          onRetry={() => refetchCurriculum()}
        />
      ) : items.length === 0 ? (
        <View style={styles.emptyItems} testID="yearly-empty-items">
          <Text style={styles.emptyItemsText}>
            No curriculum items for this grade and year.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          testID="yearly-items-list"
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <View style={styles.itemRow} testID={`yearly-item-${item.id}`}>
              <Text style={styles.itemIndex}>{index + 1}</Text>
              <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.displayName}</Text>
                {item.topic?.subject ? (
                  <Text style={styles.itemSubject}>
                    {item.topic.subject.name}
                  </Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.itemBadge,
                  item.subject ? styles.subjectBadge : styles.topicBadge,
                ]}
              >
                <Text
                  style={[
                    styles.itemBadgeText,
                    item.subject
                      ? styles.subjectBadgeText
                      : styles.topicBadgeText,
                  ]}
                >
                  {item.subject ? 'subject' : 'topic'}
                </Text>
              </View>
            </View>
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
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  selectorSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  itemIndex: {
    fontSize: 12,
    color: '#999',
    fontVariant: ['tabular-nums'],
    width: 24,
    textAlign: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemSubject: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  itemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  subjectBadge: {
    backgroundColor: '#EDE7F6',
  },
  topicBadge: {
    backgroundColor: '#E8F5E9',
  },
  itemBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  subjectBadgeText: {
    color: '#5C6BC0',
  },
  topicBadgeText: {
    color: '#4CAF50',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyItems: {
    padding: 32,
    alignItems: 'center',
  },
  emptyItemsText: {
    fontSize: 13,
    color: '#999',
  },
});
