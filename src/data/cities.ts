export interface City {
  id: string
  name: string
  country: string
  coordinates: [number, number]
  population1945: number
  branchStrengths: Partial<Record<Branch, number>>
  unlockCost: number
  available: boolean
}

export type Branch = 'handel' | 'produktion' | 'gastro' | 'transport' | 'bau'

export const BRANCH_LABELS: Record<Branch, string> = {
  handel: 'Handel & Import/Export',
  produktion: 'Produktion',
  gastro: 'Gastronomie & Hotellerie',
  transport: 'Transport & Logistik',
  bau: 'Bauwesen & Immobilien',
}

export const CITIES: City[] = [
  {
    id: 'hamburg',
    name: 'Hamburg',
    country: 'Deutschland',
    coordinates: [10.0, 53.55],
    population1945: 1400000,
    branchStrengths: { handel: 1.4, transport: 1.3, produktion: 1.1 },
    unlockCost: 0,
    available: true,
  },
  {
    id: 'frankfurt',
    name: 'Frankfurt',
    country: 'Deutschland',
    coordinates: [8.68, 50.11],
    population1945: 430000,
    branchStrengths: { handel: 1.3, bau: 1.2 },
    unlockCost: 0,
    available: true,
  },
  {
    id: 'muenchen',
    name: 'München',
    country: 'Deutschland',
    coordinates: [11.58, 48.14],
    population1945: 480000,
    branchStrengths: { gastro: 1.4, produktion: 1.2 },
    unlockCost: 25000,
    available: true,
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Deutschland',
    coordinates: [13.4, 52.52],
    population1945: 2800000,
    branchStrengths: { handel: 1.2, bau: 1.3, gastro: 1.1 },
    unlockCost: 40000,
    available: true,
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'Frankreich',
    coordinates: [2.35, 48.85],
    population1945: 2700000,
    branchStrengths: { gastro: 1.5, handel: 1.3, bau: 1.2 },
    unlockCost: 60000,
    available: true,
  },
  {
    id: 'rotterdam',
    name: 'Rotterdam',
    country: 'Niederlande',
    coordinates: [4.48, 51.92],
    population1945: 600000,
    branchStrengths: { handel: 1.5, transport: 1.4 },
    unlockCost: 45000,
    available: true,
  },
  {
    id: 'wien',
    name: 'Wien',
    country: 'Österreich',
    coordinates: [16.37, 48.21],
    population1945: 1700000,
    branchStrengths: { gastro: 1.4, handel: 1.2, bau: 1.1 },
    unlockCost: 50000,
    available: true,
  },
  {
    id: 'mailand',
    name: 'Mailand',
    country: 'Italien',
    coordinates: [9.19, 45.46],
    population1945: 1300000,
    branchStrengths: { produktion: 1.4, handel: 1.3 },
    unlockCost: 55000,
    available: true,
  },
  {
    id: 'ruhrgebiet',
    name: 'Ruhrgebiet',
    country: 'Deutschland',
    coordinates: [7.1, 51.5],
    population1945: 3500000,
    branchStrengths: { produktion: 1.6, transport: 1.2 },
    unlockCost: 35000,
    available: true,
  },
  {
    id: 'zuerich',
    name: 'Zürich',
    country: 'Schweiz',
    coordinates: [8.54, 47.38],
    population1945: 400000,
    branchStrengths: { handel: 1.4, bau: 1.3 },
    unlockCost: 75000,
    available: true,
  },
]
