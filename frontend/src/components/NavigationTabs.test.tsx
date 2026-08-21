import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { NavigationTabs } from './NavigationTabs'
import { NavigationTabType } from '../types/climate'

// Mock Lucide icons to isolate component logic and speed up test rendering
vi.mock('lucide-react', () => ({
  Map: () => <div data-testid="map-icon" />,
  Waves: () => <div data-testid="waves-icon" />,
  Sun: () => <div data-testid="sun-icon" />,
  ShieldAlert: () => <div data-testid="shield-alert-icon" />,
  Radio: () => <div data-testid="radio-icon" />,
  Building2: () => <div data-testid="building-icon" />,
  FlaskConical: () => <div data-testid="flask-icon" />,
  Cpu: () => <div data-testid="cpu-icon" />
}))

describe('NavigationTabs Component', () => {
  const mockOnSelectTab = vi.fn()

  it('renders all eight navigation tabs with correct labels', () => {
    render(
      <NavigationTabs 
        activeTab="overview_gis" 
        onSelectTab={mockOnSelectTab} 
      />
    )

    expect(screen.getByText('Overview & GIS')).toBeInTheDocument()
    expect(screen.getByText('Flood Prediction')).toBeInTheDocument()
    expect(screen.getByText('Drought & Agro Risk')).toBeInTheDocument()
    expect(screen.getByText('Vulnerability & VaR')).toBeInTheDocument()
    expect(screen.getByText('EWS & Dispatch')).toBeInTheDocument()
    expect(screen.getByText('SME Preparedness')).toBeInTheDocument()
    expect(screen.getByText('Climate Stress Studio')).toBeInTheDocument()
    expect(screen.getByText('IoT Sensors & Anomaly')).toBeInTheDocument()
  })

  it('applies active styling to the explicitly active tab', () => {
    render(
      <NavigationTabs 
        activeTab="flood_prediction" 
        onSelectTab={mockOnSelectTab} 
      />
    )

    // Using the ID generated dynamically in your component markup
    const activeTabButton = document.getElementById('nav-tab-flood_prediction')
    const inactiveTabButton = document.getElementById('nav-tab-overview_gis')

    expect(activeTabButton).toHaveClass('bg-slate-900', 'text-white')
    expect(inactiveTabButton).toHaveClass('text-slate-400')
  })

  it('fires onSelectTab callback with correct ID when a tab is clicked', () => {
    render(
      <NavigationTabs 
        activeTab="overview_gis" 
        onSelectTab={mockOnSelectTab} 
      />
    )

    const droughtTab = screen.getByRole('button', { name: /Drought & Agro Risk/i })
    fireEvent.click(droughtTab)

    expect(mockOnSelectTab).toHaveBeenCalledTimes(1)
    expect(mockOnSelectTab).toHaveBeenCalledWith('drought_assessment')
  })

  it('displays the correct badges based on count fallbacks', () => {
    render(
      <NavigationTabs 
        activeTab="overview_gis" 
        onSelectTab={mockOnSelectTab}
        activeAlertCount={5}         // Testing activeAlertCount fallback logic
        activeIncidentCount={3}      // Testing activeIncidentCount fallback logic
        anomaliesDetectedCount={0}   // 0 anomalies means it should display "Online"
      />
    )

    expect(screen.getByText('5 Active')).toBeInTheDocument()
    expect(screen.getByText('3 Incidents')).toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('displays custom warning alert badges when anomalies are detected', () => {
    render(
      <NavigationTabs 
        activeTab="overview_gis" 
        onSelectTab={mockOnSelectTab}
        anomaliesDetectedCount={12}
      />
    )

    expect(screen.getByText('12 Alert')).toBeInTheDocument()
    expect(screen.queryByText('Online')).not.toBeInTheDocument()
  })

  it('displays static default badges for fixed state views', () => {
    render(
      <NavigationTabs 
        activeTab="overview_gis" 
        onSelectTab={mockOnSelectTab} 
      />
    )

    expect(screen.getByText('Live Hydro')).toBeInTheDocument()
    expect(screen.getByText('SPEI Deficit')).toBeInTheDocument()
    expect(screen.getByText('Simulator')).toBeInTheDocument()
    expect(screen.getByText('Resilience')).toBeInTheDocument()
  })
})
