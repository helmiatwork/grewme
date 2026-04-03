import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import FeedPostDetailScreen from '../../../app/(app)/teacher/feed/[id]';
import { FeedPostDocument } from '../../../src/graphql/generated/graphql';

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
  useLocalSearchParams: () => ({ id: 'fp1' }),
}));

const feedPostMock: MockedResponse = {
  request: {
    query: FeedPostDocument,
    variables: { id: 'fp1' },
  },
  result: {
    data: {
      feedPost: {
        id: 'fp1',
        body: 'Hello class!',
        createdAt: '2026-04-02T10:00:00Z',
        likesCount: 3,
        likedByMe: true,
        commentsCount: 1,
        mediaUrls: [],
        mediaAttachments: [],
        teacher: { name: 'Ms. Smith' },
        classroom: { id: 'c1', name: 'Grade 1A' },
        taggedStudents: [{ id: 'st1', name: 'Alice' }],
        comments: [
          {
            id: 'cm1',
            body: 'Nice!',
            commenterName: 'Ms. Smith',
            commenterType: 'teacher',
            isMine: true,
            createdAt: '2026-04-02T11:00:00Z',
          },
        ],
      },
    },
  },
};

const feedPostNoCommentsMock: MockedResponse = {
  request: {
    query: FeedPostDocument,
    variables: { id: 'fp1' },
  },
  result: {
    data: {
      feedPost: {
        id: 'fp1',
        body: 'No comments yet',
        createdAt: '2026-04-02T10:00:00Z',
        likesCount: 0,
        likedByMe: false,
        commentsCount: 0,
        mediaUrls: [],
        mediaAttachments: [],
        teacher: { name: 'Ms. Smith' },
        classroom: { id: 'c1', name: 'Grade 1A' },
        taggedStudents: [],
        comments: [],
      },
    },
  },
};

const feedPostErrorMock: MockedResponse = {
  request: {
    query: FeedPostDocument,
    variables: { id: 'fp1' },
  },
  error: new Error('Post not found'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <FeedPostDetailScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('FeedPostDetailScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([feedPostMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders post body after loading', async () => {
    const { getByTestId, getByText, getAllByText } = renderScreen([feedPostMock]);

    await waitFor(() => {
      expect(getByTestId('feed-post-detail')).toBeTruthy();
    });

    expect(getByText('Hello class!')).toBeTruthy();
    // Ms. Smith appears in post header and comment author — both are valid
    expect(getAllByText('Ms. Smith').length).toBeGreaterThanOrEqual(1);
  });

  it('renders comments list', async () => {
    const { getByTestId, getByText } = renderScreen([feedPostMock]);

    await waitFor(() => {
      expect(getByTestId('comments-list')).toBeTruthy();
    });

    expect(getByTestId('comment-cm1')).toBeTruthy();
    expect(getByText('Nice!')).toBeTruthy();
  });

  it('shows empty comments placeholder when no comments', async () => {
    const { getByTestId } = renderScreen([feedPostNoCommentsMock]);

    await waitFor(() => {
      expect(getByTestId('no-comments')).toBeTruthy();
    });
  });

  it('renders comment input and send button', async () => {
    const { getByTestId } = renderScreen([feedPostMock]);

    await waitFor(() => {
      expect(getByTestId('feed-post-detail')).toBeTruthy();
    });

    expect(getByTestId('comment-input')).toBeTruthy();
    expect(getByTestId('send-comment-button')).toBeTruthy();
  });

  it('shows error state on query failure', async () => {
    const { getByTestId } = renderScreen([feedPostErrorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });
});
