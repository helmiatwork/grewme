import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import FeedScreen from '../../../app/(app)/teacher/feed/index';
import { FeedPostsDocument } from '../../../src/graphql/generated/graphql';

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

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

const feedPostsMock: MockedResponse = {
  request: {
    query: FeedPostsDocument,
    variables: { first: 20 },
  },
  result: {
    data: {
      feedPosts: {
        nodes: [
          {
            id: 'fp1',
            body: 'Hello class!',
            createdAt: '2026-04-02T10:00:00Z',
            likesCount: 5,
            likedByMe: false,
            commentsCount: 2,
            mediaUrls: [],
            teacher: { name: 'Ms. Smith' },
            classroom: { id: 'c1', name: 'Grade 1A' },
            taggedStudents: [{ id: 'st1', name: 'Alice' }],
          },
        ],
        pageInfo: { hasNextPage: false, endCursor: 'c1' },
      },
    },
  },
};

const feedPostsEmptyMock: MockedResponse = {
  request: {
    query: FeedPostsDocument,
    variables: { first: 20 },
  },
  result: {
    data: {
      feedPosts: {
        nodes: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    },
  },
};

const feedPostsErrorMock: MockedResponse = {
  request: {
    query: FeedPostsDocument,
    variables: { first: 20 },
  },
  error: new Error('Network error'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <FeedScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  mockPush.mockClear();
});

describe('FeedScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([feedPostsMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders post list after loading', async () => {
    const { getByTestId, getByText } = renderScreen([feedPostsMock]);

    await waitFor(() => {
      expect(getByTestId('feed-list')).toBeTruthy();
    });

    expect(getByText('Hello class!')).toBeTruthy();
    expect(getByText('Ms. Smith')).toBeTruthy();
  });

  it('renders tagged students row', async () => {
    const { getByText } = renderScreen([feedPostsMock]);

    await waitFor(() => {
      expect(getByText('Alice')).toBeTruthy();
    });
  });

  it('shows empty state when no posts', async () => {
    const { getByText } = renderScreen([feedPostsEmptyMock]);

    await waitFor(() => {
      expect(getByText('No posts yet')).toBeTruthy();
    });
  });

  it('navigates to new post screen on button press', async () => {
    const { getByTestId } = renderScreen([feedPostsMock]);

    // The new-post-button is always visible (rendered before loading check)
    await waitFor(() => {
      expect(getByTestId('new-post-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('new-post-button'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/teacher/feed/new');
  });

  it('navigates to post detail on card press', async () => {
    const { getByTestId } = renderScreen([feedPostsMock]);

    await waitFor(() => {
      expect(getByTestId('post-fp1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('post-fp1'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/teacher/feed/fp1');
  });

  it('shows error state on query failure', async () => {
    const { getByTestId } = renderScreen([feedPostsErrorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });
});
