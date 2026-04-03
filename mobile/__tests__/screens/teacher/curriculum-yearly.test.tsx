import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import TeacherYearlyCurriculumScreen from '../../../app/(app)/teacher/curriculum/yearly';
import {
  AcademicYearsDocument,
  GradeCurriculumDocument,
} from '../../../src/graphql/generated/graphql';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

jest.mock('../../../src/hooks/useTeacherSchoolId', () => ({
  useTeacherSchoolId: () => ({ schoolId: 's1' }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const yearsMock: MockedResponse = {
  request: {
    query: AcademicYearsDocument,
    variables: { schoolId: 's1' },
  },
  result: {
    data: {
      academicYears: [
        {
          id: 'ay1',
          label: '2025/2026',
          current: true,
        },
      ],
    },
  },
};

const curriculumMock: MockedResponse = {
  request: {
    query: GradeCurriculumDocument,
    variables: { academicYearId: 'ay1', grade: 1 },
  },
  result: {
    data: {
      gradeCurriculum: {
        id: 'gc1',
        grade: 1,
        gradeCurriculumItems: [
          {
            id: 'gci1',
            displayName: 'Numbers',
            position: 1,
            subject: null,
            topic: {
              id: 't1',
              name: 'Numbers',
              subject: { id: 'sub1', name: 'Math' },
            },
          },
        ],
      },
    },
  },
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <TeacherYearlyCurriculumScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TeacherYearlyCurriculumScreen', () => {
  it('shows loading state initially', () => {
    const { getByText } = renderScreen([yearsMock]);
    expect(getByText('Loading yearly curriculum...')).toBeTruthy();
  });

  it('renders the screen after years load', async () => {
    const { getByTestId } = renderScreen([yearsMock, curriculumMock]);

    await waitFor(() => {
      expect(getByTestId('yearly-curriculum-screen')).toBeTruthy();
    });
  });

  it('renders academic year chip with correct label', async () => {
    const { getByTestId } = renderScreen([yearsMock, curriculumMock]);

    await waitFor(() => {
      expect(getByTestId('year-chip-ay1')).toBeTruthy();
    });
  });

  it('renders grade chips for all default grades', async () => {
    const { getByTestId } = renderScreen([yearsMock, curriculumMock]);

    await waitFor(() => {
      expect(getByTestId('yearly-curriculum-screen')).toBeTruthy();
    });

    for (const grade of [1, 2, 3, 4, 5, 6]) {
      expect(getByTestId(`grade-chip-${grade}`)).toBeTruthy();
    }
  });

  it('renders curriculum items after data loads', async () => {
    const { getByTestId } = renderScreen([yearsMock, curriculumMock]);

    await waitFor(() => {
      expect(getByTestId('yearly-items-list')).toBeTruthy();
    });

    expect(getByTestId('yearly-item-gci1')).toBeTruthy();
  });
});
