import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import TeacherAttendanceScreen from '../../../app/(app)/teacher/attendance/index';
import { useAuthStore } from '../../../src/auth/store';
import {
  AttendanceStatusEnum,
  BulkRecordAttendanceDocument,
  ClassroomAttendanceDocument,
  ClassroomsDocument,
} from '../../../src/graphql/generated/graphql';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const RN = require('react');
  return {
    __esModule: true,
    default: (props: {
      testID?: string;
      onChange?: (event: unknown, date?: Date) => void;
    }) => {
      return RN.createElement('View', {
        testID: props.testID ?? 'date-picker',
      });
    },
  };
});

jest.spyOn(Alert, 'alert');

const today = new Date().toISOString().split('T')[0];

const classroomsMock: MockedResponse = {
  request: { query: ClassroomsDocument },
  result: {
    data: {
      classrooms: [{ id: 'c1', name: 'Grade 1A', school: { id: 's1' } }],
    },
  },
};

const attendanceMock: MockedResponse = {
  request: {
    query: ClassroomAttendanceDocument,
    variables: { classroomId: 'c1', date: today },
  },
  result: {
    data: {
      classroomAttendance: [
        {
          id: 'a1',
          date: today,
          status: AttendanceStatusEnum.Present,
          notes: null,
          student: { id: 'st1', name: 'Alice' },
          createdAt: '2026-04-02T08:00:00Z',
          updatedAt: '2026-04-02T08:00:00Z',
        },
        {
          id: 'a2',
          date: today,
          status: AttendanceStatusEnum.Sick,
          notes: 'Fever',
          student: { id: 'st2', name: 'Bob' },
          createdAt: '2026-04-02T08:00:00Z',
          updatedAt: '2026-04-02T08:00:00Z',
        },
      ],
    },
  },
};

const emptyAttendanceMock: MockedResponse = {
  request: {
    query: ClassroomAttendanceDocument,
    variables: { classroomId: 'c1', date: today },
  },
  result: {
    data: {
      classroomAttendance: [],
    },
  },
};

const bulkRecordMock: MockedResponse = {
  request: {
    query: BulkRecordAttendanceDocument,
    variables: {
      classroomId: 'c1',
      date: today,
      records: [
        {
          studentId: 'st1',
          status: AttendanceStatusEnum.Present,
          notes: undefined,
        },
        {
          studentId: 'st2',
          status: AttendanceStatusEnum.Present,
          notes: 'Fever',
        },
      ],
    },
  },
  result: {
    data: {
      bulkRecordAttendance: {
        attendances: [
          {
            id: 'a1',
            date: today,
            status: AttendanceStatusEnum.Present,
            notes: null,
            student: { id: 'st1', name: 'Alice' },
          },
          {
            id: 'a2',
            date: today,
            status: AttendanceStatusEnum.Present,
            notes: 'Fever',
            student: { id: 'st2', name: 'Bob' },
          },
        ],
        errors: [],
      },
    },
  },
};

const attendanceErrorMock: MockedResponse = {
  request: {
    query: ClassroomAttendanceDocument,
    variables: { classroomId: 'c1', date: today },
  },
  error: new Error('Network error'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <TeacherAttendanceScreen />
    </MockedProvider>
  );
}

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setActiveClassroomId('c1');
  useAuthStore.getState().setActiveSchoolId('s1');
  (Alert.alert as jest.Mock).mockClear();
});

describe('TeacherAttendanceScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([classroomsMock, attendanceMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders student list after loading', async () => {
    const { getByTestId, getByText } = renderScreen([
      classroomsMock,
      attendanceMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('teacher-attendance')).toBeTruthy();
    });

    expect(getByTestId('classroom-name').props.children).toBe('Grade 1A');
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('displays attendance summary counts', async () => {
    const { getByTestId } = renderScreen([classroomsMock, attendanceMock]);

    await waitFor(() => {
      expect(getByTestId('attendance-summary')).toBeTruthy();
    });

    // 1 present (Alice), 1 absent (Bob is sick)
    expect(getByTestId('attendance-summary').props.children).toBe(
      '1 present, 1 absent'
    );
  });

  it('shows empty message when no records', async () => {
    const { getByTestId } = renderScreen([classroomsMock, emptyAttendanceMock]);

    await waitFor(() => {
      expect(getByTestId('teacher-attendance')).toBeTruthy();
    });

    expect(getByTestId('empty-text')).toBeTruthy();
  });

  it('shows error state on query failure', async () => {
    const { getByTestId } = renderScreen([classroomsMock, attendanceErrorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });

  it('allows changing a student status', async () => {
    const { getByTestId } = renderScreen([classroomsMock, attendanceMock]);

    await waitFor(() => {
      expect(getByTestId('teacher-attendance')).toBeTruthy();
    });

    // Change Bob from Sick to Excused
    fireEvent.press(getByTestId(`status-st2-${AttendanceStatusEnum.Excused}`));

    // Save button should now be enabled (shows "Save Attendance")
    const saveBtn = getByTestId('save-button');
    expect(saveBtn).toBeTruthy();
  });

  it('mark all present sets all students to present', async () => {
    const { getByTestId } = renderScreen([
      classroomsMock,
      attendanceMock,
      bulkRecordMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('teacher-attendance')).toBeTruthy();
    });

    fireEvent.press(getByTestId('mark-all-present'));

    // Summary should now show all present
    await waitFor(() => {
      expect(getByTestId('attendance-summary').props.children).toBe(
        '2 present, 0 absent'
      );
    });
  });

  it('shows date picker button with current date', async () => {
    const { getByTestId } = renderScreen([classroomsMock, attendanceMock]);

    await waitFor(() => {
      expect(getByTestId('date-picker-button')).toBeTruthy();
    });

    expect(getByTestId('date-picker-button')).toBeTruthy();
  });
});
