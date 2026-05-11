import type { Branch } from './cities'

export interface MachineTemplate {
  id: string
  name: string
  description: string
  cost: number
  machineSize: number       // belegte Maschineneinheiten (ME) im Standort
  minWorkers: number        // mind. Arbeiter für Betrieb
  minSpecialists: number    // mind. Fachkräfte für Betrieb
  requiresManager: boolean  // braucht Standort-Manager für volle Effizienz
  maxBonus: number          // monatlicher Ertrag bei 100 % Effizienz
  maturityTurns: number     // Monate bis Vollertrag
  applicableBranches: Branch[]
}

export const MACHINE_TEMPLATES: MachineTemplate[] = [
  {
    id: 'naehmaschine',
    name: 'Nähmaschine (Industrie)',
    description: 'Mechanische Nähmaschine für Textilbetriebe. Einfach zu bedienen, schnell rentabel.',
    cost: 12000,
    machineSize: 30,
    minWorkers: 3,
    minSpecialists: 1,
    requiresManager: false,
    maxBonus: 1800,
    maturityTurns: 4,
    applicableBranches: ['handel', 'produktion'],
  },
  {
    id: 'druckmaschine',
    name: 'Druckmaschine',
    description: 'Großformatige Offsetdruckmaschine. Benötigt geschulte Fachkräfte und Koordination.',
    cost: 28000,
    machineSize: 40,
    minWorkers: 2,
    minSpecialists: 2,
    requiresManager: true,
    maxBonus: 3500,
    maturityTurns: 6,
    applicableBranches: ['handel', 'produktion'],
  },
  {
    id: 'kuehlanlage',
    name: 'Kühlanlage',
    description: 'Industriekühlhaus für Lebensmittel und verderbliche Waren.',
    cost: 18000,
    machineSize: 25,
    minWorkers: 2,
    minSpecialists: 0,
    requiresManager: false,
    maxBonus: 2000,
    maturityTurns: 3,
    applicableBranches: ['handel', 'gastro', 'transport'],
  },
  {
    id: 'baumaschine',
    name: 'Baumaschine (Bagger/Kran)',
    description: 'Schweres Gerät für Aushub und Montage. Unverzichtbar für den Wiederaufbau.',
    cost: 45000,
    machineSize: 60,
    minWorkers: 3,
    minSpecialists: 1,
    requiresManager: true,
    maxBonus: 5500,
    maturityTurns: 8,
    applicableBranches: ['bau', 'transport'],
  },
  {
    id: 'werkzeugmaschinen',
    name: 'Werkzeugmaschinenpark',
    description: 'Dreh-, Fräs- und Bohrmaschinen für die mechanische Fertigung.',
    cost: 38000,
    machineSize: 50,
    minWorkers: 4,
    minSpecialists: 2,
    requiresManager: true,
    maxBonus: 4800,
    maturityTurns: 7,
    applicableBranches: ['produktion', 'bau'],
  },
  {
    id: 'qualitaetspruefanlage',
    name: 'Qualitätsprüfanlage',
    description: 'Messgeräte und Prüfstände zur Qualitätssicherung in der Fertigung.',
    cost: 15000,
    machineSize: 20,
    minWorkers: 1,
    minSpecialists: 2,
    requiresManager: false,
    maxBonus: 2200,
    maturityTurns: 4,
    applicableBranches: ['produktion'],
  },
  {
    id: 'dampfkessel',
    name: 'Dampfkessel & Antriebsanlage',
    description: 'Zentrale Energieversorgung für industrielle Anlagen. Hohe Anfangsinvestition, starker Multiplikator.',
    cost: 55000,
    machineSize: 45,
    minWorkers: 3,
    minSpecialists: 2,
    requiresManager: true,
    maxBonus: 6500,
    maturityTurns: 10,
    applicableBranches: ['produktion', 'bau', 'transport'],
  },
]
