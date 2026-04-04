import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import StudentHealthScreen from '../../../app/(app)/teacher/students/[id]/health';
import {
  StudentHealthCheckupsDocument,
  CreateHealthCheckupDocument,
} from '../../../src/graphql/generated/graphql';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'st1' }),
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: { testID?: string }) => <View testID={props.testID ?? 'date-picker'} />,
  };
});

const checkupsMock: MockedResponse = {
  request: {
    query: StudentHealthCheckupsDocument,
    variables: { studentId: 'st1' },
  },
  result: {
    data: {
      studentHealthCheckups: [
        {
          id: 'hc1',
          measuredAt: '2026-03-01',
          weightKg: 15.5,
          heightCm: 95.0,
          headCircumferenceCm: 48.2,
          bmi: 17.2,
          bmiCategory: 'Normal',
          notes: 'Healthy child',
        },
        {
          id: 'hc2',
          measuredAt: '2026-01-15',
          weightKg: 14.8,
          heightCm: 94.0,
          headCircumferenceCm: null,
          bmi: 16.7,
          bmiCategory: 'Normal',
          notes: null,
        },
      ],
    },
  },
};

const emptyCheckupsMock: MockedResponse = {
  request: {
    query: StudentHealthCheckupsDocument,
    variables: { studentId: 'st1' },
  },
  result: {
    data: {
      studentHealthCheckups: [],
    },
  },
};

const errorMock: MockedResponse = {
  request: {
    query: StudentHealthCheckupsDocument,
    variables: { studentId: 'st1' },
  },
  error: new Error('Network error'),
};

const createCheckupMock: MockedResponse = {
  request: {
    query: CreateHealthCheckupDocument,
    variables: {
      studentId: 'st1',
      measuredAt: expect.any(String),
      weightKg: 16.0,
      heightCm: 96.0,
      headCircumferenceCm: undefined,
      notes: undefined,
    },
  },
  result: {
    data: {
      createHealthCheckup: {
        healthCheckup: {
          id: 'hc3',
          measuredAt: '2026-04-03',
          weightKg: 16.0,
          heightCm: 96.0,
          headCircumferenceCm: null,
          bmi: 17.3,
          bmiCategory: 'Normal',
        },
        errors: [],
      },
    },
  },
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <StudentHealthScreen />
    </MockedProvider>,
  );
}

describe('StudentHealthScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([checkupsMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders checkup list after loading', async () => {
    const { getByTestId } = renderScreen([checkupsMock]);

    await waitFor(() => {
      expect(getByTestId('student-health-screen')).toBeTruthy();
    });

    expect(getByTestId('checkup-hc1')).toBeTruthy();
    expect(getByTestId('checkup-hc2')).toBeTruthy();
  });

  it('shows checkup date and metrics', async () => {
    const { getByText } = renderScreen([checkupsMock]);

    await waitFor(() => {
      expect(getByText('2026-03-01')).toBeTruthy();
    });

    expect(getByText('15.5 kg')).toBeTruthy();
    expect(getByText('95 cm')).toBeTruthy();
  });

  it('shows empty message when no checkups', async () => {
    const { getByText } = renderScreen([emptyCheckupsMock]);

    await waitFor(() => {
      expect(getByText('No health checkups recorded yet.')).toBeTruthy();
    });
  });

  it('shows error state on query failure', async () => {
    const { getByTestId } = renderScreen([errorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });

  it('toggles form visibility', async () => {
    const { getByTestId, queryByTestId } = renderScreen([checkupsMock]);

    await waitFor(() => {
      expect(getByTestId('student-health-screen')).toBeTruthy();
    });

    expect(queryByTestId('submit-checkup')).toBeNull();

    fireEvent.press(getByTestId('toggle-form'));
    expect(getByTestId('submit-checkup')).toBeTruthy();

    fireEvent.press(getByTestId('toggle-form'));
    expect(queryByTestId('submit-checkup')).toBeNull();
  });

  it('renders form fields when form is open', async () => {
    const { getByTestId } = renderScreen([checkupsMock]);

    await waitFor(() => {
      expect(getByTestId('student-health-screen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('toggle-form'));

    expect(getByTestId('date-picker-button')).toBeTruthy();
    expect(getByTestId('weight-input')).toBeTruthy();
    expect(getByTestId('height-input')).toBeTruthy();
    expect(getByTestId('head-circumference-input')).toBeTruthy();
    expect(getByTestId('notes-input')).toBeTruthy();
  });

  it('shows BMI preview when weight and height are entered', async () => {
    const { getByTestId, getByText } = renderScreen([checkupsMock]);

    await waitFor(() => {
      expect(getByTestId('student-health-screen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('toggle-form'));
    fireEvent.changeText(getByTestId('weight-input'), '16.0');
    fireEvent.changeText(getByTestId('height-input'), '96.0');

    // BMI = 16.0 / (0.96)^2 ≈ 17.4
    expect(getByText(/Estimated BMI: \d+\.\d/)).toBeTruthy();
  });

  it('shows BMI category on checkup card', async () => {
    const { getAllByText } = renderScreen([checkupsMock]);

    await waitFor(() => {
      expect(getAllByText('Normal').length).toBeGreaterThan(0);
    });
  });

  it('shows notes when present on a checkup', async () => {
    const { getByText } = renderScreen([checkupsMock]);

    await waitFor(() => {
      expect(getByText('Healthy child')).toBeTruthy();
    });
  });
});
