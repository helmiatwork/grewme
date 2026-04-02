jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../src/auth/store';

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

beforeEach(() => {
  jest.clearAllMocks();
  // Reset store state between tests
  useAuthStore.setState({
    token: null,
    userType: null,
    activeClassroomId: null,
    activeSchoolId: null,
    hydrated: false,
  });
});

describe('AuthStore', () => {
  describe('setAuth', () => {
    it('sets token and userType in store', () => {
      useAuthStore.getState().setAuth('jwt-token-123', 'parent');

      const state = useAuthStore.getState();
      expect(state.token).toBe('jwt-token-123');
      expect(state.userType).toBe('parent');
    });

    it('persists token and userType to SecureStore', () => {
      useAuthStore.getState().setAuth('jwt-token-123', 'teacher');

      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_token',
        'jwt-token-123'
      );
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        'user_type',
        'teacher'
      );
    });
  });

  describe('clearAuth', () => {
    it('resets all fields to null', () => {
      useAuthStore.setState({
        token: 'some-token',
        userType: 'parent',
        activeClassroomId: 'cls-1',
        activeSchoolId: 'sch-1',
      });

      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.userType).toBeNull();
      expect(state.activeClassroomId).toBeNull();
      expect(state.activeSchoolId).toBeNull();
    });

    it('calls SecureStore.deleteItemAsync to remove persisted token and userType', () => {
      useAuthStore.getState().clearAuth();

      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        'auth_token'
      );
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        'user_type'
      );
    });
  });

  describe('hydrate', () => {
    it('reads token and userType from SecureStore and sets hydrated true', async () => {
      mockedSecureStore.getItemAsync
        .mockResolvedValueOnce('stored-token')
        .mockResolvedValueOnce('parent');

      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.token).toBe('stored-token');
      expect(state.userType).toBe('parent');
      expect(state.hydrated).toBe(true);
      expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
      expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith('user_type');
    });

    it('sets hydrated true even when no token is stored', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValue(null);

      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.userType).toBeNull();
      expect(state.hydrated).toBe(true);
    });
  });

  describe('setActiveClassroomId', () => {
    it('sets the active classroom ID', () => {
      useAuthStore.getState().setActiveClassroomId('cls-42');

      expect(useAuthStore.getState().activeClassroomId).toBe('cls-42');
    });
  });

  describe('setActiveSchoolId', () => {
    it('sets the active school ID', () => {
      useAuthStore.getState().setActiveSchoolId('sch-7');

      expect(useAuthStore.getState().activeSchoolId).toBe('sch-7');
    });
  });
});
