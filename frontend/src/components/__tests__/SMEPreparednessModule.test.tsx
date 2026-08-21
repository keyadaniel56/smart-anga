import { describe, it, expect } from 'vitest';
import { renderWithProviders, mockLocation } from '../../test/helpers';
import { SMEPreparednessModule } from '../SMEPreparednessModule';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('SMEPreparednessModule', () => {
  const defaultProps = {
    location: mockLocation,
  };

  it('renders the SME preparedness container', () => {
    renderWithProviders(<SMEPreparednessModule {...defaultProps} />);
    expect(document.getElementById('sme-preparedness-container')).toBeInTheDocument();
  });

  it('renders the first SME profile name', () => {
    renderWithProviders(<SMEPreparednessModule {...defaultProps} />);
    expect(screen.getAllByText(/Apex Precision Logistics/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders preparedness toggle controls', () => {
    renderWithProviders(<SMEPreparednessModule {...defaultProps} />);
    expect(screen.getByText(/Moveable Flood Barriers/)).toBeInTheDocument();
    expect(screen.getByText(/Backup Emergency Generator/)).toBeInTheDocument();
  });

  it('toggles a preparedness measure via div click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SMEPreparednessModule {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];
    const parentDiv = firstCheckbox.closest('div[class*="cursor-pointer"]')!;
    const initialClass = parentDiv.className;
    await user.click(parentDiv);
    expect(parentDiv.className).not.toBe(initialClass);
  });

  it('renders all SME profile selectors', () => {
    renderWithProviders(<SMEPreparednessModule {...defaultProps} />);
    expect(screen.getAllByText(/Apex Precision Logistics/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/BioHarvest Greenhouse/)).toBeInTheDocument();
    expect(screen.getByText(/Vanguard Micro-Electronics/)).toBeInTheDocument();
  });

  it('switches profile when BioHarvest is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SMEPreparednessModule {...defaultProps} />);
    const profileCards = screen.getAllByText(/BioHarvest Greenhouse Co-op/);
    const selectorCard = profileCards[0].closest('div[class*="cursor-pointer"]')!;
    await user.click(selectorCard);
    expect(screen.getAllByText(/BioHarvest Greenhouse Co-op/).length).toBeGreaterThanOrEqual(1);
  });
});
