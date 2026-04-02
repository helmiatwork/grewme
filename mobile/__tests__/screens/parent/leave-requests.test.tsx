import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import LeaveRequestsScreen from '../../../app/(app)/parent/leave-requests/index';
import {
  MyChildrenDocument,
  ParentLeaveRequestsDocument,
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

const childrenMock: MockedResponse = {
  request: {
    query: MyChildrenDocument,
  },
  result: {
    data: {
      myChildren: [{ id: '1', name: 'Alice', avatar: null }],
    },
  },
};

const requestsMock: MockedResponse = {
  request: {
    query: ParentLeaveRequestsDocument,
    variables: {},
  },
  result: {
    data: {
      parentLeaveRequests: [
        {
          id: '10',
          requestType: 'SICK',
          startDate: '2026-04-05',
          endDate: '2026-04-07',
          reason: 'Fever',
          status: 'PENDING',
          rejectionReason: null,
          reviewedAt: null,
          student: { id: '1', name: 'Alice' },
          daysCount: 3,
          createdAt: '2026-04-02T10:00:00Z',
        },
        {
          id: '11',
          requestType: 'EXCUSED',
          startDate: '2026-03-20',
          endDate: '2026-03-20',
          reason: 'Family event',
          status: 'APPROVED',
          rejectionReason: null,
          reviewedAt: '2026-03-19T08:00:00Z',
          student: { id: '1', name: 'Alice' },
          daysCount: 1,
          createdAt: '2026-03-18T10:00:00Z',
        },
      ],
    },
  },
};

const emptyRequestsMock: MockedResponse = {
  request: {
    query: ParentLeaveRequestsDocument,
    variables: {},
  },
  result: {
    data: {
      parentLeaveRequests: [],
    },
  },
};

const errorMock: MockedResponse = {
  request: {
    query: ParentLeaveRequestsDocument,
    variables: {},
  },
  error: new Error('Server error'),
};

describe('LeaveRequestsScreen', () => {
  it('renders leave requests list', async () => {
    const { getByTestId, getByText } = render(
      <MockedProvider mocks={[childrenMock, requestsMock]} addTypename={false}>
        <LeaveRequestsScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('leave-requests-screen')).toBeTruthy();
    });

    expect(getByTestId('leave-request-10')).toBeTruthy();
    expect(getByTestId('leave-request-11')).toBeTruthy();
    expect(getByText('Fever')).toBeTruthy();
    expect(getByText('Family event')).toBeTruthy();
  });

  it('shows delete button only for pending requests', async () => {
    const { getByTestId, queryByTestId } = render(
      <MockedProvider mocks={[childrenMock, requestsMock]} addTypename={false}>
        <LeaveRequestsScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('leave-requests-screen')).toBeTruthy();
    });

    // Pending request should have delete button
    expect(getByTestId('delete-request-10')).toBeTruthy();
    // Approved request should not
    expect(queryByTestId('delete-request-11')).toBeNull();
  });

  it('shows new leave request button', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[childrenMock, requestsMock]} addTypename={false}>
        <LeaveRequestsScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('new-leave-request-button')).toBeTruthy();
    });
  });

  it('renders empty state when no requests', async () => {
    const { getByTestId } = render(
      <MockedProvider
        mocks={[childrenMock, emptyRequestsMock]}
        addTypename={false}
      >
        <LeaveRequestsScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('leave-requests-empty')).toBeTruthy();
    });
  });

  it('renders error state on failure', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[childrenMock, errorMock]} addTypename={false}>
        <LeaveRequestsScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });

  it('shows loading state initially', () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[childrenMock, requestsMock]} addTypename={false}>
        <LeaveRequestsScreen />
      </MockedProvider>
    );

    expect(getByTestId('loading-state')).toBeTruthy();
  });
});
