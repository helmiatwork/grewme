import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import NewFeedPostScreen from '../../../app/(app)/teacher/feed/new';
import { ClassroomsDocument } from '../../../src/graphql/generated/graphql';

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

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
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

const classroomsEmptyMock: MockedResponse = {
  request: { query: ClassroomsDocument },
  result: {
    data: { classrooms: [] },
  },
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <NewFeedPostScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NewFeedPostScreen', () => {
  it('renders the form container', () => {
    const { getByTestId } = renderScreen([classroomsMock]);
    expect(getByTestId('new-post-screen')).toBeTruthy();
  });

  it('renders the post body input', () => {
    const { getByTestId } = renderScreen([classroomsMock]);
    expect(getByTestId('post-body-input')).toBeTruthy();
  });

  it('renders the submit button', () => {
    const { getByTestId } = renderScreen([classroomsMock]);
    expect(getByTestId('submit-post-button')).toBeTruthy();
  });

  it('renders classroom chips after loading', async () => {
    const { getByTestId } = renderScreen([classroomsMock]);

    await waitFor(() => {
      expect(getByTestId('classroom-c1')).toBeTruthy();
    });

    expect(getByTestId('classroom-c2')).toBeTruthy();
  });

  it('renders classroom names', async () => {
    const { getByText } = renderScreen([classroomsMock]);

    await waitFor(() => {
      expect(getByText('Grade 1A')).toBeTruthy();
    });

    expect(getByText('Grade 2B')).toBeTruthy();
  });

  it('renders no classroom chips when list is empty', async () => {
    const { queryByTestId } = renderScreen([classroomsEmptyMock]);

    await waitFor(() => {
      // loading-state should be gone
      expect(queryByTestId('loading-state')).toBeNull();
    });

    expect(queryByTestId('classroom-c1')).toBeNull();
  });
});
