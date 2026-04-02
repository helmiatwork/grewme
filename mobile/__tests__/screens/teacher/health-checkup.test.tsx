import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import HealthCheckupsScreen from '../../../app/(app)/teacher/health/index';
import {
  ClassroomOverviewDocument,
  CreateHealthCheckupDocument,
} from '../../../src/graphql/generated/graphql';
import { useAuthStore } from '../../../src/auth/store';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: { testID?: string; onChange?: (event: unknown, date?: Date) => void }) => {
      return React.createElement('View', { testID: props.testID ?? 'date-picker' });
    },
  };
});

jest.spyOn(Alert, 'alert');

const classroomOverviewMock: MockedResponse = {
  request: {
    query: ClassroomOverviewDocument,
    variables: { classroomId: 'c1' },
  },
  result: {
    data: {
      classroomOverview: {
        classroomId: 'c1',
        classroomName: 'Room A',
        students: [
          {
            studentId: 'st1',
            studentName: 'Alice',
            skills: { reading: 3, math: 4, writing: 2, logic: 3, social: 5 },
          },
          {
            studentId: 'st2',
            studentName: 'Bob',
            skills: { reading: 2, math: 3, writing: 4, logic: 2, social: 3 },
          },
        ],
      },
    },
  },
};

const createCheckupSuccessMock: MockedResponse = {
  request: {
    query: CreateHealthCheckupDocument,
  },
  variableMatcher: (vars: Record<string, unknown>) =>
    vars.studentId === 'st1' &&
    typeof vars.measuredAt === 'string' &&
    vars.weightKg === 15.5 &&
    vars.heightCm === 95.0,
  result: {
    data: {
      createHealthCheckup: {
        healthCheckup: {
          id: 'hc1',
          measuredAt: '2026-04-02',
          weightKg: 15.5,
          heightCm: 95.0,
          headCircumferenceCm: null,
          bmi: 17.2,
          bmiCategory: 'Normal',
        },
        errors: [],
      },
    },
  },
};

const createCheckupErrorMock: MockedResponse = {
  request: {
    query: CreateHealthCheckupDocument,
  },
  variableMatcher: (vars: Record<string, unknown>) =>
    vars.studentId === 'st1',
  result: {
    data: {
      createHealthCheckup: {
        healthCheckup: null,
        errors: [{ message: 'Weight must be positive' }],
      },
    },
  },
};

beforeEach(() => {
  useAuthStore.setState({
    token: 'tok',
    userType: 'teacher',
    activeClassroomId: 'c1',
    activeSchoolId: 's1',
    hydrated: true,
  });
  (Alert.alert as jest.Mock).mockClear();
});

function renderWithProvider(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <HealthCheckupsScreen />
    </MockedProvider>,
  );
}

describe('HealthCheckupsScreen', () => {
  it('renders student picker and form fields', async () => {
    const { getByTestId, getByText } = renderWithProvider([
      classroomOverviewMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('health-checkup-screen')).toBeTruthy();
    });

    expect(getByText('Record Health Checkup')).toBeTruthy();
    expect(getByTestId('student-picker-button')).toBeTruthy();
    expect(getByTestId('weight-input')).toBeTruthy();
    expect(getByTestId('height-input')).toBeTruthy();
    expect(getByTestId('head-circumference-input')).toBeTruthy();
    expect(getByTestId('notes-input')).toBeTruthy();
    expect(getByTestId('submit-button')).toBeTruthy();
  });

  it('shows student dropdown when picker is pressed', async () => {
    const { getByTestId, queryByTestId } = renderWithProvider([
      classroomOverviewMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('student-picker-button')).toBeTruthy();
    });

    expect(queryByTestId('student-picker-dropdown')).toBeNull();

    fireEvent.press(getByTestId('student-picker-button'));

    expect(getByTestId('student-picker-dropdown')).toBeTruthy();
    expect(getByTestId('student-option-st1')).toBeTruthy();
    expect(getByTestId('student-option-st2')).toBeTruthy();
  });

  it('selects a student from the picker', async () => {
    const { getByTestId, getByText } = renderWithProvider([
      classroomOverviewMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('student-picker-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('student-picker-button'));
    fireEvent.press(getByTestId('student-option-st1'));

    expect(getByText('Alice')).toBeTruthy();
  });

  it('shows validation alert when no student selected', async () => {
    const { getByTestId } = renderWithProvider([classroomOverviewMock]);

    await waitFor(() => {
      expect(getByTestId('submit-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('submit-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Validation',
      'Please select a student.',
    );
  });

  it('submits checkup and shows success alert', async () => {
    const { getByTestId } = renderWithProvider([
      classroomOverviewMock,
      createCheckupSuccessMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('student-picker-button')).toBeTruthy();
    });

    // Select student
    fireEvent.press(getByTestId('student-picker-button'));
    fireEvent.press(getByTestId('student-option-st1'));

    // Fill weight and height
    fireEvent.changeText(getByTestId('weight-input'), '15.5');
    fireEvent.changeText(getByTestId('height-input'), '95.0');

    // Submit
    fireEvent.press(getByTestId('submit-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        expect.stringContaining('Health checkup recorded'),
      );
    });
  });

  it('shows error from mutation response', async () => {
    const { getByTestId } = renderWithProvider([
      classroomOverviewMock,
      createCheckupErrorMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('student-picker-button')).toBeTruthy();
    });

    // Select student
    fireEvent.press(getByTestId('student-picker-button'));
    fireEvent.press(getByTestId('student-option-st1'));

    // Submit without measurements
    fireEvent.press(getByTestId('submit-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Weight must be positive',
      );
    });
  });
});
