// Suppress expo winter runtime import errors in test environment
jest.mock('expo/src/winter/runtime.native', () => ({}), { virtual: true });
