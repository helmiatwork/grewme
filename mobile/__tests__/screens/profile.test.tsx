import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TeacherProfileScreen from '../../app/(app)/teacher/profile';
import ParentProfileScreen from '../../app/(app)/parent/profile';
import { useAuthStore } from '../../src/auth/store';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: { replace: mockReplace },
}));

jest.spyOn(Alert, 'alert');

beforeEach(() => {
  mockReplace.mockClear();
  (Alert.alert as jest.Mock).mockClear();
  useAuthStore.setState({
    token: 'tok',
    userType: 'teacher',
    activeClassroomId: 'c1',
    activeSchoolId: 's1',
    hydrated: true,
  });
});

describe('TeacherProfileScreen', () => {
  it('renders teacher role and logout button', () => {
    const { getByTestId, getByText } = render(<TeacherProfileScreen />);

    expect(getByTestId('teacher-profile-screen')).toBeTruthy();
    expect(getByText('Teacher')).toBeTruthy();
    expect(getByTestId('logout-button')).toBeTruthy();
  });

  it('shows confirmation dialog on logout press', () => {
    const { getByTestId } = render(<TeacherProfileScreen />);

    fireEvent.press(getByTestId('logout-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Logout',
      'Are you sure you want to log out?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Logout', style: 'destructive' }),
      ]),
    );
  });

  it('clears auth and navigates to login on confirm', () => {
    const { getByTestId } = render(<TeacherProfileScreen />);

    fireEvent.press(getByTestId('logout-button'));

    // Simulate pressing "Logout" in the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const logoutAction = alertCall[2].find(
      (btn: { text: string }) => btn.text === 'Logout',
    );
    logoutAction.onPress();

    expect(useAuthStore.getState().token).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});

describe('ParentProfileScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'tok',
      userType: 'parent',
      activeClassroomId: null,
      activeSchoolId: null,
      hydrated: true,
    });
  });

  it('renders parent role and logout button', () => {
    const { getByTestId, getByText } = render(<ParentProfileScreen />);

    expect(getByTestId('parent-profile-screen')).toBeTruthy();
    expect(getByText('Parent')).toBeTruthy();
    expect(getByTestId('logout-button')).toBeTruthy();
  });

  it('clears auth and navigates to login on confirm', () => {
    const { getByTestId } = render(<ParentProfileScreen />);

    fireEvent.press(getByTestId('logout-button'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const logoutAction = alertCall[2].find(
      (btn: { text: string }) => btn.text === 'Logout',
    );
    logoutAction.onPress();

    expect(useAuthStore.getState().token).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
