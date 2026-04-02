import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import AwardBehaviorScreen from '../../../app/(app)/teacher/behavior/index';
import {
  BehaviorCategoriesDocument,
  AwardBehaviorPointDocument,
} from '../../../src/graphql/generated/graphql';
import { useAuthStore } from '../../../src/auth/store';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ studentId: 'st1' }),
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.spyOn(Alert, 'alert');

const categoriesMock: MockedResponse = {
  request: {
    query: BehaviorCategoriesDocument,
    variables: { schoolId: 's1' },
  },
  result: {
    data: {
      behaviorCategories: [
        {
          id: 'cat1',
          name: 'Helping Others',
          description: 'Student helps classmates',
          pointValue: 2,
          isPositive: true,
          icon: '🤝',
          color: '#E8F5E9',
          position: 1,
        },
        {
          id: 'cat2',
          name: 'Disruption',
          description: 'Disrupting class',
          pointValue: -1,
          isPositive: false,
          icon: '⚠️',
          color: '#FFEBEE',
          position: 2,
        },
      ],
    },
  },
};

const awardSuccessMock: MockedResponse = {
  request: {
    query: AwardBehaviorPointDocument,
    variables: {
      studentId: 'st1',
      classroomId: 'c1',
      behaviorCategoryId: 'cat1',
      note: undefined,
    },
  },
  result: {
    data: {
      awardBehaviorPoint: {
        behaviorPoint: {
          id: 'bp1',
          pointValue: 2,
          awardedAt: '2026-04-02T10:00:00Z',
        },
        dailyTotal: 7,
        errors: [],
      },
    },
  },
};

const cooldownErrorMock: MockedResponse = {
  request: {
    query: AwardBehaviorPointDocument,
    variables: {
      studentId: 'st1',
      classroomId: 'c1',
      behaviorCategoryId: 'cat1',
      note: undefined,
    },
  },
  result: {
    data: {
      awardBehaviorPoint: {
        behaviorPoint: null,
        dailyTotal: 5,
        errors: [
          {
            message:
              'Please wait 30 seconds before awarding this category again',
          },
        ],
      },
    },
  },
};

const categoriesErrorMock: MockedResponse = {
  request: {
    query: BehaviorCategoriesDocument,
    variables: { schoolId: 's1' },
  },
  error: new Error('Network error'),
};

function renderScreen(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <AwardBehaviorScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({
    activeSchoolId: 's1',
    activeClassroomId: 'c1',
  });
  (Alert.alert as jest.Mock).mockClear();
});

describe('AwardBehaviorScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = renderScreen([categoriesMock]);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('renders behavior categories after loading', async () => {
    const { getByTestId, getByText } = renderScreen([categoriesMock]);

    await waitFor(() => {
      expect(getByTestId('award-behavior-screen')).toBeTruthy();
    });

    expect(getByText('Helping Others')).toBeTruthy();
    expect(getByText('Disruption')).toBeTruthy();
  });

  it('opens confirmation modal on category tap', async () => {
    const { getByTestId, getByText } = renderScreen([categoriesMock]);

    await waitFor(() => {
      expect(getByTestId('award-behavior-screen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('category-cat1'));

    await waitFor(() => {
      expect(getByTestId('confirm-award-button')).toBeTruthy();
    });

    expect(getByText('Award: Helping Others')).toBeTruthy();
    expect(getByTestId('note-input')).toBeTruthy();
  });

  it('awards point successfully and shows daily total', async () => {
    const { getByTestId } = renderScreen([
      categoriesMock,
      awardSuccessMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('award-behavior-screen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('category-cat1'));

    await waitFor(() => {
      expect(getByTestId('confirm-award-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('confirm-award-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Point Awarded',
        'Daily total: 7 points',
      );
    });
  });

  it('handles 30-second cooldown error gracefully', async () => {
    const { getByTestId } = renderScreen([
      categoriesMock,
      cooldownErrorMock,
    ]);

    await waitFor(() => {
      expect(getByTestId('award-behavior-screen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('category-cat1'));

    await waitFor(() => {
      expect(getByTestId('confirm-award-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('confirm-award-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Cannot Award',
        'Please wait 30 seconds before awarding this category again',
      );
    });
  });

  it('shows error state on categories query failure', async () => {
    const { getByTestId } = renderScreen([categoriesErrorMock]);

    await waitFor(() => {
      expect(getByTestId('error-state')).toBeTruthy();
    });
  });
});
