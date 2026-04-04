import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type React from 'react';
import CalendarScreen from '../../../app/(app)/teacher/calendar/index';
import {
  ClassroomEventsDocument,
  ClassroomsDocument,
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

const today = new Date();
const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

const eventsMock: MockedResponse = {
  request: {
    query: ClassroomEventsDocument,
    variables: { month },
  },
  result: {
    data: {
      classroomEvents: [
        {
          id: 'e1',
          title: 'Parent-Teacher Meeting',
          description: 'Semester review',
          eventDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-15`,
          startTime: '09:00',
          endTime: '11:00',
          classroom: { id: 'c1', name: 'Class 1A' },
          creatorName: 'Teacher One',
          creatorType: 'Teacher',
          isMine: true,
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

describe('CalendarScreen — event creation', () => {
  it('renders the create event FAB', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[eventsMock, classroomsMock]} addTypename={false}>
        <CalendarScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('create-event-fab')).toBeTruthy();
    });
  });

  it('opens create event modal on FAB press', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[eventsMock, classroomsMock]} addTypename={false}>
        <CalendarScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('create-event-fab')).toBeTruthy();
    });

    fireEvent.press(getByTestId('create-event-fab'));

    await waitFor(() => {
      expect(getByTestId('create-event-modal')).toBeTruthy();
    });
  });

  it('shows title input in modal', async () => {
    const { getByTestId } = render(
      <MockedProvider mocks={[eventsMock, classroomsMock]} addTypename={false}>
        <CalendarScreen />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(getByTestId('create-event-fab')).toBeTruthy();
    });

    fireEvent.press(getByTestId('create-event-fab'));

    await waitFor(() => {
      expect(getByTestId('title-input')).toBeTruthy();
    });
  });
});
