import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import ParentDashboardScreen from '../../../app/(app)/parent/dashboard';
import {
  MyChildrenDocument,
  StudentRadarDocument,
} from '../../../src/graphql/generated/graphql';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('../../../src/components/RadarChart', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ size }: { size?: number }) =>
      React.createElement(View, { testID: 'radar-chart', accessibilityLabel: `size-${size}` }),
  };
});

const myChildrenMock: MockedResponse = {
  request: { query: MyChildrenDocument },
  result: {
    data: {
      myChildren: [
        { id: 'child-1', name: 'Alice', avatar: null },
        { id: 'child-2', name: 'Bob', avatar: null },
      ],
    },
  },
};

const radarMockChild1: MockedResponse = {
  request: { query: StudentRadarDocument, variables: { studentId: 'child-1' } },
  result: {
    data: {
      studentRadar: {
        studentId: 'child-1',
        studentName: 'Alice',
        skills: { reading: 80, math: 70, writing: 85, logic: 60, social: 75 },
      },
    },
  },
};

const radarMockChild2: MockedResponse = {
  request: { query: StudentRadarDocument, variables: { studentId: 'child-2' } },
  result: {
    data: {
      studentRadar: {
        studentId: 'child-2',
        studentName: 'Bob',
        skills: { reading: 65, math: 90, writing: 70, logic: 80, social: 55 },
      },
    },
  },
};

const childrenErrorMock: MockedResponse = {
  request: { query: MyChildrenDocument },
  error: new Error('Network error'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ParentDashboardScreen />
    </MockedProvider>,
  );
}

describe('ParentDashboardScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([
      myChildrenMock,
      radarMockChild1,
      radarMockChild2,
    ]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders child cards with radar charts after loading', async () => {
    const { getByTestId, getByText, getAllByTestId } = renderScreen([
      myChildrenMock,
      radarMockChild1,
      radarMockChild2,
    ]);

    await waitFor(() => {
      expect(getByTestId('parent-dashboard')).toBeTruthy();
    });

    expect(getByTestId('child-card-child-1')).toBeTruthy();
    expect(getByTestId('child-card-child-2')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();

    await waitFor(() => {
      expect(getAllByTestId('radar-chart').length).toBe(2);
    });
  });

  it('navigates to radar screen when a child card is pressed', async () => {
    const { getByTestId } = renderScreen([
      myChildrenMock,
      radarMockChild1,
      radarMockChild2,
    ]);

    await waitFor(() => {
      expect(getByTestId('child-card-child-1')).toBeTruthy();
    });

    const { router } = require('expo-router');
    fireEvent.press(getByTestId('child-card-child-1'));
    expect(router.push).toHaveBeenCalledWith(
      '/(app)/parent/children/child-1/radar',
    );
  });

  it('shows error state on children query failure', async () => {
    const { getByTestId } = renderScreen([childrenErrorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });
});
