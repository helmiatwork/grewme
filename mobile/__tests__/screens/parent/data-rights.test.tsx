import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import DataRightsScreen from '../../../app/(app)/parent/data-rights/index';
import { MyChildrenDocument } from '../../../src/graphql/generated/graphql';

jest.mock(
  '@expo/vector-icons',
  () => {
    const { Text } = require('react-native');
    return {
      Ionicons: ({ name, ...props }: { name: string }) => (
        <Text {...props}>{name}</Text>
      ),
    };
  },
  { virtual: true }
);

const childrenMock: MockedResponse = {
  request: {
    query: MyChildrenDocument,
  },
  result: {
    data: {
      myChildren: [
        { id: '1', name: 'Alice', avatar: null },
        { id: '2', name: 'Bob', avatar: null },
      ],
    },
  },
};

const emptyChildrenMock: MockedResponse = {
  request: {
    query: MyChildrenDocument,
  },
  result: {
    data: {
      myChildren: [],
    },
  },
};

const errorMock: MockedResponse = {
  request: {
    query: MyChildrenDocument,
  },
  error: new Error('Network error'),
};

describe('DataRightsScreen', () => {
  it('renders children with action buttons', async () => {
    const { getByTestId, getByText } = render(
      <MockedProvider mocks={[childrenMock]} addTypename={false}>
        <DataRightsScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('data-rights-screen')).toBeTruthy();
    });

    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
    expect(getByTestId('export-button-1')).toBeTruthy();
    expect(getByTestId('delete-data-button-1')).toBeTruthy();
    expect(getByTestId('export-button-2')).toBeTruthy();
    expect(getByTestId('delete-data-button-2')).toBeTruthy();
    expect(getByTestId('account-deletion-button')).toBeTruthy();
  });

  it('shows COPPA info banner', async () => {
    const { getByText } = render(
      <MockedProvider mocks={[childrenMock]} addTypename={false}>
        <DataRightsScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(
        getByText(/Under COPPA, you have the right to review/)
      ).toBeTruthy();
    });
  });

  it('renders empty state when no children', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[emptyChildrenMock]} addTypename={false}>
        <DataRightsScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('data-rights-empty')).toBeTruthy();
    });
  });

  it('renders error state on failure', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <DataRightsScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });

  it('shows loading state initially', () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[childrenMock]} addTypename={false}>
        <DataRightsScreen />
      </MockedProvider>
    );

    expect(getByTestId('loading-state')).toBeTruthy();
  });
});
