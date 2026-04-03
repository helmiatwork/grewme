import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import TeacherExamsListScreen from '../../../app/(app)/teacher/exams/index';
import { ClassroomExamsDocument } from '../../../src/graphql/generated/graphql';
import { useAuthStore } from '../../../src/auth/store';

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

jest.mock('../../../src/utils/examHelpers', () => ({
  formatExamDate: (d: string) => d,
  examStatusColor: () => '#4CAF50',
  formatExamType: (t: string) => t,
}));

const examsMock: MockedResponse = {
  request: {
    query: ClassroomExamsDocument,
    variables: { classroomId: 'c1' },
  },
  result: {
    data: {
      classroomExams: [
        {
          id: 'ce1',
          status: 'ACTIVE',
          scheduledAt: '2026-04-01',
          dueAt: '2026-04-10',
          exam: {
            id: 'e1',
            title: 'Math Quiz',
            description: 'Test',
            examType: 'SCORE_BASED',
          },
          examSubmissions: [
            { status: 'SUBMITTED' },
            { status: 'GRADED' },
          ],
        },
      ],
    },
  },
};

const examsActiveMock: MockedResponse = {
  request: {
    query: ClassroomExamsDocument,
    variables: { classroomId: 'c1', status: 'ACTIVE' },
  },
  result: {
    data: {
      classroomExams: [
        {
          id: 'ce1',
          status: 'ACTIVE',
          scheduledAt: '2026-04-01',
          dueAt: '2026-04-10',
          exam: {
            id: 'e1',
            title: 'Math Quiz',
            description: 'Test',
            examType: 'SCORE_BASED',
          },
          examSubmissions: [{ status: 'SUBMITTED' }],
        },
      ],
    },
  },
};

const examsEmptyMock: MockedResponse = {
  request: {
    query: ClassroomExamsDocument,
    variables: { classroomId: 'c1' },
  },
  result: {
    data: { classroomExams: [] },
  },
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <TeacherExamsListScreen />
    </MockedProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    token: 'tok',
    userType: 'teacher',
    activeClassroomId: 'c1',
    activeSchoolId: 's1',
    hydrated: true,
  });
});

describe('TeacherExamsListScreen', () => {
  it('shows no-classroom state when activeClassroomId is null', () => {
    useAuthStore.setState({ activeClassroomId: null });
    const { getByTestId } = renderScreen([]);
    expect(getByTestId('exams-no-classroom')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([examsMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders exam cards after loading', async () => {
    const { getByTestId, getByText } = renderScreen([examsMock]);

    await waitFor(() => {
      expect(getByTestId('exams-list-screen')).toBeTruthy();
    });

    expect(getByTestId('exams-list')).toBeTruthy();
    expect(getByTestId('exam-card-ce1')).toBeTruthy();
    expect(getByText('Math Quiz')).toBeTruthy();
    expect(getByText('ACTIVE')).toBeTruthy();
  });

  it('renders filter chips', async () => {
    const { getByTestId } = renderScreen([examsMock]);

    await waitFor(() => {
      expect(getByTestId('exams-list-screen')).toBeTruthy();
    });

    expect(getByTestId('filter-all')).toBeTruthy();
    expect(getByTestId('filter-active')).toBeTruthy();
  });

  it('pressing filter-active shows active exams', async () => {
    const { getByTestId } = renderScreen([examsMock, examsActiveMock]);

    await waitFor(() => {
      expect(getByTestId('exams-list-screen')).toBeTruthy();
    });

    expect(getByTestId('filter-active')).toBeTruthy();
    fireEvent.press(getByTestId('filter-active'));

    await waitFor(() => {
      expect(getByTestId('exams-list-screen')).toBeTruthy();
    });

    expect(getByTestId('exam-card-ce1')).toBeTruthy();
  });

  it('navigates to create exam screen on button press', async () => {
    const { getByTestId } = renderScreen([examsMock]);

    await waitFor(() => {
      expect(getByTestId('create-exam-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('create-exam-button'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/teacher/exams/new');
  });

  it('navigates to exam detail on card press', async () => {
    const { getByTestId } = renderScreen([examsMock]);

    await waitFor(() => {
      expect(getByTestId('exam-card-ce1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('exam-card-ce1'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/teacher/exams/e1');
  });

  it('shows empty state when no exams', async () => {
    const { getByTestId } = renderScreen([examsEmptyMock]);

    await waitFor(() => {
      expect(getByTestId('exams-empty')).toBeTruthy();
    });
  });
});
