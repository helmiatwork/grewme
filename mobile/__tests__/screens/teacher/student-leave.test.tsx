import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type React from 'react';
import StudentLeaveTab from '../../../app/(app)/teacher/leave-requests/student-leave';
import { TeacherStudentLeaveRequestsDocument } from '../../../src/graphql/generated/graphql';

jest.mock(
  '@expo/vector-icons',
  () => {
    const { Text } = require('react-native');
    return {
      Ionicons: ({ name, ...props }: { name: string }) => (
        <Text {...props}>{name}</Text>
      ),
    };
  },
  { virtual: true }
);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

const leaveRequestsMock: MockedResponse = {
  request: {
    query: TeacherStudentLeaveRequestsDocument,
    variables: {},
  },
  result: {
    data: {
      leaveRequests: [
        {
          id: '100',
          requestType: 'SICK',
          startDate: '2026-04-05',
          endDate: '2026-04-06',
          reason: 'Fever and headache',
          status: 'PENDING',
          rejectionReason: null,
          reviewedAt: null,
          student: { id: 's1', name: 'Ahmad' },
          parent: { id: 'p1', name: 'Budi' },
          daysCount: 2,
          createdAt: '2026-04-04T08:00:00Z',
        },
        {
          id: '101',
          requestType: 'EXCUSED',
          startDate: '2026-04-01',
          endDate: '2026-04-01',
          reason: 'Family event',
          status: 'APPROVED',
          rejectionReason: null,
          reviewedAt: '2026-03-31T10:00:00Z',
          student: { id: 's2', name: 'Siti' },
          parent: { id: 'p2', name: 'Dewi' },
          daysCount: 1,
          createdAt: '2026-03-30T09:00:00Z',
        },
      ],
    },
  },
};

const emptyMock: MockedResponse = {
  request: {
    query: TeacherStudentLeaveRequestsDocument,
    variables: {},
  },
  result: {
    data: {
      leaveRequests: [],
    },
  },
};

const errorMock: MockedResponse = {
  request: {
    query: TeacherStudentLeaveRequestsDocument,
    variables: {},
  },
  error: new Error('Network error'),
};

describe('StudentLeaveTab', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[leaveRequestsMock]} addTypename={false}>
        <StudentLeaveTab />
      </MockedProvider>
    );

    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders student leave requests', async () => {
    const { getByTestId, getByText } = render(
      <MockedProvider mocks={[leaveRequestsMock]} addTypename={false}>
        <StudentLeaveTab />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('student-leave-tab')).toBeTruthy();
    });

    expect(getByTestId('student-leave-item-100')).toBeTruthy();
    expect(getByTestId('student-leave-item-101')).toBeTruthy();
    expect(getByText('Ahmad')).toBeTruthy();
    expect(getByText('Fever and headache')).toBeTruthy();
  });

  it('shows approve and reject buttons for pending requests', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[leaveRequestsMock]} addTypename={false}>
        <StudentLeaveTab />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('student-leave-tab')).toBeTruthy();
    });

    expect(getByTestId('approve-btn-100')).toBeTruthy();
    expect(getByTestId('reject-btn-100')).toBeTruthy();
  });

  it('does not show action buttons for non-pending requests', async () => {
    const { getByTestId, queryByTestId } = render(
      <MockedProvider mocks={[leaveRequestsMock]} addTypename={false}>
        <StudentLeaveTab />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('student-leave-tab')).toBeTruthy();
    });

    expect(queryByTestId('approve-btn-101')).toBeNull();
    expect(queryByTestId('reject-btn-101')).toBeNull();
  });

  it('renders filter chips', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[leaveRequestsMock]} addTypename={false}>
        <StudentLeaveTab />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('student-leave-tab')).toBeTruthy();
    });

    expect(getByTestId('student-filter-all')).toBeTruthy();
    expect(getByTestId('student-filter-pending')).toBeTruthy();
  });

  it('shows empty state', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[emptyMock]} addTypename={false}>
        <StudentLeaveTab />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('student-leave-empty-state')).toBeTruthy();
    });
  });

  it('shows error state', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <StudentLeaveTab />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });
});
