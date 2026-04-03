import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import BulkScoreScreen from '../../../app/(app)/teacher/students/bulk-score';
import {
  ClassroomOverviewDocument,
} from '../../../src/graphql/generated/graphql';
import { useAuthStore } from '../../../src/auth/store';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <View testID="date-picker" {...props} />
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

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <BulkScoreScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.getState().clearAuth();
});

describe('BulkScoreScreen', () => {
  it('shows no-classroom message when no activeClassroomId', () => {
    const { getByTestId } = renderScreen([]);
    expect(getByTestId('no-classroom')).toBeTruthy();
  });

  it('shows loading indicator while query is in flight', () => {
    useAuthStore.setState({
      token: 'tok',
      userType: 'teacher',
      activeClassroomId: 'c1',
      activeSchoolId: 's1',
      hydrated: true,
    });
    const { getByTestId } = renderScreen([overviewMock]);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders student list with score inputs after loading', async () => {
    useAuthStore.setState({
      token: 'tok',
      userType: 'teacher',
      activeClassroomId: 'c1',
      activeSchoolId: 's1',
      hydrated: true,
    });
    const { getByTestId, getByText } = renderScreen([overviewMock]);

    await waitFor(() => {
      expect(getByTestId('student-list')).toBeTruthy();
    });

    expect(getByTestId('student-row-st1')).toBeTruthy();
    expect(getByTestId('student-row-st2')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
    expect(getByTestId('score-input-st1')).toBeTruthy();
    expect(getByTestId('score-input-st2')).toBeTruthy();
  });

  it('shows skill chips for each skill category', async () => {
    useAuthStore.setState({
      token: 'tok',
      userType: 'teacher',
      activeClassroomId: 'c1',
      activeSchoolId: 's1',
      hydrated: true,
    });
    const { getByTestId } = renderScreen([overviewMock]);

    await waitFor(() => {
      expect(getByTestId('bulk-score-screen')).toBeTruthy();
    });

    expect(getByTestId('skill-chip-READING')).toBeTruthy();
    expect(getByTestId('skill-chip-MATH')).toBeTruthy();
    expect(getByTestId('skill-chip-WRITING')).toBeTruthy();
    expect(getByTestId('skill-chip-LOGIC')).toBeTruthy();
    expect(getByTestId('skill-chip-SOCIAL')).toBeTruthy();
  });

  it('renders submit button', async () => {
    useAuthStore.setState({
      token: 'tok',
      userType: 'teacher',
      activeClassroomId: 'c1',
      activeSchoolId: 's1',
      hydrated: true,
    });
    const { getByTestId } = renderScreen([overviewMock]);

    await waitFor(() => {
      expect(getByTestId('bulk-score-screen')).toBeTruthy();
    });

    expect(getByTestId('submit-scores')).toBeTruthy();
  });

  it('updates score input value when user types', async () => {
    useAuthStore.setState({
      token: 'tok',
      userType: 'teacher',
      activeClassroomId: 'c1',
      activeSchoolId: 's1',
      hydrated: true,
    });
    const { getByTestId } = renderScreen([overviewMock]);

    await waitFor(() => {
      expect(getByTestId('score-input-st1')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('score-input-st1'), '85');
    expect(getByTestId('score-input-st1').props.value).toBe('85');
  });
});
