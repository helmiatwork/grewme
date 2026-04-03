import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import StudentDetailScreen from '../../../app/(app)/teacher/students/[id]/index';
import {
  TeacherStudentDetailDocument,
} from '../../../src/graphql/generated/graphql';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'st1' }),
}));

jest.mock('../../../src/components/RadarChart', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <View testID="radar-chart" {...props} />
    ),
  };
});

jest.mock('../../../src/components/LineChart', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <View testID="line-chart" {...props} />
    ),
  };
});

const successMock: MockedResponse = {
  request: {
    query: TeacherStudentDetailDocument,
    variables: { studentId: 'st1' },
  },
  result: {
    data: {
      studentRadar: {
        studentId: 'st1',
        studentName: 'Alice',
        skills: {
          reading: 80,
          math: 70,
          writing: 60,
          logic: 50,
          social: 90,
        },
      },
      studentProgress: {
        weeks: [
          {
            period: 'Week of 2026-03-24',
            skills: {
              reading: 75,
              math: 65,
              writing: 55,
              logic: 45,
              social: 85,
            },
          },
        ],
      },
      studentDailyScores: {
        edges: [
          {
            node: {
              id: 'ds1',
              date: '2026-03-28',
              skillCategory: 'READING',
              score: 82,
              notes: 'Great session',
            },
          },
        ],
      },
    },
  },
};

const errorMock: MockedResponse = {
  request: {
    query: TeacherStudentDetailDocument,
    variables: { studentId: 'st1' },
  },
  error: new Error('Network error'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <StudentDetailScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('StudentDetailScreen', () => {
  it('shows loading state', () => {
    const { getByTestId } = renderScreen([successMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders radar chart and student name after loading', async () => {
    const { getByTestId, getByText } = renderScreen([successMock]);

    await waitFor(() => {
      expect(getByTestId('student-detail-screen')).toBeTruthy();
    });

    expect(getByTestId('student-header')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByTestId('radar-section')).toBeTruthy();
    expect(getByTestId('radar-chart')).toBeTruthy();
  });

  it('renders progress section when weeks data is present', async () => {
    const { getByTestId } = renderScreen([successMock]);

    await waitFor(() => {
      expect(getByTestId('progress-section')).toBeTruthy();
    });

    expect(getByTestId('line-chart')).toBeTruthy();
  });

  it('renders recent scores section', async () => {
    const { getByTestId, getByText } = renderScreen([successMock]);

    await waitFor(() => {
      expect(getByTestId('recent-scores-section')).toBeTruthy();
    });

    expect(getByTestId('score-card-ds1')).toBeTruthy();
    expect(getByText('82')).toBeTruthy();
    expect(getByText('Great session')).toBeTruthy();
  });

  it('toggles score form visibility on button press', async () => {
    const { getByTestId, queryByTestId } = renderScreen([successMock]);

    await waitFor(() => {
      expect(getByTestId('toggle-score-form')).toBeTruthy();
    });

    expect(queryByTestId('score-form')).toBeNull();

    fireEvent.press(getByTestId('toggle-score-form'));

    expect(getByTestId('score-form')).toBeTruthy();

    fireEvent.press(getByTestId('toggle-score-form'));

    expect(queryByTestId('score-form')).toBeNull();
  });

  it('shows error state on query failure', async () => {
    const { getByTestId } = renderScreen([errorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });
});
