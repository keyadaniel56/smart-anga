import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { SMEPreparednessModule } from './SMEPreparednessModule'
import { LocationProfile, SMEProfile } from '../types/climate'

// Mock Lucide icons to speed up execution and clear output logs
vi.mock('lucide-react', () => ({
  Building2: () => <div data-testid="building-icon" />,
  ShieldCheck: () => <div data-testid="shield-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  DollarSign: () => <div data-testid="dollar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  Layers: () => <div data-testid="layers-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  ArrowRight: () => <div data-testid="arrow-icon" />
}))

const mockMockProfiles = [
  {
    id: 'sme-1',
    name: 'AgroProcessing Co',
    industry: 'Agriculture',
    headcount: 45,
    readinessScore: 72,
    location: 'Lowland Valley',
    facilityElevationM: 45,
    primaryHazards: ['Flood', 'Heatwave'],
    hasFloodBarriers: true,
    hasBackupGenerator: false,
    hasSupplyChainRedundancy: false,
    hasClimateInsurance: true
    // You could also add: lastAuditDate: '2026-05-12'
  },
  {
    id: 'sme-2',
    name: 'Coastal Logistics Group',
    industry: 'Logistics',
    headcount: 120,
    readinessScore: 40,
    location: 'Estuary Pier',
    facilityElevationM: 3,
    primaryHazards: ['Storm Surge', 'Sea Level Rise'],
    hasFloodBarriers: false,
    hasBackupGenerator: true,
    hasSupplyChainRedundancy: true,
    hasClimateInsurance: false
  }
] as unknown as SMEProfile[]; // 👈 Force type mapping to bypass the missing property error safely


// Mock the external climate reference module data definitions using explicit casting structures
vi.mock('../data/mockClimateData', () => ({
  get DEFAULT_SME_PROFILES() {
    return mockMockProfiles
  }
}))

const mockLocation: LocationProfile = {
  id: 'loc-test',
  name: 'Western Sector Delta',
  region: 'Nyanza',
  country: 'Kenya',
  coordinates: [-0.1022, 34.7617],
  elevationM: 1140,
  population: 500000,
  primaryRisk: 'flood',
  vulnerabilityIndex: 72,
  criticalAssetsCount: 22
}

describe('SMEPreparednessModule Component', () => {
  it('renders the core business engine dashboard headers properly', () => {
    render(<SMEPreparednessModule location={mockLocation} />)
    
    expect(screen.getByText('SME Climate Preparedness & Business Continuity Engine')).toBeInTheDocument()
    expect(screen.getByText(/Diagnostic risk assessment, facility hardening/i)).toBeInTheDocument()
  })

  it('renders standard lists of selectable archetype mock configuration tracks', () => {
    render(<SMEPreparednessModule location={mockLocation} />)

    expect(screen.getByText('AgroProcessing Co')).toBeInTheDocument()
    expect(screen.getByText('Coastal Logistics Group')).toBeInTheDocument()
    expect(screen.getByText('72% Score')).toBeInTheDocument()
    expect(screen.getByText('40% Score')).toBeInTheDocument()
  })

  it('switches current focus targets successfully when archetype cards are clicked', () => {
    render(<SMEPreparednessModule location={mockLocation} />)

    // Initially selects first card profile structure
    expect(screen.getAllByText('AgroProcessing Co')[1]).toBeInTheDocument()

    // Click secondary item option container card track
    const trackingCard = screen.getByText('Coastal Logistics Group')
    fireEvent.click(trackingCard)

    // Panel updates core layout view variables mapping details automatically
    expect(screen.getAllByText('Coastal Logistics Group')[1]).toBeInTheDocument()
    expect(screen.getByText('120 Staff')).toBeInTheDocument()
  })

  it('toggles interactive checkboxes and triggers state mutators on click actions', () => {
    render(<SMEPreparednessModule location={mockLocation} />)

    const checkboxField = screen.getByText('Backup Emergency Microgrid')
    const parentContainer = checkboxField.closest('.cursor-pointer')

    // Base state checks
    expect(parentContainer).not.toHaveClass('bg-teal-950/40')
    
    // Toggle checkbox state mutation routine logic track
    fireEvent.click(parentContainer!)
    expect(parentContainer).toHaveClass('bg-teal-950/40')
  })
})
