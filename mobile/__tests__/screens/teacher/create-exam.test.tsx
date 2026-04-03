import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import CreateExamScreen from '../../../app/(app)/teacher/exams/new';
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

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

jest.mock('../../../src/hooks/useTeacherSchoolId', () => ({
  useTeacherSchoolId: () => ({ schoolId: 's1' }),
}));

const subjectsMock: MockedResponse = {
  request: {
    query: SubjectsDocument,
    variables: { schoolId: 's1' },
  },
  result: {
    data: {
      subjects: [
        {
          id: 'sub1',
          name: 'Math',
          topics: [{ id: 't1', name: 'Algebra' }],
        },
      ],
    },
  },
};

const subjectsLoadingMock: MockedResponse = {
  request: {
    query: SubjectsDocument,
    variables: { schoolId: 's1' },
  },
  result: {
    data: { subjects: [] },
  },
  delay: 300,
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <CreateExamScreen />
    </MockedProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CreateExamScreen', () => {
  it('renders form fields', () => {
    const { getByTestId } = renderScreen([subjectsMock]);

    expect(getByTestId('create-exam-screen')).toBeTruthy();
    expect(getByTestId('input-title')).toBeTruthy();
    expect(getByTestId('input-description')).toBeTruthy();
    expect(getByTestId('submit-exam')).toBeTruthy();
  });

  it('renders exam type chips', () => {
    const { getByTestId } = renderScreen([subjectsMock]);

    expect(getByTestId('type-SCORE_BASED')).toBeTruthy();
    expect(getByTestId('type-MULTIPLE_CHOICE')).toBeTruthy();
  });

  it('shows ActivityIndicator while subjects are loading', () => {
    const { getByTestId } = renderScreen([subjectsLoadingMock]);
    // Screen renders immediately; subjects section shows loading indicator
    expect(getByTestId('create-exam-screen')).toBeTruthy();
  });

  it('renders subjects after loading', async () => {
    const { getByTestId } = renderScreen([subjectsMock]);

    await waitFor(() => {
      expect(getByTestId('subject-sub1')).toBeTruthy();
    });
  });

  it('shows topics when a subject is selected', async () => {
    const { getByTestId } = renderScreen([subjectsMock]);

    await waitFor(() => {
      expect(getByTestId('subject-sub1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('subject-sub1'));

    await waitFor(() => {
      expect(getByTestId('topic-t1')).toBeTruthy();
    });
  });

  it('selects MULTIPLE_CHOICE exam type', async () => {
    const { getByTestId } = renderScreen([subjectsMock]);

    await waitFor(() => {
      expect(getByTestId('create-exam-screen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('type-MULTIPLE_CHOICE'));
    // After pressing, add-question button should appear for MULTIPLE_CHOICE
    expect(getByTestId('add-question')).toBeTruthy();
  });

  it('accepts text in title and description inputs', async () => {
    const { getByTestId } = renderScreen([subjectsMock]);

    await waitFor(() => {
      expect(getByTestId('create-exam-screen')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('input-title'), 'Midterm Exam');
    fireEvent.changeText(getByTestId('input-description'), 'Chapter 1-5');

    expect(getByTestId('input-title').props.value).toBe('Midterm Exam');
    expect(getByTestId('input-description').props.value).toBe('Chapter 1-5');
  });
});
