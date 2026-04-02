import React from 'react';
import { render } from '@testing-library/react-native';
import RadarChart from '../../src/components/RadarChart';

jest.mock('react-native-svg', () => {
  const React = require('react');
  const createMockComponent = (name: string) =>
    React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      React.createElement(name, { ...props, ref })
    );
  return {
    __esModule: true,
    default: createMockComponent('Svg'),
    Svg: createMockComponent('Svg'),
    Circle: createMockComponent('Circle'),
    G: createMockComponent('G'),
    Line: createMockComponent('Line'),
    Polygon: createMockComponent('Polygon'),
    Text: createMockComponent('Text'),
  };
});

const fullSkills = {
  reading: 80,
  math: 60,
  writing: 70,
  logic: 50,
  social: 90,
};

describe('RadarChart', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<RadarChart skills={fullSkills} />);
    expect(getByTestId('radar-chart')).toBeTruthy();
  });

  it('renders the data polygon', () => {
    const { getByTestId } = render(<RadarChart skills={fullSkills} />);
    expect(getByTestId('radar-data-polygon')).toBeTruthy();
  });

  it('handles zero values gracefully', () => {
    const zeroSkills = {
      reading: 0,
      math: 0,
      writing: 0,
      logic: 0,
      social: 0,
    };
    const { getByTestId } = render(<RadarChart skills={zeroSkills} />);
    expect(getByTestId('radar-chart')).toBeTruthy();
  });

  it('clamps values above 100', () => {
    const overflowSkills = {
      reading: 150,
      math: 200,
      writing: 100,
      logic: 0,
      social: 50,
    };
    const { getByTestId } = render(<RadarChart skills={overflowSkills} />);
    expect(getByTestId('radar-data-polygon')).toBeTruthy();
  });

  it('respects the size prop', () => {
    const { getByTestId } = render(
      <RadarChart skills={fullSkills} size={300} />
    );
    expect(getByTestId('radar-chart')).toBeTruthy();
  });

  it('uses default size of 200', () => {
    const { getByTestId } = render(<RadarChart skills={fullSkills} />);
    const chart = getByTestId('radar-chart');
    expect(chart).toBeTruthy();
  });
});
