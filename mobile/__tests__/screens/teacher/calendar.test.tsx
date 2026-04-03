import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import TeacherCalendarScreen from '../../../app/(app)/teacher/calendar/index';
import { ClassroomEventsDocument } from '../../../src/graphql/generated/graphql';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

// Compute the month param the screen will use: YYYY-MM-01 based on today
function currentMonthParam(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

const EVENT_DATE = '2026-04-15';

function buildCalendarEventsMock(month: string): MockedResponse {
  return {
    request: {
      query: ClassroomEventsDocument,
      variables: { month },
    },
    result: {
      data: {
        classroomEvents: [
          {
            id: 'ev1',
            title: 'Parent Meeting',
            description: 'Semester review',
            eventDate: EVENT_DATE,
            startTime: '09:00',
            endTime: '10:00',
            classroom: { id: 'c1', name: 'Grade 1A' },
            creatorName: 'Ms. Smith',
            creatorType: 'teacher',
            isMine: true,
            createdAt: '2026-04-01T08:00:00Z',
          },
        ],
      },
    },
  };
}

function buildEmptyCalendarMock(month: string): MockedResponse {
  return {
    request: {
      query: ClassroomEventsDocument,
      variables: { month },
    },
    result: {
      data: { classroomEvents: [] },
    },
  };
}

function buildErrorCalendarMock(month: string): MockedResponse {
  return {
    request: {
      query: ClassroomEventsDocument,
      variables: { month },
    },
    error: new Error('Failed to load events'),
  };
}

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <TeacherCalendarScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TeacherCalendarScreen', () => {
  it('shows loading state initially', () => {
    const month = currentMonthParam();
    const { getByTestId } = renderScreen([buildCalendarEventsMock(month)]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders calendar screen after loading', async () => {
    const month = currentMonthParam();
    const { getByTestId } = renderScreen([buildCalendarEventsMock(month)]);

    await waitFor(() => {
      expect(getByTestId('teacher-calendar-screen')).toBeTruthy();
    });
  });

  it('renders month navigation buttons', async () => {
    const month = currentMonthParam();
    const { getByTestId } = renderScreen([buildCalendarEventsMock(month)]);

    await waitFor(() => {
      expect(getByTestId('teacher-calendar-screen')).toBeTruthy();
    });

    expect(getByTestId('prev-month')).toBeTruthy();
    expect(getByTestId('next-month')).toBeTruthy();
  });

  it('renders month label', async () => {
    const month = currentMonthParam();
    const { getByTestId } = renderScreen([buildCalendarEventsMock(month)]);

    await waitFor(() => {
      expect(getByTestId('month-label')).toBeTruthy();
    });
  });

  it('renders events list', async () => {
    const month = currentMonthParam();
    const { getByTestId } = renderScreen([buildCalendarEventsMock(month)]);

    await waitFor(() => {
      expect(getByTestId('events-list')).toBeTruthy();
    });
  });

  it('shows no-events placeholder for unselected day', async () => {
    const month = currentMonthParam();
    const { getByTestId } = renderScreen([buildEmptyCalendarMock(month)]);

    await waitFor(() => {
      expect(getByTestId('no-events')).toBeTruthy();
    });
  });

  it('shows error state on query failure', async () => {
    const month = currentMonthParam();
    const { getByTestId } = renderScreen([buildErrorCalendarMock(month)]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });

  it('can press prev-month without crashing', async () => {
    const month = currentMonthParam();
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`;

    const { getByTestId } = renderScreen([
      buildCalendarEventsMock(month),
      buildEmptyCalendarMock(prevMonth),
    ]);

    await waitFor(() => {
      expect(getByTestId('teacher-calendar-screen')).toBeTruthy();
    });

    // Pressing prev-month should not throw
    expect(() => fireEvent.press(getByTestId('prev-month'))).not.toThrow();
  });
});
