import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import ProgressScreen from '../../../app/(app)/parent/children/[id]/progress';
import { StudentProgressDocument } from '../../../src/graphql/generated/graphql';

jest.mock('react-native-svg', () => {
  const React = require('react');
  const mockComponent = (name: string) =>
    React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      React.createElement(name, { ...props, ref })
    );
  return {
    __esModule: true,
    default: mockComponent('Svg'),
    Svg: mockComponent('Svg'),
    Circle: mockComponent('Circle'),
    Line: mockComponent('Line'),
    Polyline: mockComponent('Polyline'),
    Text: mockComponent('SvgText'),
  };
});

const progressMock: MockedResponse = {
  request: {
    query: StudentProgressDocument,
    variables: { studentId: '1' },
  },
  result: {
    data: {
      studentProgress: {
        weeks: [
          {
            period: 'Week of Mar 3',
            skills: {
              reading: 70,
              math: 65,
              writing: 80,
              logic: 55,
              social: 72,
            },
          },
          {
            period: 'Week of Mar 10',
            skills: {
              reading: 75,
              math: 68,
              writing: 82,
              logic: 60,
              social: 74,
            },
          },
          {
            period: 'Week of Mar 17',
            skills: {
              reading: 78,
              math: 72,
              writing: 85,
              logic: 62,
              social: 76,
            },
          },
          {
            period: 'Week of Mar 24',
            skills: {
              reading: 82,
              math: 75,
              writing: 88,
              logic: 68,
              social: 80,
            },
          },
          {
            period: 'Week of Mar 31',
            skills: {
              reading: 85,
              math: 78,
              writing: 90,
              logic: 70,
              social: 82,
            },
          },
        ],
      },
    },
  },
};

const emptyMock: MockedResponse = {
  request: {
    query: StudentProgressDocument,
    variables: { studentId: '1' },
  },
  result: {
    data: {
      studentProgress: {
        weeks: [],
      },
    },
  },
};

const errorMock: MockedResponse = {
  request: {
    query: StudentProgressDocument,
    variables: { studentId: '1' },
  },
  error: new Error('Network error'),
};

function renderScreen(mocks: MockedResponse[] = [], id = '1') {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ProgressScreen id={id} />
    </MockedProvider>
  );
}

describe('ProgressScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([progressMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders chart and skill summary after loading', async () => {
    const { getByTestId, getByText } = renderScreen([progressMock]);

    await waitFor(() => {
      expect(getByTestId('progress-screen')).toBeTruthy();
    });

    expect(getByText('Weekly Progress')).toBeTruthy();
    expect(getByTestId('line-chart')).toBeTruthy();
    expect(getByTestId('line-chart-legend')).toBeTruthy();
  });

  it('displays latest week skill values', async () => {
    const { getByText } = renderScreen([progressMock]);

    await waitFor(() => {
      expect(getByText('Latest Week')).toBeTruthy();
    });

    // Last week values: reading 85, math 78, writing 90, logic 70, social 82
    expect(getByText('85')).toBeTruthy();
    expect(getByText('78')).toBeTruthy();
    expect(getByText('90')).toBeTruthy();
    expect(getByText('70')).toBeTruthy();
    expect(getByText('82')).toBeTruthy();
  });

  it('shows empty state when no weeks', async () => {
    const { getByTestId } = renderScreen([emptyMock]);

    await waitFor(() => {
      expect(getByTestId('progress-empty')).toBeTruthy();
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
