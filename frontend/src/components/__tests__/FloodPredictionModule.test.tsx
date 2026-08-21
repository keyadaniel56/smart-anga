import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, mockLocation, mockWeather } from '../../test/helpers';
import { FloodPredictionModule } from '../FloodPredictionModule';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_SENSORS } from '../../data/mockClimateData';

describe('FloodPredictionModule', () => {
  const defaultProps = {
    location: mockLocation,
    liveWeather: mockWeather,
    sensors: DEFAULT_SENSORS,
    onTriggerEmergencyDispatch: vi.fn(),
  };

  it('renders the flood prediction container', () => {
    renderWithProviders(<FloodPredictionModule {...defaultProps} />);
    expect(document.getElementById('flood-prediction-container')).toBeInTheDocument();
  });

  it('renders the chart heading', () => {
    renderWithProviders(<FloodPredictionModule {...defaultProps} />);
    expect(screen.getByText(/48-Hour River Flow Forecast/)).toBeInTheDocument();
  });

  it('shows return period scenario selector buttons', () => {
    renderWithProviders(<FloodPredictionModule {...defaultProps} />);
    const liveButtons = screen.getAllByText('Live');
    expect(liveButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('10-Yr')).toBeInTheDocument();
    expect(screen.getByText('50-Yr')).toBeInTheDocument();
    expect(screen.getByText('100-Yr')).toBeInTheDocument();
  });

  it('switches scenario when 100yr button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FloodPredictionModule {...defaultProps} />);
    const btn100yr = screen.getByText('100-Yr').closest('button')!;
    await user.click(btn100yr);
    expect(btn100yr.className).toContain('rose');
  });

  it('renders flood defense controls', () => {
    renderWithProviders(<FloodPredictionModule {...defaultProps} />);
    expect(screen.getByText(/Moveable Flood Gates/)).toBeInTheDocument();
    expect(screen.getByText(/High-Capacity Water Pumps/)).toBeInTheDocument();
  });

  it('renders dispatch button', () => {
    renderWithProviders(<FloodPredictionModule {...defaultProps} />);
    expect(screen.getByText(/Dispatch Flood Response Team/)).toBeInTheDocument();
  });

  it('calls onTriggerEmergencyDispatch when dispatch is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FloodPredictionModule {...defaultProps} />);
    const dispatchBtn = screen.getByText(/Dispatch Flood Response Team/).closest('button')!;
    await user.click(dispatchBtn);
    expect(defaultProps.onTriggerEmergencyDispatch).toHaveBeenCalled();
  });

  it('toggles flood gate defense status', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FloodPredictionModule {...defaultProps} />);
    const floodGateBtn = screen.getByText('DEPLOYED').closest('button')!;
    expect(floodGateBtn).toBeInTheDocument();
    await user.click(floodGateBtn);
    expect(screen.getByText('STANDBY')).toBeInTheDocument();
  });
});
