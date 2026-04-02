import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorState from '../../src/components/ErrorState';

describe('ErrorState', () => {
  it('renders the error message', () => {
    const { getByTestId, getByText } = render(
      <ErrorState message="Something went wrong" />
    );
    expect(getByTestId('error-state')).toBeTruthy();
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('shows the retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <ErrorState message="Network error" onRetry={onRetry} />
    );
    expect(getByTestId('error-retry-button')).toBeTruthy();
  });

  it('does not show retry button when onRetry is not provided', () => {
    const { queryByTestId } = render(
      <ErrorState message="Network error" />
    );
    expect(queryByTestId('error-retry-button')).toBeNull();
  });

  it('calls onRetry when retry button is pressed', () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <ErrorState message="Network error" onRetry={onRetry} />
    );
    fireEvent.press(getByTestId('error-retry-button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
