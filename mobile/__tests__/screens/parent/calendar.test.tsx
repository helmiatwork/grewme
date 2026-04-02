import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import CalendarScreen from '../../../app/(app)/parent/calendar/index';
import { ClassroomEventsDocument } from '../../../src/graphql/generated/graphql';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const monthParam = `${year}-${month}-01`;

const eventsMock: MockedResponse = {
  request: {
    query: ClassroomEventsDocument,
    variables: { month: monthParam },
  },
  result: {
    data: {
      classroomEvents: [
        {
          id: 'e1',
          title: 'Parent-Teacher Meeting',
          description: 'Annual review',
          eventDate: `${year}-${month}-15`,
          startTime: '10:00',
          endTime: '11:00',
          classroom: { id: 'c1', name: 'Class 1A' },
          creatorName: 'Ms. Smith',
          creatorType: 'Teacher',
          isMine: false,
          createdAt: new Date().toISOString(),
        },
      ],
    },
  },
};

const emptyMock: MockedResponse = {
  request: {
    query: ClassroomEventsDocument,
    variables: { month: monthParam },
  },
  result: { data: { classroomEvents: [] } },
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <CalendarScreen />
    </MockedProvider>
  );
}

describe('CalendarScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([eventsMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders calendar grid after loading', async () => {
    const { getByTestId } = renderScreen([eventsMock]);

    await waitFor(() => {
      expect(getByTestId('calendar-screen')).toBeTruthy();
    });

    expect(getByTestId('month-label')).toBeTruthy();
    expect(getByTestId('day-15')).toBeTruthy();
  });

  it('shows events when a day with events is selected', async () => {
    const { getByTestId, getByText } = renderScreen([eventsMock]);

    await waitFor(() => {
      expect(getByTestId('calendar-screen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('day-15'));

    await waitFor(() => {
      expect(getByText('Parent-Teacher Meeting')).toBeTruthy();
    });

    expect(getByText('10:00 - 11:00')).toBeTruthy();
    expect(getByText('Annual review')).toBeTruthy();
  });

  it('shows no events message for empty days', async () => {
    const { getByTestId } = renderScreen([emptyMock]);

    await waitFor(() => {
      expect(getByTestId('calendar-screen')).toBeTruthy();
    });

    expect(getByTestId('no-events')).toBeTruthy();
  });
});
