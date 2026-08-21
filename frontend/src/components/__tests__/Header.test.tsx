import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, mockLocation, mockWeather, mockAlerts } from '../../test/helpers';
import { Header } from '../Header';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Header', () => {
  const defaultProps = {
    currentLocation: mockLocation,
    onSelectLocation: vi.fn(),
    activeAlerts: mockAlerts,
    liveWeather: mockWeather,
    weatherLoading: false,
    activeIncidentCount: 3,
  };

  it('renders the location name', () => {
    renderWithProviders(<Header {...defaultProps} />);
    expect(screen.getAllByText('Test City').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the weather temperature when liveWeather is provided', () => {
    renderWithProviders(<Header {...defaultProps} />);
    expect(screen.getAllByText(/22\.0/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders the brand name', () => {
    renderWithProviders(<Header {...defaultProps} />);
    expect(screen.getByText('SmartAnga')).toBeInTheDocument();
  });

  it('renders incident count in alert ticker', () => {
    renderWithProviders(<Header {...defaultProps} />);
    const ticker = document.getElementById('critical-alert-ticker');
    expect(ticker).toBeInTheDocument();
    expect(ticker!.textContent).toContain('Test flood alert');
  });

  it('renders without liveWeather (null)', () => {
    renderWithProviders(<Header {...defaultProps} liveWeather={null} />);
    expect(screen.getAllByText('Test City').length).toBeGreaterThanOrEqual(1);
  });

  it('opens the location dropdown when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header {...defaultProps} />);
    const trigger = document.getElementById('location-selector-btn')!;
    await user.click(trigger);
    const dropdown = document.getElementById('location-dropdown-panel');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown!.textContent).toContain('Valencia');
  });

  it('filters locations in dropdown search', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header {...defaultProps} />);
    const trigger = document.getElementById('location-selector-btn')!;
    await user.click(trigger);
    const searchInput = screen.getByPlaceholderText(/Search any town/);
    await user.type(searchInput, 'Houston');
    expect(screen.getByText(/Houston/)).toBeInTheDocument();
  });
});
