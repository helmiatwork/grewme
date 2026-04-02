import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import SubjectsListScreen from '../../../app/(app)/parent/curriculum/index';
import {
  MyChildrenWithSchoolDocument,
  SubjectsDocument,
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

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

const childrenWithSchoolMock: MockedResponse = {
  request: { query: MyChildrenWithSchoolDocument },
  result: {
    data: {
      myChildren: [
        {
          id: '1',
          name: 'Alice',
          classrooms: [
            {
              id: 'c1',
              school: { id: 's1', name: 'Test School' },
            },
          ],
        },
      ],
    },
  },
};

const childrenNoSchoolMock: MockedResponse = {
  request: { query: MyChildrenWithSchoolDocument },
  result: {
    data: {
      myChildren: [
        {
          id: '1',
          name: 'Alice',
          classrooms: [],
        },
      ],
    },
  },
};

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

const childrenErrorMock: MockedResponse = {
  request: { query: MyChildrenWithSchoolDocument },
  error: new Error('Network error'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <SubjectsListScreen />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockPush.mockClear();
});

describe('SubjectsListScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([
      childrenWithSchoolMock,
      subjectsMock,
    ]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders subjects after loading', async () => {
    const { getByTestId, getByText } = renderScreen([
      childrenWithSchoolMock,
      subjectsMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('subjects-list')).toBeTruthy();
    });

    expect(getByText('Mathematics')).toBeTruthy();
    expect(getByText('English')).toBeTruthy();
    expect(getByText('2 topics')).toBeTruthy();
    expect(getByText('1 topic')).toBeTruthy();
  });

  it('shows no-school state when children have no classrooms', async () => {
    const { getByTestId } = renderScreen([childrenNoSchoolMock]);

    await waitFor(() => {
      expect(getByTestId('curriculum-no-school')).toBeTruthy();
    });
  });

  it('shows empty state when no subjects', async () => {
    const { getByTestId } = renderScreen([
      childrenWithSchoolMock,
      subjectsEmptyMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('curriculum-empty')).toBeTruthy();
    });
  });

  it('shows error state on failure', async () => {
    const { getByTestId } = renderScreen([childrenErrorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });

  it('navigates to subject detail on card press', async () => {
    const { getByTestId } = renderScreen([
      childrenWithSchoolMock,
      subjectsMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('subject-card-sub1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('subject-card-sub1'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/parent/curriculum/sub1');
  });

  it('navigates to yearly overview on link press', async () => {
    const { getByTestId } = renderScreen([
      childrenWithSchoolMock,
      subjectsMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('yearly-curriculum-link')).toBeTruthy();
    });

    fireEvent.press(getByTestId('yearly-curriculum-link'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/parent/curriculum/yearly');
  });
});
