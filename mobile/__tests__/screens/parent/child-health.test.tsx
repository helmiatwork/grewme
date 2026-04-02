import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import HealthScreen from '../../../app/(app)/parent/children/[id]/health';
import { StudentHealthCheckupsDocument } from '../../../src/graphql/generated/graphql';

function makeCheckup(
  id: string,
  measuredAt: string,
  opts: {
    weightKg?: number;
    heightCm?: number;
    bmi?: number;
    bmiCategory?: string;
    headCircumferenceCm?: number;
    notes?: string;
  } = {}
) {
  return {
    id,
    measuredAt,
    weightKg: opts.weightKg ?? null,
    heightCm: opts.heightCm ?? null,
    headCircumferenceCm: opts.headCircumferenceCm ?? null,
    bmi: opts.bmi ?? null,
    bmiCategory: opts.bmiCategory ?? null,
    notes: opts.notes ?? null,
  };
}

const successMock: MockedResponse = {
  request: {
    query: StudentHealthCheckupsDocument,
    variables: { studentId: '1' },
  },
  result: {
    data: {
      studentHealthCheckups: [
        makeCheckup('1', '2026-04-01', {
          weightKg: 25.5,
          heightCm: 120,
          bmi: 17.7,
          bmiCategory: 'normal',
          notes: 'Healthy',
        }),
        makeCheckup('2', '2026-03-01', {
          weightKg: 24.8,
          heightCm: 119,
          bmi: 17.5,
          bmiCategory: 'normal',
        }),
        makeCheckup('3', '2026-02-01', {
          weightKg: 24.0,
          heightCm: 118,
          bmi: 17.2,
          bmiCategory: 'underweight',
        }),
      ],
    },
  },
};

const emptyMock: MockedResponse = {
  request: {
    query: StudentHealthCheckupsDocument,
    variables: { studentId: '2' },
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
    variables: { studentId: '3' },
  },
  error: new Error('Consent required'),
};

describe('HealthScreen', () => {
  it('renders health records with latest card', async () => {
    const { getByTestId, getByText, getAllByText } = render(
      <MockedProvider mocks={[successMock]} addTypename={false}>
        <HealthScreen id="1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('health-screen')).toBeTruthy();
    });

    expect(getByText('Latest Checkup')).toBeTruthy();
    // Latest card + list both show the same values, so use getAllByText
    expect(getAllByText('120').length).toBeGreaterThanOrEqual(1); // height
    expect(getAllByText('25.5').length).toBeGreaterThanOrEqual(1); // weight
    expect(getAllByText('17.7').length).toBeGreaterThanOrEqual(1); // BMI
    expect(getByTestId('health-list')).toBeTruthy();
    expect(getByTestId('health-item-1')).toBeTruthy();
    expect(getByText('Healthy')).toBeTruthy();
  });

  it('renders empty state when no records', async () => {
    const { getByTestId, getByText } = render(
      <MockedProvider mocks={[emptyMock]} addTypename={false}>
        <HealthScreen id="2" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('health-empty')).toBeTruthy();
    });

    expect(getByText('No health checkup records available')).toBeTruthy();
  });

  it('renders error state on failure', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <HealthScreen id="3" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });

  it('shows loading state initially', () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[successMock]} addTypename={false}>
        <HealthScreen id="1" />
      </MockedProvider>
    );

    expect(getByTestId('loading-state')).toBeTruthy();
  });
});
