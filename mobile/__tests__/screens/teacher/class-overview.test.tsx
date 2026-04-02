import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import ClassOverviewScreen from '../../../app/(app)/teacher/students/index';
import { ClassroomOverviewDocument } from '../../../src/graphql/generated/graphql';
import { useAuthStore } from '../../../src/auth/store';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

// Mock RadarChart to avoid SVG rendering issues in tests
jest.mock('../../../src/components/RadarChart', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: { skills: Record<string, number>; size?: number }) => (
      <View testID="radar-chart" {...props} />
    ),
  };
});

const overviewMock: MockedResponse = {
  request: {
    query: ClassroomOverviewDocument,
    variables: { classroomId: 'c1' },
  },
  result: {
    data: {
      classroomOverview: {
        classroomId: 'c1',
        classroomName: 'Grade 1A',
        students: [
          {
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
          {
            studentId: 'st2',
            studentName: 'Bob',
            skills: {
              reading: 40,
              math: 90,
              writing: 55,
              logic: 75,
              social: 60,
            },
          },
        ],
      },
    },
  },
};

const overviewErrorMock: MockedResponse = {
  request: {
    query: ClassroomOverviewDocument,
    variables: { classroomId: 'c1' },
  },
  error: new Error('Network error'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ClassOverviewScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  mockPush.mockClear();
  useAuthStore.getState().clearAuth();
});

describe('ClassOverviewScreen', () => {
  it('shows no-classroom message when no activeClassroomId', () => {
    const { getByTestId } = renderScreen([]);
    expect(getByTestId('no-classroom-state')).toBeTruthy();
  });

  it('shows loading state', () => {
    useAuthStore.getState().setActiveClassroomId('c1');
    const { getByTestId } = renderScreen([overviewMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders student cards with radar charts (N+1 safe -- single query)', async () => {
    useAuthStore.getState().setActiveClassroomId('c1');
    const { getByTestId, getByText, getAllByTestId } = renderScreen([
      overviewMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('class-overview')).toBeTruthy();
    });

    expect(getByText('Grade 1A')).toBeTruthy();
    expect(getByText('2 students')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();

    // Radar charts rendered (mocked) -- one per student
    const charts = getAllByTestId('radar-chart');
    expect(charts).toHaveLength(2);
  });

  it('navigates to behavior screen on student card press', async () => {
    useAuthStore.getState().setActiveClassroomId('c1');
    const { getByTestId } = renderScreen([overviewMock]);

    await waitFor(() => {
      expect(getByTestId('class-overview')).toBeTruthy();
    });

    fireEvent.press(getByTestId('student-card-st1'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(app)/teacher/behavior',
      params: { studentId: 'st1' },
    });
  });

  it('shows error state on query failure', async () => {
    useAuthStore.getState().setActiveClassroomId('c1');
    const { getByTestId } = renderScreen([overviewErrorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });
});
