import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import HistoryScreen from '../../../app/(app)/parent/children/[id]/history';
import {
  SkillCategoryEnum,
  StudentDailyScoresDocument,
} from '../../../src/graphql/generated/graphql';

function makeEdge(
  id: string,
  date: string,
  category: SkillCategoryEnum,
  score: number,
  notes?: string
) {
  return {
    cursor: `cursor-${id}`,
    node: {
      id,
      date,
      skillCategory: category,
      score,
      notes: notes ?? null,
    },
  };
}

const page1Mock: MockedResponse = {
  request: {
    query: StudentDailyScoresDocument,
    variables: { studentId: '1', first: 20 },
  },
  result: {
    data: {
      studentDailyScores: {
        edges: [
          makeEdge(
            '1',
            '2026-03-31',
            SkillCategoryEnum.Reading,
            85,
            'Great work'
          ),
          makeEdge('2', '2026-03-30', SkillCategoryEnum.Math, 72),
          makeEdge(
            '3',
            '2026-03-29',
            SkillCategoryEnum.Writing,
            90,
            'Excellent essay'
          ),
        ],
        pageInfo: {
          endCursor: 'cursor-3',
          hasNextPage: true,
        },
      },
    },
  },
};

const page2Mock: MockedResponse = {
  request: {
    query: StudentDailyScoresDocument,
    variables: { studentId: '1', first: 20, after: 'cursor-3' },
  },
  result: {
    data: {
      studentDailyScores: {
        edges: [
          makeEdge('4', '2026-03-28', SkillCategoryEnum.Logic, 65),
          makeEdge('5', '2026-03-27', SkillCategoryEnum.Social, 78),
        ],
        pageInfo: {
          endCursor: 'cursor-5',
          hasNextPage: false,
        },
      },
    },
  },
};

const emptyMock: MockedResponse = {
  request: {
    query: StudentDailyScoresDocument,
    variables: { studentId: '1', first: 20 },
  },
  result: {
    data: {
      studentDailyScores: {
        edges: [],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    },
  },
};

const errorMock: MockedResponse = {
  request: {
    query: StudentDailyScoresDocument,
    variables: { studentId: '1', first: 20 },
  },
  error: new Error('Connection failed'),
};

function renderScreen(mocks: MockedResponse[] = [], id = '1') {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <HistoryScreen id={id} />
    </MockedProvider>
  );
}

describe('HistoryScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([page1Mock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders score list after loading', async () => {
    const { getByTestId, getByText } = renderScreen([page1Mock]);

    await waitFor(() => {
      expect(getByTestId('history-list')).toBeTruthy();
    });

    expect(getByTestId('history-item-1')).toBeTruthy();
    expect(getByTestId('history-item-2')).toBeTruthy();
    expect(getByTestId('history-item-3')).toBeTruthy();
    expect(getByText('85')).toBeTruthy();
    expect(getByText('Reading')).toBeTruthy();
    expect(getByText('Great work')).toBeTruthy();
  });

  it('shows load more button when hasNextPage', async () => {
    const { getByTestId } = renderScreen([page1Mock, page2Mock]);

    await waitFor(() => {
      expect(getByTestId('load-more-button')).toBeTruthy();
    });
  });

  it('loads more items on button press', async () => {
    const { getByTestId } = renderScreen([page1Mock, page2Mock]);

    await waitFor(() => {
      expect(getByTestId('load-more-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('load-more-button'));

    await waitFor(() => {
      expect(getByTestId('history-item-4')).toBeTruthy();
      expect(getByTestId('history-item-5')).toBeTruthy();
    });
  });

  it('shows empty state when no scores', async () => {
    const { getByTestId } = renderScreen([emptyMock]);

    await waitFor(() => {
      expect(getByTestId('history-empty')).toBeTruthy();
    });
  });

  it('shows error state on failure', async () => {
    const { getByTestId } = renderScreen([errorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });

    expect(getByTestId('error-retry-button')).toBeTruthy();
  });
});
