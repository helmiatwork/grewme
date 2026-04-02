import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import ChildrenListScreen from '../../../app/(app)/parent/children/index';
import { MyChildrenDocument } from '../../../src/graphql/generated/graphql';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

const childrenMock: MockedResponse = {
  request: { query: MyChildrenDocument },
  result: {
    data: {
      myChildren: [
        { id: '1', name: 'Alice', avatar: null },
        { id: '2', name: 'Bob', avatar: null },
      ],
    },
  },
};

const errorMock: MockedResponse = {
  request: { query: MyChildrenDocument },
  error: new Error('Network error'),
};

const emptyMock: MockedResponse = {
  request: { query: MyChildrenDocument },
  result: { data: { myChildren: [] } },
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ChildrenListScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  mockPush.mockClear();
});

describe('ChildrenListScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([childrenMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders children list after loading', async () => {
    const { getByTestId, getByText } = renderScreen([childrenMock]);

    await waitFor(() => {
      expect(getByTestId('children-list')).toBeTruthy();
    });

    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('shows error state on failure', async () => {
    const { getByTestId } = renderScreen([errorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });

    expect(getByTestId('error-retry-button')).toBeTruthy();
  });

  it('shows empty state when no children', async () => {
    const { getByTestId } = renderScreen([emptyMock]);

    await waitFor(() => {
      expect(getByTestId('children-empty')).toBeTruthy();
    });
  });

  it('navigates to radar on child card press', async () => {
    const { getByTestId } = renderScreen([childrenMock]);

    await waitFor(() => {
      expect(getByTestId('child-card-1')).toBeTruthy();
    });

    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.press(getByTestId('child-card-1'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/parent/children/1/radar');
  });
});
