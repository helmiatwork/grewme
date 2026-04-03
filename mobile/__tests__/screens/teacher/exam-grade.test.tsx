import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import GradeSubmissionScreen from '../../../app/(app)/teacher/exams/[examId]/grade/[submissionId]';
import {
  ExamSubmissionDetailDocument,
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

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ examId: 'e1', submissionId: 'sub1' }),
}));

jest.mock('../../../src/utils/examHelpers', () => ({
  formatExamDate: (d: string) => d,
  examStatusColor: () => '#4CAF50',
  formatExamType: (t: string) => t,
}));

const submissionMock: MockedResponse = {
  request: {
    query: ExamSubmissionDetailDocument,
    variables: { id: 'sub1' },
  },
  result: {
    data: {
      examSubmission: {
        id: 'sub1',
        status: 'SUBMITTED',
        score: null,
        passed: null,
        teacherNotes: null,
        submittedAt: '2026-04-02',
        student: { id: 'st1', name: 'Alice' },
        classroomExam: {
          exam: {
            id: 'e1',
            title: 'Math Quiz',
            examType: 'SCORE_BASED',
            maxScore: 100,
            rubricCriteria: [],
          },
        },
        examAnswers: [],
        rubricScores: [],
      },
    },
  },
};

const submissionNotFoundMock: MockedResponse = {
  request: {
    query: ExamSubmissionDetailDocument,
    variables: { id: 'sub1' },
  },
  result: {
    data: { examSubmission: null },
  },
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <GradeSubmissionScreen />
    </MockedProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GradeSubmissionScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([submissionMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('shows not-found state when submission is null', async () => {
    const { getByTestId } = renderScreen([submissionNotFoundMock]);

    await waitFor(() => {
      expect(getByTestId('submission-not-found')).toBeTruthy();
    });
  });

  it('renders student name and exam title after loading', async () => {
    const { getByTestId, getByText } = renderScreen([submissionMock]);

    await waitFor(() => {
      expect(getByTestId('grade-submission-screen')).toBeTruthy();
    });

    expect(getByText('Alice')).toBeTruthy();
    expect(getByText(/Math Quiz/)).toBeTruthy();
  });

  it('shows score input for SCORE_BASED exam type', async () => {
    const { getByTestId } = renderScreen([submissionMock]);

    await waitFor(() => {
      expect(getByTestId('grade-submission-screen')).toBeTruthy();
    });

    expect(getByTestId('input-score')).toBeTruthy();
  });

  it('shows submit grade button', async () => {
    const { getByTestId } = renderScreen([submissionMock]);

    await waitFor(() => {
      expect(getByTestId('submit-grade')).toBeTruthy();
    });
  });

  it('shows teacher notes input', async () => {
    const { getByTestId } = renderScreen([submissionMock]);

    await waitFor(() => {
      expect(getByTestId('input-teacher-notes')).toBeTruthy();
    });
  });
});
