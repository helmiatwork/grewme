import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import TeacherDashboardScreen from '../../../app/(app)/teacher/index';
import {
  ClassroomsDocument,
  ClassroomBehaviorTodayDocument,
} from '../../../src/graphql/generated/graphql';
import { useAuthStore } from '../../../src/auth/store';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

const classroomsMock: MockedResponse = {
  request: { query: ClassroomsDocument },
  result: {
    data: {
      classrooms: [
        { id: 'c1', name: 'Grade 1A', school: { id: 's1' } },
        { id: 'c2', name: 'Grade 2B', school: { id: 's1' } },
      ],
    },
  },
};

const behaviorMock: MockedResponse = {
  request: {
    query: ClassroomBehaviorTodayDocument,
    variables: { classroomId: 'c1' },
  },
  result: {
    data: {
      classroomBehaviorToday: [
        {
          student: { id: 'st1', name: 'Alice' },
          totalPoints: 5,
          positiveCount: 3,
          negativeCount: 1,
          recentPoints: [
            {
              id: 'bp1',
              pointValue: 2,
              awardedAt: '2026-04-02T10:00:00Z',
              behaviorCategory: { name: 'Helping Others', isPositive: true },
            },
          ],
        },
        {
          student: { id: 'st2', name: 'Bob' },
          totalPoints: -1,
          positiveCount: 0,
          negativeCount: 1,
          recentPoints: [
            {
              id: 'bp2',
              pointValue: -1,
              awardedAt: '2026-04-02T09:30:00Z',
              behaviorCategory: { name: 'Disruption', isPositive: false },
            },
          ],
        },
      ],
    },
  },
};

const classroomsErrorMock: MockedResponse = {
  request: { query: ClassroomsDocument },
  error: new Error('Network error'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <TeacherDashboardScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  useAuthStore.getState().clearAuth();
});

describe('TeacherDashboardScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([classroomsMock, behaviorMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders classroom name and behavior list after loading', async () => {
    const { getByTestId, getByText } = renderScreen([
      classroomsMock,
      behaviorMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('teacher-dashboard')).toBeTruthy();
    });

    expect(getByTestId('classroom-name').props.children).toBe('Grade 1A');
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
    expect(getByTestId('total-points-st1').props.children).toEqual([5, ' pts']);
  });

  it('sets activeClassroomId and activeSchoolId in Zustand', async () => {
    renderScreen([classroomsMock, behaviorMock]);

    await waitFor(() => {
      expect(useAuthStore.getState().activeClassroomId).toBe('c1');
    });

    expect(useAuthStore.getState().activeSchoolId).toBe('s1');
  });

  it('renders positive and negative count badges', async () => {
    const { getByTestId, getAllByText, getByText } = renderScreen([
      classroomsMock,
      behaviorMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('teacher-dashboard')).toBeTruthy();
    });

    // Alice: +3 positive, Bob: +0 positive
    expect(getByText('+3')).toBeTruthy();
    expect(getByText('+0')).toBeTruthy();
    // Both Alice and Bob have negativeCount: 1, so two "-1" badge texts
    expect(getAllByText('-1').length).toBeGreaterThanOrEqual(2);
  });

  it('renders recent points with category name', async () => {
    const { getByText } = renderScreen([classroomsMock, behaviorMock]);

    await waitFor(() => {
      expect(getByText('+2 Helping Others')).toBeTruthy();
    });

    expect(getByText('-1 Disruption')).toBeTruthy();
  });

  it('shows error state on classrooms query failure', async () => {
    const { getByTestId } = renderScreen([classroomsErrorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });
});
