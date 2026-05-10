import type { InvestmentGoodType } from '../store/gameStore'
import type { Branch } from './cities'

export interface InvestmentGoodTemplate {
  id: string
  type: InvestmentGoodType
  name: string
  description: string
  cost: number
  revenueBonus: number
  applicableBranches: Branch[]
}

export const INVESTMENT_GOOD_TEMPLATES: InvestmentGoodTemplate[] = [
  // Maschinen
  {
    id: 'naehmaschine',
    type: 'maschine',
    name: 'Nähmaschinenpark',
    description: 'Erhöht die Produktionskapazität für Textilien.',
    cost: 8000,
    revenueBonus: 1200,
    applicableBranches: ['produktion'],
  },
  {
    id: 'druckmaschine',
    type: 'maschine',
    name: 'Druckmaschine',
    description: 'Für Verpackung und Werbematerial.',
    cost: 12000,
    revenueBonus: 1800,
    applicableBranches: ['produktion', 'handel'],
  },
  {
    id: 'kuehlanlage',
    type: 'maschine',
    name: 'Kühlanlage',
    description: 'Unverzichtbar für Lebensmittel und Gastronomie.',
    cost: 10000,
    revenueBonus: 1500,
    applicableBranches: ['gastro', 'produktion'],
  },
  {
    id: 'baumaschine',
    type: 'maschine',
    name: 'Baukran & Gerüst',
    description: 'Beschleunigt Bauprojekte erheblich.',
    cost: 18000,
    revenueBonus: 2800,
    applicableBranches: ['bau'],
  },
  // Fahrzeuge
  {
    id: 'lieferwagen',
    type: 'fahrzeug',
    name: 'Lieferwagen (Flotte)',
    description: '5 Lieferwagen für schnelle Warenverteilung.',
    cost: 6000,
    revenueBonus: 900,
    applicableBranches: ['handel', 'transport', 'gastro'],
  },
  {
    id: 'lkw',
    type: 'fahrzeug',
    name: 'LKW-Flotte',
    description: 'Schwere Transporter für große Güter.',
    cost: 15000,
    revenueBonus: 2500,
    applicableBranches: ['transport', 'bau'],
  },
  {
    id: 'gueterzug',
    type: 'fahrzeug',
    name: 'Güterwaggons (Pacht)',
    description: 'Gepachtete Eisenbahnwaggons für europäische Routen.',
    cost: 25000,
    revenueBonus: 4000,
    applicableBranches: ['transport', 'handel'],
  },
  // Gebäude
  {
    id: 'buero',
    type: 'gebaeude',
    name: 'Bürogebäude',
    description: 'Repräsentative Räumlichkeiten steigern das Ansehen.',
    cost: 14000,
    revenueBonus: 2000,
    applicableBranches: ['handel', 'transport', 'bau'],
  },
  {
    id: 'fabrikhalle',
    type: 'gebaeude',
    name: 'Fabrikhalle',
    description: 'Große Produktionsfläche für Massenherstellung.',
    cost: 30000,
    revenueBonus: 5000,
    applicableBranches: ['produktion'],
  },
  {
    id: 'restaurant',
    type: 'gebaeude',
    name: 'Restaurant-Erweiterung',
    description: 'Zusätzliche Sitzplätze und Küche.',
    cost: 14000,
    revenueBonus: 2200,
    applicableBranches: ['gastro'],
  },
  {
    id: 'hotel',
    type: 'gebaeude',
    name: 'Hotelflügel',
    description: 'Neuer Flügel mit 20 Zimmern.',
    cost: 35000,
    revenueBonus: 6000,
    applicableBranches: ['gastro'],
  },
  // Lager
  {
    id: 'kleines_lager',
    type: 'lager',
    name: 'Kleines Warenlager',
    description: 'Pufferkapazität für Waren und Rohstoffe.',
    cost: 5000,
    revenueBonus: 600,
    applicableBranches: ['handel', 'produktion', 'transport'],
  },
  {
    id: 'grosses_lager',
    type: 'lager',
    name: 'Großes Hafenlager',
    description: 'Kapazität für internationalen Warenumschlag.',
    cost: 18000,
    revenueBonus: 2800,
    applicableBranches: ['handel', 'transport'],
  },
  {
    id: 'baustofflager',
    type: 'lager',
    name: 'Baustofflager',
    description: 'Zement, Holz und Stahl auf Vorrat.',
    cost: 10000,
    revenueBonus: 1500,
    applicableBranches: ['bau'],
  },
]
