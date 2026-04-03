import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import TeacherConversationChatScreen from '../../../app/(app)/teacher/messages/[id]';
import { ConversationDocument } from '../../../src/graphql/generated/graphql';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'conv1' }),
}));

const conversationMock: MockedResponse = {
  request: {
    query: ConversationDocument,
    variables: { id: 'conv1' },
  },
  result: {
    data: {
      conversation: {
        id: 'conv1',
        student: { id: 'st1', name: 'Alice' },
        parent: { id: 'p1', name: 'Parent Jane' },
        teacher: { id: 't1', name: 'Ms. Smith' },
        messages: [
          {
            id: 'm1',
            body: 'Hello!',
            senderName: 'Parent Jane',
            senderType: 'parent',
            senderId: 'p1',
            mine: false,
            createdAt: '2026-04-02T10:00:00Z',
            attachments: [],
          },
        ],
      },
    },
  },
};

const conversationNoMessagesMock: MockedResponse = {
  request: {
    query: ConversationDocument,
    variables: { id: 'conv1' },
  },
  result: {
    data: {
      conversation: {
        id: 'conv1',
        student: { id: 'st1', name: 'Alice' },
        parent: { id: 'p1', name: 'Parent Jane' },
        teacher: { id: 't1', name: 'Ms. Smith' },
        messages: [],
      },
    },
  },
};

const conversationErrorMock: MockedResponse = {
  request: {
    query: ConversationDocument,
    variables: { id: 'conv1' },
  },
  error: new Error('Conversation not found'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <TeacherConversationChatScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TeacherConversationChatScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([conversationMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders chat screen after loading', async () => {
    const { getByTestId } = renderScreen([conversationMock]);

    await waitFor(() => {
      expect(getByTestId('teacher-chat-screen')).toBeTruthy();
    });
  });

  it('renders messages list', async () => {
    const { getByTestId } = renderScreen([conversationMock]);

    await waitFor(() => {
      expect(getByTestId('messages-list')).toBeTruthy();
    });
  });

  it('renders individual message by id', async () => {
    const { getByTestId, getByText } = renderScreen([conversationMock]);

    await waitFor(() => {
      expect(getByTestId('message-m1')).toBeTruthy();
    });

    expect(getByText('Hello!')).toBeTruthy();
    expect(getByText('Parent Jane')).toBeTruthy();
  });

  it('renders message input and send button', async () => {
    const { getByTestId } = renderScreen([conversationMock]);

    await waitFor(() => {
      expect(getByTestId('teacher-chat-screen')).toBeTruthy();
    });

    expect(getByTestId('message-input')).toBeTruthy();
    expect(getByTestId('send-button')).toBeTruthy();
  });

  it('renders empty messages list without crashing', async () => {
    const { getByTestId } = renderScreen([conversationNoMessagesMock]);

    await waitFor(() => {
      expect(getByTestId('messages-list')).toBeTruthy();
    });
  });

  it('shows error state on query failure', async () => {
    const { getByTestId } = renderScreen([conversationErrorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });
});
