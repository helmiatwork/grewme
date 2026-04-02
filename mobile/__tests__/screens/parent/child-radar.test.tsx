import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import RadarScreen from '../../../app/(app)/parent/children/[id]/radar';
import { StudentRadarDocument } from '../../../src/graphql/generated/graphql';

jest.mock('react-native-svg', () => {
  const React = require('react');
  const mockComponent = (name: string) =>
    React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      React.createElement(name, { ...props, ref }),
    );
  return {
    __esModule: true,
    default: mockComponent('Svg'),
    Svg: mockComponent('Svg'),
    Circle: mockComponent('Circle'),
    G: mockComponent('G'),
    Line: mockComponent('Line'),
    Polygon: mockComponent('Polygon'),
    Text: mockComponent('SvgText'),
  };
});

const radarMock: MockedResponse = {
  request: {
    query: StudentRadarDocument,
    variables: { studentId: '1' },
  },
  result: {
    data: {
      studentRadar: {
        studentId: '1',
        studentName: 'Alice',
        skills: {
          reading: 85,
          math: 72,
          writing: 90,
          logic: 65,
          social: 78,
        },
      },
    },
  },
};

const errorMock: MockedResponse = {
  request: {
    query: StudentRadarDocument,
    variables: { studentId: '1' },
  },
  error: new Error('Failed to fetch'),
};

function renderScreen(mocks: MockedResponse[] = [], id = '1') {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <RadarScreen id={id} />
    </MockedProvider>,
  );
}

describe('RadarScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([radarMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders radar chart and student name after loading', async () => {
    const { getByTestId, getByText } = renderScreen([radarMock]);

    await waitFor(() => {
      expect(getByTestId('radar-screen')).toBeTruthy();
    });

    expect(getByText('Alice')).toBeTruthy();
    expect(getByTestId('radar-chart')).toBeTruthy();
  });

  it('renders skill values', async () => {
    const { getByText } = renderScreen([radarMock]);

    await waitFor(() => {
      expect(getByText('85')).toBeTruthy();
    });

    expect(getByText('72')).toBeTruthy();
    expect(getByText('90')).toBeTruthy();
    expect(getByText('65')).toBeTruthy();
    expect(getByText('78')).toBeTruthy();
  });

  it('shows error state on failure', async () => {
    const { getByTestId } = renderScreen([errorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });

    expect(getByTestId('error-retry-button')).toBeTruthy();
  });
});
