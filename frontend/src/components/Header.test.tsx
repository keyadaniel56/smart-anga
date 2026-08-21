import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Header } from './Header'
import { LocationProfile, EarlyWarningAlert } from '../types/climate'

// Mock the Lucide React icons so they do not clutter the test output
vi.mock('lucide-react', () => ({
  MapPin: () => <div data-testid="map-pin-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Compass: () => <div data-testid="compass-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />
}))

// Sample test data matching your component's typescript definitions
const mockCurrentLocation: LocationProfile = {
  id: 'loc-1',
  name: 'Nairobi Basin',
  region: 'Nairobi',
  country: 'Kenya',
  coordinates: [-1.2921, 36.8219],
  elevationM: 1795,
  population: 4300000,
  primaryRisk: 'flood',
  vulnerabilityIndex: 68,
  criticalAssetsCount: 42
}

const mockLocations: LocationProfile[] = [
  mockCurrentLocation,
  {
    id: 'loc-2',
    name: 'Amazon Rainforest',
    region: 'Amazonas',
    country: 'Brazil',
    coordinates: [-3.4653, -62.2159],
    elevationM: 100,
    population: 200000,
    primaryRisk: 'wildfire',
    vulnerabilityIndex: 82, // High risk (>75)
    criticalAssetsCount: 12
  }
]

const mockAlerts = [
  {
    id: 'alert-1',
    title: 'Flash Flood Watch',
    headline: 'Heavy torrential downpour expected within 3 hours.',
    severity: 'Emergency',
    active: true,
  }
] as EarlyWarningAlert[]; // 👈 Force TypeScript to accept this array for testing purposes


describe('Header Component', () => {
  const mockOnSelectLocation = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock global timers to control the clock inside the component safely
    vi.useFakeTimers()
  })

  it('renders the core platform branding and title', () => {
    render(
      <Header 
        currentLocation={mockCurrentLocation} 
        onSelectLocation={mockOnSelectLocation} 
      />
    )
    
    expect(screen.getByText('TERRA INTELLIGENCE')).toBeInTheDocument()
    expect(screen.getByText('CLIMASHIELD')).toBeInTheDocument()
  })

  it('renders the current location data and formats coordinates correctly', () => {
    render(
      <Header 
        currentLocation={mockCurrentLocation} 
        onSelectLocation={mockOnSelectLocation} 
      />
    )

    expect(screen.getByText('Nairobi Basin')).toBeInTheDocument()
    // Checks standard decimal fixing (.toFixed(2)) specified in your code
    expect(screen.getByText('(-1.29°, 36.82°)')).toBeInTheDocument()
  })

  it('displays the emergency banner when active alerts are passed', () => {
    render(
      <Header 
        currentLocation={mockCurrentLocation} 
        onSelectLocation={mockOnSelectLocation}
        activeAlerts={mockAlerts}
        activeIncidentCount={3}
      />
    )

    expect(screen.getByText(/Active Climate Alert:/i)).toBeInTheDocument()
    expect(screen.getByText(/Flash Flood Watch — Heavy torrential downpour/i)).toBeInTheDocument()
    expect(screen.getByText('3 Active Dispatches')).toBeInTheDocument()
  })

  it('toggles the location search dropdown on click', () => {
    render(
      <Header 
        currentLocation={mockCurrentLocation} 
        onSelectLocation={mockOnSelectLocation} 
      />
    )

    const dropdownButton = screen.getByRole('button', { name: /Nairobi Basin/i })
    
    // Dropdown should be hidden initially
    expect(screen.queryByPlaceholderText('Search river basin, city or country...')).not.toBeInTheDocument()

    // Click to open dropdown
    fireEvent.click(dropdownButton)
    expect(screen.getByPlaceholderText('Search river basin, city or country...')).toBeInTheDocument()

    // Click to close dropdown
    fireEvent.click(dropdownButton)
    expect(screen.queryByPlaceholderText('Search river basin, city or country...')).not.toBeInTheDocument()
  })

  it('triggers geolocation sequence when GPS trigger is available', () => {
    // Mock browser Geolocation API
    const mockGetCurrentPosition = vi.fn((success) => 
      success({ coords: { latitude: 10, longitude: 20 } })
    )
    
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: mockGetCurrentPosition
      }
    })

    render(
      <Header 
        locations={mockLocations}
        currentLocation={mockCurrentLocation} 
        onSelectLocation={mockOnSelectLocation} 
      />
    )

    // Open dropdown panel
    const dropdownButton = screen.getByRole('button', { name: /Nairobi Basin/i })
    fireEvent.click(dropdownButton)

    // Find the element directly from the virtual document body
    const gpsButton = document.getElementById('gps-locate-btn')

    
    if (gpsButton) {
      fireEvent.click(gpsButton)
      expect(mockGetCurrentPosition).toHaveBeenCalled()
      expect(mockOnSelectLocation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-gps-location',
          name: 'Local Monitored Zone'
        })
      )
    }
  })
})
