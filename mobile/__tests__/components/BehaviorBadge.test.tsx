import React from 'react';
import { render } from '@testing-library/react-native';
import BehaviorBadge from '../../src/components/BehaviorBadge';

describe('BehaviorBadge', () => {
  it('renders the badge name', () => {
    const { getByText } = render(
      <BehaviorBadge name="Helping Others" pointValue={5} isPositive={true} />
    );
    expect(getByText('Helping Others')).toBeTruthy();
  });

  it('shows positive point value with + prefix', () => {
    const { getByTestId } = render(
      <BehaviorBadge name="Good Work" pointValue={3} isPositive={true} />
    );
    expect(getByTestId('behavior-badge-points').props.children).toBe('+3');
  });

  it('shows negative point value without + prefix', () => {
    const { getByTestId } = render(
      <BehaviorBadge name="Disruption" pointValue={-2} isPositive={false} />
    );
    expect(getByTestId('behavior-badge-points').props.children).toBe('-2');
  });

  it('renders the icon when provided', () => {
    const { getByTestId } = render(
      <BehaviorBadge
        name="Star Student"
        pointValue={5}
        isPositive={true}
        icon="star"
      />
    );
    expect(getByTestId('behavior-badge-icon')).toBeTruthy();
  });

  it('does not render icon when not provided', () => {
    const { queryByTestId } = render(
      <BehaviorBadge name="Late" pointValue={-1} isPositive={false} />
    );
    expect(queryByTestId('behavior-badge-icon')).toBeNull();
  });

  it('uses custom color when provided', () => {
    const { getByTestId } = render(
      <BehaviorBadge
        name="Custom"
        pointValue={1}
        isPositive={true}
        color="#FFD700"
      />
    );
    const badge = getByTestId('behavior-badge');
    const bgStyle = badge.props.style.find(
      (s: Record<string, unknown>) => s?.backgroundColor === '#FFD700'
    );
    expect(bgStyle).toBeTruthy();
  });

  it('applies green background for positive badges by default', () => {
    const { getByTestId } = render(
      <BehaviorBadge name="Good" pointValue={2} isPositive={true} />
    );
    const badge = getByTestId('behavior-badge');
    const bgStyle = badge.props.style.find(
      (s: Record<string, unknown>) => s?.backgroundColor === '#E8F5E9'
    );
    expect(bgStyle).toBeTruthy();
  });

  it('applies red background for negative badges by default', () => {
    const { getByTestId } = render(
      <BehaviorBadge name="Bad" pointValue={-1} isPositive={false} />
    );
    const badge = getByTestId('behavior-badge');
    const bgStyle = badge.props.style.find(
      (s: Record<string, unknown>) => s?.backgroundColor === '#FFEBEE'
    );
    expect(bgStyle).toBeTruthy();
  });
});
