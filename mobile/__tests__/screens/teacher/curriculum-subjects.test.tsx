import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import TeacherSubjectsListScreen from '../../../app/(app)/teacher/curriculum/index';
import { SubjectsDocument } from '../../../src/graphql/generated/graphql';

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

// Mock the Zustand auth store
const mockUseAuthStore = jest.fn();
jest.mock('../../../src/auth/store', () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) =>
    mockUseAuthStore(selector),
}));

const subjectsMock: MockedResponse = {
  request: { query: SubjectsDocument, variables: { schoolId: 's1' } },
  result: {
    data: {
      subjects: [
        {
          id: 'sub1',
          name: 'Mathematics',
          description: 'Numbers and shapes',
          topics: [
            { id: 't1', name: 'Addition' },
            { id: 't2', name: 'Subtraction' },
          ],
        },
        {
          id: 'sub2',
          name: 'English',
          description: null,
          topics: [{ id: 't3', name: 'Reading' }],
        },
      ],
    },
  },
};

const subjectsEmptyMock: MockedResponse = {
  request: { query: SubjectsDocument, variables: { schoolId: 's1' } },
  result: {
    data: { subjects: [] },
  },
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <TeacherSubjectsListScreen />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockPush.mockClear();
  // Default: teacher has an active school
  mockUseAuthStore.mockImplementation(
    (selector: (state: Record<string, unknown>) => unknown) =>
      selector({ activeSchoolId: 's1' })
  );
});

describe('TeacherSubjectsListScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([subjectsMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders subjects after loading', async () => {
    const { getByTestId, getByText } = renderScreen([subjectsMock]);

    await waitFor(() => {
      expect(getByTestId('subjects-list')).toBeTruthy();
    });

    expect(getByText('Mathematics')).toBeTruthy();
    expect(getByText('English')).toBeTruthy();
    expect(getByText('2 topics')).toBeTruthy();
    expect(getByText('1 topic')).toBeTruthy();
  });

  it('shows no-school state when activeSchoolId is null', async () => {
    mockUseAuthStore.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({ activeSchoolId: null })
    );

    const { getByTestId } = renderScreen([]);

    await waitFor(() => {
      expect(getByTestId('curriculum-no-school')).toBeTruthy();
    });
  });

  it('shows empty state when no subjects', async () => {
    const { getByTestId } = renderScreen([subjectsEmptyMock]);

    await waitFor(() => {
      expect(getByTestId('curriculum-empty')).toBeTruthy();
    });
  });

  it('navigates to subject detail on card press', async () => {
    const { getByTestId } = renderScreen([subjectsMock]);

    await waitFor(() => {
      expect(getByTestId('subject-card-sub1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('subject-card-sub1'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/teacher/curriculum/sub1');
  });

  it('navigates to yearly overview on link press', async () => {
    const { getByTestId } = renderScreen([subjectsMock]);

    await waitFor(() => {
      expect(getByTestId('yearly-curriculum-link')).toBeTruthy();
    });

    fireEvent.press(getByTestId('yearly-curriculum-link'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/teacher/curriculum/yearly');
  });
});
