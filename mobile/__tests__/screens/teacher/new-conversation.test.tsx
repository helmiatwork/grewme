import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type React from 'react';
import MessagesScreen from '../../../app/(app)/teacher/messages/index';
import {
  ClassroomsDocument,
  ConversationsDocument,
} from '../../../src/graphql/generated/graphql';

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
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

const conversationsMock: MockedResponse = {
  request: {
    query: ConversationsDocument,
    variables: {},
  },
  result: {
    data: {
      conversations: [
        {
          id: 'conv1',
          student: { id: 's1', name: 'Ahmad' },
          parent: {
            id: 'p1',
            name: 'Budi',
            email: 'budi@test.com',
            role: 'parent',
            children: [],
          },
          teacher: {
            id: 't1',
            name: 'Teacher One',
            email: 't@test.com',
            role: 'teacher',
            classrooms: [],
          },
          lastMessage: {
            id: 'm1',
            body: 'Hello',
            senderName: 'Budi',
            senderType: 'Parent',
            senderId: 'p1',
            mine: false,
            createdAt: '2026-04-04T10:00:00Z',
            attachments: [],
          },
          unreadCount: 1,
          messages: [],
          createdAt: '2026-04-01T08:00:00Z',
        },
      ],
    },
  },
};

const classroomsMock: MockedResponse = {
  request: {
    query: ClassroomsDocument,
    variables: {},
  },
  result: {
    data: {
      classrooms: [
        {
          id: 'c1',
          name: 'Class 1A',
          grade: 1,
          school: { id: 's1', name: 'School' },
        },
      ],
    },
  },
};

describe('MessagesScreen — new conversation', () => {
  it('renders the new conversation FAB', async () => {
    const { getByTestId } = render(
      <MockedProvider
        mocks={[conversationsMock, classroomsMock]}
        addTypename={false}
      >
        <MessagesScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('new-conversation-fab')).toBeTruthy();
    });
  });

  it('opens modal on FAB press', async () => {
    const { getByTestId } = render(
      <MockedProvider
        mocks={[conversationsMock, classroomsMock]}
        addTypename={false}
      >
        <MessagesScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('new-conversation-fab')).toBeTruthy();
    });

    fireEvent.press(getByTestId('new-conversation-fab'));

    await waitFor(() => {
      expect(getByTestId('new-conversation-modal')).toBeTruthy();
    });
  });

  it('renders conversations list', async () => {
    const { getByTestId, getByText } = render(
      <MockedProvider
        mocks={[conversationsMock, classroomsMock]}
        addTypename={false}
      >
        <MessagesScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('conversations-list')).toBeTruthy();
    });

    expect(getByText('Budi')).toBeTruthy();
  });
});
