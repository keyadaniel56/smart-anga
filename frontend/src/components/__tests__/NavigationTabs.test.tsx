import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../../test/helpers';
import { NavigationTabs } from '../NavigationTabs';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('NavigationTabs', () => {
  const defaultProps = {
    activeTab: 'overview_gis' as const,
    onSelectTab: vi.fn(),
    activeAlertsCount: 2,
    activeIncidentsCount: 1,
    anomaliesDetectedCount: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation items in desktop sidebar', () => {
    renderWithProviders(<NavigationTabs {...defaultProps} />);
    const sidebar = document.getElementById('desktop-sidebar-navigation')!;
    expect(sidebar).toBeInTheDocument();
    expect(sidebar.textContent).toContain('Overview & Map');
    expect(sidebar.textContent).toContain('River & Flood Watch');
    expect(sidebar.textContent).toContain('Drought & Farming');
    expect(sidebar.textContent).toContain('Area Risk & Losses');
    expect(sidebar.textContent).toContain('Alerts & Dispatches');
    expect(sidebar.textContent).toContain('Business Readiness');
    expect(sidebar.textContent).toContain('Weather Shock Test');
    expect(sidebar.textContent).toContain('Local Sensor Network');
  });

  it('calls onSelectTab when a desktop sidebar tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavigationTabs {...defaultProps} />);
    const sidebar = document.getElementById('desktop-sidebar-navigation')!;
    const floodTab = sidebar.querySelector('#sidebar-nav-flood_prediction')!;
    await user.click(floodTab);
    expect(defaultProps.onSelectTab).toHaveBeenCalledWith('flood_prediction');
  });

  it('highlights the active tab in desktop sidebar', () => {
    renderWithProviders(<NavigationTabs {...defaultProps} />);
    const sidebar = document.getElementById('desktop-sidebar-navigation')!;
    const overviewTab = sidebar.querySelector('#sidebar-nav-overview_gis')!;
    expect(overviewTab.className).toContain('forest');
  });

  it('does not highlight a non-active tab', () => {
    renderWithProviders(<NavigationTabs {...defaultProps} />);
    const sidebar = document.getElementById('desktop-sidebar-navigation')!;
    const floodTab = sidebar.querySelector('#sidebar-nav-flood_prediction')!;
    expect(floodTab.className).not.toContain('bg-forest-900');
  });

  it('shows alert badge on overview tab', () => {
    renderWithProviders(<NavigationTabs {...defaultProps} />);
    const overviewBtn = document.getElementById('sidebar-nav-overview_gis')!;
    expect(overviewBtn.textContent).toContain('2');
    expect(overviewBtn.textContent).toContain('Active');
  });

  it('shows incident badge on early_warning tab', () => {
    renderWithProviders(<NavigationTabs {...defaultProps} />);
    const alertsBtn = document.getElementById('sidebar-nav-early_warning')!;
    expect(alertsBtn.textContent).toContain('1');
    expect(alertsBtn.textContent).toContain('Active');
  });

  it('shows anomaly badge on sensor_telemetry tab', () => {
    renderWithProviders(<NavigationTabs {...defaultProps} />);
    const sensorsBtn = document.getElementById('sidebar-nav-sensor_telemetry')!;
    expect(sensorsBtn.textContent).toContain('3');
  });

  it('renders mobile bottom navigation bar', () => {
    renderWithProviders(<NavigationTabs {...defaultProps} />);
    const mobileNav = document.getElementById('mobile-bottom-navigation')!;
    expect(mobileNav).toBeInTheDocument();
    const mobileText = mobileNav.textContent || '';
    expect(mobileText).toContain('Overview');
    expect(mobileText).toContain('Flood Watch');
    expect(mobileText).toContain('Drought');
    expect(mobileText).toContain('Alerts');
  });

  it('calls onSelectTab when a mobile tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavigationTabs {...defaultProps} />);
    const mobileFloodTab = document.getElementById('mobile-tab-flood_prediction')!;
    await user.click(mobileFloodTab);
    expect(defaultProps.onSelectTab).toHaveBeenCalledWith('flood_prediction');
  });

  it('opens mobile modules drawer when More button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavigationTabs {...defaultProps} />);
    const moreBtn = document.getElementById('mobile-more-tabs-btn')!;
    await user.click(moreBtn);
    expect(document.getElementById('mobile-modules-sheet')).toBeInTheDocument();
  });

  it('renders all modules in the mobile drawer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavigationTabs {...defaultProps} />);
    const moreBtn = document.getElementById('mobile-more-tabs-btn')!;
    await user.click(moreBtn);
    const sheet = document.getElementById('mobile-modules-sheet')!;
    expect(sheet.textContent).toContain('Weather Shock Test');
    expect(sheet.textContent).toContain('Local Sensor Network');
  });
});
