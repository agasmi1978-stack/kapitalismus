import type { Branch } from './cities'

export interface PropertyTemplate {
  id: string
  name: string
  description: string
  cost: number
  employeeSlots: number   // max. Mitarbeiter
  machineSlots: number    // Kapazität für Maschinen (Phase 2)
  maintenanceCost: number // monatliche Unterhaltskosten
  applicableBranches: Branch[]  // leer = alle Branchen
}

export const PROPERTY_TEMPLATES: PropertyTemplate[] = [
  {
    id: 'kleines_buero',
    name: 'Kleines Büro',
    description: 'Bescheidene Büroräume für einen kleinen Betrieb. Wenig Platz für Maschinen.',
    cost: 18000,
    employeeSlots: 15,
    machineSlots: 10,
    maintenanceCost: 500,
    applicableBranches: [],
  },
  {
    id: 'mittleres_buero',
    name: 'Mittleres Büro',
    description: 'Repräsentative Räume mit mehreren Abteilungen und Besprechungszimmern.',
    cost: 35000,
    employeeSlots: 30,
    machineSlots: 20,
    maintenanceCost: 1000,
    applicableBranches: [],
  },
  {
    id: 'grosses_buero',
    name: 'Großes Bürogebäude',
    description: 'Stattliches Gebäude mit Verwaltungsabteilungen und Empfangsbereich.',
    cost: 65000,
    employeeSlots: 60,
    machineSlots: 40,
    maintenanceCost: 1800,
    applicableBranches: [],
  },
  {
    id: 'werkstatt',
    name: 'Kleine Werkstatt',
    description: 'Kompakte Produktionsfläche für Handwerk und Kleinproduktion. Wenig Büroraum.',
    cost: 30000,
    employeeSlots: 6,
    machineSlots: 80,
    maintenanceCost: 1200,
    applicableBranches: ['produktion', 'bau', 'transport'],
  },
  {
    id: 'kleine_fabrik',
    name: 'Kleine Fabrikhalle',
    description: 'Industriehalle für Maschinenbetrieb und Serienproduktion.',
    cost: 50000,
    employeeSlots: 10,
    machineSlots: 120,
    maintenanceCost: 2500,
    applicableBranches: ['produktion', 'bau'],
  },
  {
    id: 'grosse_fabrik',
    name: 'Große Fabrikhalle',
    description: 'Großflächige Produktionsstätte mit Krananlage und voller Infrastruktur.',
    cost: 100000,
    employeeSlots: 15,
    machineSlots: 300,
    maintenanceCost: 5000,
    applicableBranches: ['produktion'],
  },
  {
    id: 'lager',
    name: 'Warenlager',
    description: 'Große Lagerhalle — wenig Platz für Mitarbeiter, viel für Güter und Maschinen.',
    cost: 25000,
    employeeSlots: 5,
    machineSlots: 150,
    maintenanceCost: 1000,
    applicableBranches: ['handel', 'transport', 'produktion'],
  },
  {
    id: 'depot',
    name: 'Transport-Depot',
    description: 'Fahrzeughof mit Rampen und Werkstatt. Ideal für Flotten und Transportbetriebe.',
    cost: 40000,
    employeeSlots: 8,
    machineSlots: 100,
    maintenanceCost: 1500,
    applicableBranches: ['transport', 'bau'],
  },
]
