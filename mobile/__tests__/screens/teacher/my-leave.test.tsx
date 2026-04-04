import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import TeacherMyLeaveScreen from '../../../app/(app)/teacher/leave-requests/index';
import {
  MyTeacherLeaveBalanceDocument,
  MyTeacherLeaveRequestsDocument,
} from '../../../src/graphql/generated/graphql';

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

jest.mock(
  '@react-native-community/datetimepicker',
  () => {
    const { View } = require('react-native');
    return {
      __esModule: true,
      default: (props: Record<string, unknown>) => (
        <View testID={props.testID as string} />
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

const balanceMock: MockedResponse = {
  request: {
    query: MyTeacherLeaveBalanceDocument,
    variables: {},
  },
  result: {
    data: {
      myTeacherLeaveBalance: {
        id: '1',
        maxAnnualLeave: 20,
        maxSickLeave: 10,
        usedAnnual: 3,
        usedSick: 1,
        usedPersonal: 0.5,
        remainingAnnual: 17,
        remainingSick: 9,
      },
    },
  },
};

const requestsMock: MockedResponse = {
  request: {
    query: MyTeacherLeaveRequestsDocument,
    variables: {},
  },
  result: {
    data: {
      myTeacherLeaveRequests: [
        {
          id: '20',
          requestType: 'ANNUAL',
          startDate: '2026-04-10',
          endDate: '2026-04-12',
          reason: 'Family trip',
          status: 'PENDING',
          rejectionReason: null,
          reviewedAt: null,
          halfDaySession: null,
          daysCount: 3,
          createdAt: '2026-04-03T10:00:00Z',
        },
        {
          id: '21',
          requestType: 'SICK',
          startDate: '2026-03-15',
          endDate: '2026-03-15',
          reason: 'Flu',
          status: 'APPROVED',
          rejectionReason: null,
          reviewedAt: '2026-03-14T09:00:00Z',
          halfDaySession: null,
          daysCount: 1,
          createdAt: '2026-03-14T08:00:00Z',
        },
      ],
    },
  },
};

const emptyRequestsMock: MockedResponse = {
  request: {
    query: MyTeacherLeaveRequestsDocument,
    variables: {},
  },
  result: {
    data: {
      myTeacherLeaveRequests: [],
    },
  },
};

const errorMock: MockedResponse = {
  request: {
    query: MyTeacherLeaveRequestsDocument,
    variables: {},
  },
  error: new Error('Server error'),
};

describe('TeacherMyLeaveScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[balanceMock, requestsMock]} addTypename={false}>
        <TeacherMyLeaveScreen />
      </MockedProvider>
    );

    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders leave balance card', async () => {
    const { getByTestId, getByText, getAllByText } = render(
      <MockedProvider mocks={[balanceMock, requestsMock]} addTypename={false}>
        <TeacherMyLeaveScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('teacher-my-leave-screen')).toBeTruthy();
    });

    expect(getByTestId('leave-balance')).toBeTruthy();
    // "Annual" appears in both balance card and type picker — confirm at least one exists
    expect(getAllByText(/Annual/).length).toBeGreaterThan(0);
    expect(getByText(/3\/20 used/)).toBeTruthy();
    expect(getByText(/17 remaining/)).toBeTruthy();
  });

  it('renders leave requests list', async () => {
    const { getByTestId, getByText } = render(
      <MockedProvider mocks={[balanceMock, requestsMock]} addTypename={false}>
        <TeacherMyLeaveScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('teacher-my-leave-screen')).toBeTruthy();
    });

    expect(getByTestId('leave-item-20')).toBeTruthy();
    expect(getByTestId('leave-item-21')).toBeTruthy();
    expect(getByText('Family trip')).toBeTruthy();
    expect(getByText('Flu')).toBeTruthy();
  });

  it('renders filter chips', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[balanceMock, requestsMock]} addTypename={false}>
        <TeacherMyLeaveScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('teacher-my-leave-screen')).toBeTruthy();
    });

    expect(getByTestId('filter-all')).toBeTruthy();
    expect(getByTestId('filter-pending')).toBeTruthy();
    expect(getByTestId('filter-approved')).toBeTruthy();
    expect(getByTestId('filter-rejected')).toBeTruthy();
  });

  it('shows new request button', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[balanceMock, requestsMock]} addTypename={false}>
        <TeacherMyLeaveScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('new-request-btn')).toBeTruthy();
    });
  });

  it('renders empty state when no requests', async () => {
    const { getByTestId } = render(
      <MockedProvider
        mocks={[balanceMock, emptyRequestsMock]}
        addTypename={false}
      >
        <TeacherMyLeaveScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('leave-empty-state')).toBeTruthy();
    });
  });

  it('renders error state on failure', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[balanceMock, errorMock]} addTypename={false}>
        <TeacherMyLeaveScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });
});
