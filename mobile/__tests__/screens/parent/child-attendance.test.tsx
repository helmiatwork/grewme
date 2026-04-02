import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import AttendanceScreen from '../../../app/(app)/parent/children/[id]/attendance';
import {
  AttendanceStatusEnum,
  StudentAttendanceDocument,
} from '../../../src/graphql/generated/graphql';

function makeRecord(
  id: string,
  date: string,
  status: AttendanceStatusEnum,
  classroomName: string,
  notes?: string
) {
  return {
    id,
    date,
    status,
    notes: notes ?? null,
    classroom: { id: `c-${id}`, name: classroomName },
  };
}

const successMock: MockedResponse = {
  request: {
    query: StudentAttendanceDocument,
    variables: { studentId: '1' },
  },
  result: {
    data: {
      studentAttendance: [
        makeRecord('1', '2026-04-01', AttendanceStatusEnum.Present, 'Class A'),
        makeRecord('2', '2026-03-31', AttendanceStatusEnum.Sick, 'Class A', 'Had a cold'),
        makeRecord('3', '2026-03-30', AttendanceStatusEnum.Present, 'Class A'),
        makeRecord('4', '2026-03-29', AttendanceStatusEnum.Excused, 'Class A', 'Family event'),
        makeRecord('5', '2026-03-28', AttendanceStatusEnum.Unexcused, 'Class A'),
      ],
    },
  },
};

const emptyMock: MockedResponse = {
  request: {
    query: StudentAttendanceDocument,
    variables: { studentId: '2' },
  },
  result: {
    data: {
      studentAttendance: [],
    },
  },
};

const errorMock: MockedResponse = {
  request: {
    query: StudentAttendanceDocument,
    variables: { studentId: '3' },
  },
  error: new Error('Network error'),
};

describe('AttendanceScreen', () => {
  it('renders attendance list with summary stats', async () => {
    const { getByTestId, getByText } = render(
      <MockedProvider mocks={[successMock]} addTypename={false}>
        <AttendanceScreen id="1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('attendance-screen')).toBeTruthy();
    });

    expect(getByText('5')).toBeTruthy(); // total days
    expect(getByText('40%')).toBeTruthy(); // 2/5 present
    expect(getByText('3')).toBeTruthy(); // absences
    expect(getByTestId('attendance-list')).toBeTruthy();
    expect(getByTestId('attendance-item-1')).toBeTruthy();
    expect(getByTestId('attendance-item-2')).toBeTruthy();
    expect(getByText('Had a cold')).toBeTruthy();
  });

  it('renders empty state when no records', async () => {
    const { getByTestId, getByText } = render(
      <MockedProvider mocks={[emptyMock]} addTypename={false}>
        <AttendanceScreen id="2" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('attendance-empty')).toBeTruthy();
    });

    expect(getByText('No attendance records available')).toBeTruthy();
  });

  it('renders error state on failure', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <AttendanceScreen id="3" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });

  it('shows loading state initially', () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[successMock]} addTypename={false}>
        <AttendanceScreen id="1" />
      </MockedProvider>
    );

    expect(getByTestId('loading-state')).toBeTruthy();
  });
});
