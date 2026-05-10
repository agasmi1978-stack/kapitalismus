import type { Branch } from '../data/cities'
import type { Company } from '../store/gameStore'

export interface SynergyBonus {
  branches: [Branch, Branch]
  label: string
  description: string
  bonusPercent: number
}

export const SYNERGY_DEFINITIONS: SynergyBonus[] = [
  {
    branches: ['transport', 'handel'],
    label: 'Logistik-Vorteil',
    description: 'Eigene Transportflotte senkt Handelskosten.',
    bonusPercent: 12,
  },
  {
    branches: ['transport', 'produktion'],
    label: 'Direkt-Lieferkette',
    description: 'Güter direkt vom Werk zum Kunden — ohne Zwischenhändler.',
    bonusPercent: 10,
  },
  {
    branches: ['transport', 'bau'],
    label: 'Baumaterial-Logistik',
    description: 'Eigene Transporter für Baumaterialien sparen Kosten.',
    bonusPercent: 10,
  },
  {
    branches: ['produktion', 'gastro'],
    label: 'Eigenversorgung',
    description: 'Eigene Produktion beliefert direkt die Restaurants.',
    bonusPercent: 15,
  },
  {
    branches: ['bau', 'gastro'],
    label: 'Eigenbau-Vorteil',
    description: 'Eigene Baufirma renoviert und erweitert die Hotels.',
    bonusPercent: 12,
  },
  {
    branches: ['handel', 'produktion'],
    label: 'Vertikal integriert',
    description: 'Produktion und Vertrieb aus einer Hand.',
    bonusPercent: 10,
  },
]

export interface ActiveSynergy {
  definition: SynergyBonus
  affectedBranches: Branch[]
}

export function computeSynergies(companies: Company[]): ActiveSynergy[] {
  const presentBranches = new Set(companies.map(c => c.branch))
  return SYNERGY_DEFINITIONS
    .filter(s => presentBranches.has(s.branches[0]) && presentBranches.has(s.branches[1]))
    .map(s => ({ definition: s, affectedBranches: [s.branches[0], s.branches[1]] }))
}

export function applySynergiesToRevenue(
  baseRevenue: number,
  branch: Branch,
  synergies: ActiveSynergy[]
): number {
  let multiplier = 1.0
  synergies.forEach(s => {
    if (s.affectedBranches.includes(branch)) {
      multiplier += s.definition.bonusPercent / 100
    }
  })
  return baseRevenue * multiplier
}
