import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import ConversationsScreen from '../../../app/(app)/parent/messages/index';
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
          id: '1',
          student: { id: 's1', name: 'Alice' },
          parent: { id: 'p1', name: 'Parent A' },
          teacher: { id: 't1', name: 'Ms. Smith' },
          lastMessage: {
            id: 'm1',
            body: 'Hello there',
            senderName: 'Ms. Smith',
            mine: false,
            createdAt: new Date().toISOString(),
          },
          unreadCount: 2,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          student: { id: 's2', name: 'Bob' },
          parent: { id: 'p1', name: 'Parent A' },
          teacher: { id: 't2', name: 'Mr. Jones' },
          lastMessage: null,
          unreadCount: 0,
          createdAt: new Date().toISOString(),
        },
      ],
    },
  },
};

const errorMock: MockedResponse = {
  request: { query: ConversationsDocument },
  error: new Error('Network error'),
};

const emptyMock: MockedResponse = {
  request: { query: ConversationsDocument },
  result: { data: { conversations: [] } },
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ConversationsScreen />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockPush.mockClear();
});

describe('ConversationsScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([conversationsMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders conversations after loading', async () => {
    const { getByTestId, getByText } = renderScreen([conversationsMock]);

    await waitFor(() => {
      expect(getByTestId('conversations-list')).toBeTruthy();
    });

    expect(getByText('Ms. Smith')).toBeTruthy();
    expect(getByText('Mr. Jones')).toBeTruthy();
    expect(getByText('Hello there')).toBeTruthy();
    expect(getByText('Re: Alice')).toBeTruthy();
  });

  it('shows unread badge when count > 0', async () => {
    const { getByTestId, queryByTestId } = renderScreen([conversationsMock]);

    await waitFor(() => {
      expect(getByTestId('conversations-list')).toBeTruthy();
    });

    expect(getByTestId('unread-1')).toBeTruthy();
    expect(queryByTestId('unread-2')).toBeNull();
  });

  it('shows error state on failure', async () => {
    const { getByTestId } = renderScreen([errorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });

    expect(getByTestId('error-retry-button')).toBeTruthy();
  });

  it('shows empty state when no conversations', async () => {
    const { getByTestId } = renderScreen([emptyMock]);

    await waitFor(() => {
      expect(getByTestId('conversations-empty')).toBeTruthy();
    });
  });

  it('navigates to conversation on press', async () => {
    const { getByTestId } = renderScreen([conversationsMock]);

    await waitFor(() => {
      expect(getByTestId('conversation-1')).toBeTruthy();
    });

    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.press(getByTestId('conversation-1'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/parent/messages/1');
  });
});
