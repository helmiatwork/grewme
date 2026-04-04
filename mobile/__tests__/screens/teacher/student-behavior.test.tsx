import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import StudentBehaviorScreen from '../../../app/(app)/teacher/students/[id]/behavior';
import { StudentBehaviorHistoryDocument } from '../../../src/graphql/generated/graphql';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'st1' }),
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('../../../src/components/BehaviorBadge', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ name, pointValue }: { name: string; pointValue: number }) => (
      <View testID="behavior-badge">
        <Text>{name}</Text>
        <Text>{pointValue}</Text>
      </View>
    ),
  };
});

const historyMock: MockedResponse = {
  request: {
    query: StudentBehaviorHistoryDocument,
    variables: { studentId: 'st1' },
  },
  result: {
    data: {
      studentBehaviorHistory: [
        {
          id: 'bp1',
          pointValue: 3,
          note: 'Excellent participation',
          awardedAt: '2026-04-02T10:00:00Z',
          revokable: true,
          teacher: { id: 't1', name: 'Ms. Smith' },
          behaviorCategory: {
            name: 'Participation',
            isPositive: true,
            icon: '⭐',
            color: '#E8F5E9',
          },
        },
        {
          id: 'bp2',
          pointValue: -2,
          note: null,
          awardedAt: '2026-04-02T09:00:00Z',
          revokable: false,
          teacher: { id: 't2', name: 'Mr. Jones' },
          behaviorCategory: {
            name: 'Disruption',
            isPositive: false,
            icon: '⚠️',
            color: '#FFEBEE',
          },
        },
      ],
    },
  },
};

const emptyHistoryMock: MockedResponse = {
  request: {
    query: StudentBehaviorHistoryDocument,
    variables: { studentId: 'st1' },
  },
  result: {
    data: {
      studentBehaviorHistory: [],
    },
  },
};

const errorMock: MockedResponse = {
  request: {
    query: StudentBehaviorHistoryDocument,
    variables: { studentId: 'st1' },
  },
  error: new Error('Network error'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <StudentBehaviorScreen />
    </MockedProvider>,
  );
}

describe('StudentBehaviorScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([historyMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders behavior list after loading', async () => {
    const { getByTestId } = renderScreen([historyMock]);

    await waitFor(() => {
      expect(getByTestId('student-behavior-screen')).toBeTruthy();
    });

    expect(getByTestId('behavior-item-bp1')).toBeTruthy();
    expect(getByTestId('behavior-item-bp2')).toBeTruthy();
  });

  it('shows net points summary', async () => {
    const { getByTestId } = renderScreen([historyMock]);

    await waitFor(() => {
      expect(getByTestId('net-points')).toBeTruthy();
    });

    // bp1: +3, bp2: -2 → net = +1
    expect(getByTestId('net-points').props.children).toBe('+1');
  });

  it('shows revoke button only on revokable items', async () => {
    const { getByTestId, queryByTestId } = renderScreen([historyMock]);

    await waitFor(() => {
      expect(getByTestId('student-behavior-screen')).toBeTruthy();
    });

    expect(getByTestId('revoke-btn-bp1')).toBeTruthy();
    expect(queryByTestId('revoke-btn-bp2')).toBeNull();
  });

  it('shows empty message when no behavior history', async () => {
    const { getByText } = renderScreen([emptyHistoryMock]);

    await waitFor(() => {
      expect(getByText('No behavior history yet')).toBeTruthy();
    });
  });

  it('shows error state on query failure', async () => {
    const { getByTestId } = renderScreen([errorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });

  it('displays teacher name for each entry', async () => {
    const { getByText } = renderScreen([historyMock]);

    await waitFor(() => {
      expect(getByText('by Ms. Smith')).toBeTruthy();
    });

    expect(getByText('by Mr. Jones')).toBeTruthy();
  });

  it('displays note when present', async () => {
    const { getByText } = renderScreen([historyMock]);

    await waitFor(() => {
      expect(getByText('Excellent participation')).toBeTruthy();
    });
  });
});
