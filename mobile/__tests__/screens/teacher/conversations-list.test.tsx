import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import TeacherConversationsScreen from '../../../app/(app)/teacher/messages/index';
import { ConversationsDocument } from '../../../src/graphql/generated/graphql';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

const conversationsMock: MockedResponse = {
  request: { query: ConversationsDocument },
  result: {
    data: {
      conversations: [
        {
          id: 'conv1',
          student: { id: 'st1', name: 'Alice' },
          parent: { id: 'p1', name: 'Parent Jane' },
          teacher: { id: 't1', name: 'Ms. Smith' },
          lastMessage: {
            id: 'm1',
            body: 'Hello!',
            senderName: 'Parent Jane',
            mine: false,
            createdAt: '2026-04-02T10:00:00Z',
          },
          unreadCount: 2,
          createdAt: '2026-04-01T08:00:00Z',
        },
      ],
    },
  },
};

const conversationsEmptyMock: MockedResponse = {
  request: { query: ConversationsDocument },
  result: {
    data: { conversations: [] },
  },
};

const conversationsErrorMock: MockedResponse = {
  request: { query: ConversationsDocument },
  error: new Error('Network error'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <TeacherConversationsScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  mockPush.mockClear();
});

describe('TeacherConversationsScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([conversationsMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders conversations list after loading', async () => {
    const { getByTestId } = renderScreen([conversationsMock]);

    await waitFor(() => {
      expect(getByTestId('teacher-conversations-screen')).toBeTruthy();
    });

    expect(getByTestId('conversations-list')).toBeTruthy();
    expect(getByTestId('conversation-conv1')).toBeTruthy();
  });

  it('shows parent name and student name', async () => {
    const { getByText } = renderScreen([conversationsMock]);

    await waitFor(() => {
      expect(getByText('Parent Jane')).toBeTruthy();
    });

    expect(getByText('Re: Alice')).toBeTruthy();
  });

  it('shows last message preview', async () => {
    const { getByText } = renderScreen([conversationsMock]);

    await waitFor(() => {
      expect(getByText('Hello!')).toBeTruthy();
    });
  });

  it('shows unread badge when unreadCount > 0', async () => {
    const { getByTestId } = renderScreen([conversationsMock]);

    await waitFor(() => {
      expect(getByTestId('unread-conv1')).toBeTruthy();
    });
  });

  it('shows empty state when no conversations', async () => {
    const { getByTestId } = renderScreen([conversationsEmptyMock]);

    await waitFor(() => {
      expect(getByTestId('conversations-empty')).toBeTruthy();
    });
  });

  it('navigates to chat on conversation press', async () => {
    const { getByTestId } = renderScreen([conversationsMock]);

    await waitFor(() => {
      expect(getByTestId('conversation-conv1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('conversation-conv1'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/teacher/messages/conv1');
  });

  it('shows error state on query failure', async () => {
    const { getByTestId } = renderScreen([conversationsErrorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });
});
