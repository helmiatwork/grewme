import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import ExamDetailScreen from '../../../app/(app)/teacher/exams/[examId]/index';
import { ExamDetailDocument } from '../../../src/graphql/generated/graphql';

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

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useLocalSearchParams: () => ({ examId: 'e1' }),
}));

jest.mock('../../../src/utils/examHelpers', () => ({
  formatExamDate: (d: string) => d,
  examStatusColor: () => '#4CAF50',
  formatExamType: (t: string) => t,
}));

const examDetailMock: MockedResponse = {
  request: {
    query: ExamDetailDocument,
    variables: { id: 'e1' },
  },
  result: {
    data: {
      exam: {
        id: 'e1',
        title: 'Math Quiz',
        description: 'Test desc',
        examType: 'SCORE_BASED',
        maxScore: 100,
        durationMinutes: 60,
        topic: {
          name: 'Algebra',
          subject: { name: 'Math' },
        },
        examQuestions: [],
        rubricCriteria: [],
        classroomExams: [
          {
            id: 'ce1',
            status: 'ACTIVE',
            scheduledAt: '2026-04-01',
            dueAt: '2026-04-10',
            classroom: { name: 'Grade 1A' },
            examSubmissions: [
              {
                id: 'sub1',
                status: 'SUBMITTED',
                score: null,
                student: { name: 'Alice' },
              },
            ],
          },
        ],
      },
    },
  },
};

const examNotFoundMock: MockedResponse = {
  request: {
    query: ExamDetailDocument,
    variables: { id: 'e1' },
  },
  result: {
    data: { exam: null },
  },
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ExamDetailScreen />
    </MockedProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ExamDetailScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([examDetailMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('shows not-found state when exam is null', async () => {
    const { getByTestId } = renderScreen([examNotFoundMock]);

    await waitFor(() => {
      expect(getByTestId('exam-not-found')).toBeTruthy();
    });
  });

  it('renders exam header and breadcrumb after loading', async () => {
    const { getByTestId, getByText } = renderScreen([examDetailMock]);

    await waitFor(() => {
      expect(getByTestId('exam-detail-screen')).toBeTruthy();
    });

    expect(getByText('Math Quiz')).toBeTruthy();
    expect(getByText('Test desc')).toBeTruthy();
    // Breadcrumb contains both subject and topic names
    expect(getByText(/Algebra/)).toBeTruthy();
  });

  it('renders classroom assignment card', async () => {
    const { getByTestId, getByText } = renderScreen([examDetailMock]);

    await waitFor(() => {
      expect(getByTestId('assignment-ce1')).toBeTruthy();
    });

    expect(getByText('Grade 1A')).toBeTruthy();
  });

  it('renders submission row for student', async () => {
    const { getByTestId, getByText } = renderScreen([examDetailMock]);

    await waitFor(() => {
      expect(getByTestId('submission-sub1')).toBeTruthy();
    });

    expect(getByText('Alice')).toBeTruthy();
  });

  it('navigates to grade screen when submission is pressed', async () => {
    const { getByTestId } = renderScreen([examDetailMock]);

    await waitFor(() => {
      expect(getByTestId('submission-sub1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('submission-sub1'));
    expect(mockPush).toHaveBeenCalledWith(
      '/(app)/teacher/exams/e1/grade/sub1'
    );
  });
});
