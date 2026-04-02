import React from 'react';
import { render } from '@testing-library/react-native';
import LoadingState from '../../src/components/LoadingState';

describe('LoadingState', () => {
  it('renders the spinner', () => {
    const { getByTestId } = render(<LoadingState />);
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('renders the container', () => {
    const { getByTestId } = render(<LoadingState />);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('shows the message when provided', () => {
    const { getByTestId, getByText } = render(
      <LoadingState message="Loading students..." />
    );
    expect(getByTestId('loading-message')).toBeTruthy();
    expect(getByText('Loading students...')).toBeTruthy();
  });

  it('does not render message when not provided', () => {
    const { queryByTestId } = render(<LoadingState />);
    expect(queryByTestId('loading-message')).toBeNull();
  });
});
