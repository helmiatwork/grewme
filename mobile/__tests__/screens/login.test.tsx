import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import LoginScreen from '../../app/(auth)/login';
import { LoginDocument } from '../../src/graphql/generated/graphql';
import { useAuthStore } from '../../src/auth/store';

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

function renderLogin(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <LoginScreen />
    </MockedProvider>,
  );
}

beforeEach(() => {
  mockReplace.mockClear();
  useAuthStore.getState().clearAuth();
});

describe('LoginScreen', () => {
  it('renders email, password inputs and login button', () => {
    const { getByTestId } = renderLogin();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
  });

  it('calls setAuth and navigates on successful parent login', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: LoginDocument,
          variables: { email: 'parent@test.com', password: 'pass123', role: 'parent' },
        },
        result: {
          data: {
            login: {
              accessToken: 'test-token',
              refreshToken: 'refresh-token',
              expiresIn: 3600,
              user: {
                __typename: 'ParentType',
                id: '1',
                name: 'Test Parent',
                email: 'parent@test.com',
                role: 'parent',
              },
              errors: [],
            },
          },
        },
      },
    ];

    const { getByTestId } = renderLogin(mocks);

    fireEvent.changeText(getByTestId('email-input'), 'parent@test.com');
    fireEvent.changeText(getByTestId('password-input'), 'pass123');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(app)/parent/children');
    });

    expect(useAuthStore.getState().token).toBe('test-token');
    expect(useAuthStore.getState().userType).toBe('parent');
  });

  it('calls setAuth and navigates on successful teacher login', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: LoginDocument,
          variables: { email: 'teacher@test.com', password: 'pass123', role: 'teacher' },
        },
        result: {
          data: {
            login: {
              accessToken: 'teacher-token',
              refreshToken: 'refresh-token',
              expiresIn: 3600,
              user: {
                __typename: 'TeacherType',
                id: '2',
                name: 'Test Teacher',
                email: 'teacher@test.com',
                role: 'teacher',
              },
              errors: [],
            },
          },
        },
      },
    ];

    const { getByTestId, getByText } = renderLogin(mocks);

    // Switch to teacher role first
    fireEvent.press(getByText('Teacher'));
    fireEvent.changeText(getByTestId('email-input'), 'teacher@test.com');
    fireEvent.changeText(getByTestId('password-input'), 'pass123');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(app)/teacher');
    });

    expect(useAuthStore.getState().token).toBe('teacher-token');
    expect(useAuthStore.getState().userType).toBe('teacher');
  });

  it('shows error message on failed login', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: LoginDocument,
          variables: { email: 'bad@test.com', password: 'wrong', role: 'parent' },
        },
        result: {
          data: {
            login: {
              accessToken: null,
              refreshToken: null,
              expiresIn: null,
              user: null,
              errors: [{ message: 'Invalid credentials', path: null }],
            },
          },
        },
      },
    ];

    const { getByTestId } = renderLogin(mocks);

    fireEvent.changeText(getByTestId('email-input'), 'bad@test.com');
    fireEvent.changeText(getByTestId('password-input'), 'wrong');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });

    expect(getByTestId('error-message').props.children).toBe('Invalid credentials');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows unsupported message for SchoolManager type', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: LoginDocument,
          variables: { email: 'admin@test.com', password: 'pass123', role: 'parent' },
        },
        result: {
          data: {
            login: {
              accessToken: 'admin-token',
              refreshToken: 'refresh-token',
              expiresIn: 3600,
              user: {
                __typename: 'SchoolManagerType',
                id: '3',
                name: 'Admin',
                email: 'admin@test.com',
                role: 'school_manager',
              },
              errors: [],
            },
          },
        },
      },
    ];

    const { getByTestId } = renderLogin(mocks);

    fireEvent.changeText(getByTestId('email-input'), 'admin@test.com');
    fireEvent.changeText(getByTestId('password-input'), 'pass123');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });

    expect(getByTestId('error-message').props.children).toBe(
      'This account type is not supported in this app',
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
