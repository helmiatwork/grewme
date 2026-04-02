import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import BehaviorHistoryScreen from '../../../app/(app)/teacher/behavior/history';
import { StudentBehaviorHistoryDocument } from '../../../src/graphql/generated/graphql';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ studentId: 'st1' }),
  router: { push: jest.fn(), replace: jest.fn() },
}));

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
          pointValue: 2,
          note: 'Helped a classmate with math',
          awardedAt: '2026-04-02T10:00:00Z',
          revokable: true,
          teacher: { id: 't1', name: 'Ms. Smith' },
          behaviorCategory: {
            name: 'Helping Others',
            isPositive: true,
            icon: '🤝',
            color: '#E8F5E9',
          },
        },
        {
          id: 'bp2',
          pointValue: -1,
          note: null,
          awardedAt: '2026-04-02T09:30:00Z',
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

const historyErrorMock: MockedResponse = {
  request: {
    query: StudentBehaviorHistoryDocument,
    variables: { studentId: 'st1' },
  },
  error: new Error('Network error'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <BehaviorHistoryScreen />
    </MockedProvider>,
  );
}

describe('BehaviorHistoryScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([historyMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders behavior history list after loading', async () => {
    const { getByTestId, getByText } = renderScreen([historyMock]);

    await waitFor(() => {
      expect(getByTestId('behavior-history-screen')).toBeTruthy();
    });

    expect(getByTestId('history-item-bp1')).toBeTruthy();
    expect(getByTestId('history-item-bp2')).toBeTruthy();
    expect(getByText('Helping Others')).toBeTruthy();
    expect(getByText('Disruption')).toBeTruthy();
  });

  it('displays note when present', async () => {
    const { getByTestId, getByText } = renderScreen([historyMock]);

    await waitFor(() => {
      expect(getByTestId('behavior-history-screen')).toBeTruthy();
    });

    expect(getByText('Helped a classmate with math')).toBeTruthy();
  });

  it('shows teacher name for each entry', async () => {
    const { getByText } = renderScreen([historyMock]);

    await waitFor(() => {
      expect(getByText('by Ms. Smith')).toBeTruthy();
    });

    expect(getByText('by Mr. Jones')).toBeTruthy();
  });

  it('shows revokable tag for revokable entries', async () => {
    const { getByTestId, getAllByTestId } = renderScreen([historyMock]);

    await waitFor(() => {
      expect(getByTestId('behavior-history-screen')).toBeTruthy();
    });

    const revokableTags = getAllByTestId('revokable-tag');
    expect(revokableTags).toHaveLength(1);
  });

  it('shows empty message when no history', async () => {
    const { getByText } = renderScreen([emptyHistoryMock]);

    await waitFor(() => {
      expect(getByText('No behavior history yet')).toBeTruthy();
    });
  });

  it('shows error state on query failure', async () => {
    const { getByTestId } = renderScreen([historyErrorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });
});
