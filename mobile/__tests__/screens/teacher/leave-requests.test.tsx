import { render } from '@testing-library/react-native';
import React from 'react';
import TeacherLeaveRequestsScreen from '../../../app/(app)/teacher/leave-requests/index';

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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TeacherLeaveRequestsScreen', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<TeacherLeaveRequestsScreen />);
    expect(getByTestId('teacher-leave-requests-screen')).toBeTruthy();
  });

  it('shows the Leave Requests title', () => {
    const { getByText } = render(<TeacherLeaveRequestsScreen />);
    expect(getByText('Leave Requests')).toBeTruthy();
  });

  it('shows the placeholder subtitle', () => {
    const { getByText } = render(<TeacherLeaveRequestsScreen />);
    expect(
      getByText(
        /Review and manage student leave requests from parents/,
      ),
    ).toBeTruthy();
  });
});
