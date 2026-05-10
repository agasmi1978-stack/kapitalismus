import type { Branch } from './cities'

export type RivalStrategy = 'aggressiv' | 'spezialist'

export interface RivalTemplate {
  id: string
  name: string
  fullName: string
  background: string
  strategy: RivalStrategy
  specialization?: Branch
  startCapital: number
  aggressionLevel: number
}

export const RIVAL_TEMPLATES: RivalTemplate[] = [
  {
    id: 'krueger',
    name: 'Krüger',
    fullName: 'Heinrich Krüger',
    background: 'Sohn eines Stahlbarons aus dem Ruhrgebiet. Kennt nur Wachstum um jeden Preis.',
    strategy: 'aggressiv',
    startCapital: 15000,
    aggressionLevel: 0.9,
  },
  {
    id: 'hoffmann',
    name: 'Hoffmann',
    fullName: 'Elisabeth Hoffmann',
    background: 'Tochter eines Hamburger Kaufmanns. Spezialistin für Handelsrouten.',
    strategy: 'spezialist',
    specialization: 'handel',
    startCapital: 18000,
    aggressionLevel: 0.4,
  },
  {
    id: 'brenner',
    name: 'Brenner',
    fullName: 'Karl Brenner',
    background: 'Ehemaliger Eisenbahningenieur. Baut sein Transportimperium systematisch aus.',
    strategy: 'spezialist',
    specialization: 'transport',
    startCapital: 12000,
    aggressionLevel: 0.5,
  },
  {
    id: 'richter',
    name: 'Richter',
    fullName: 'Gustav Richter',
    background: 'Gerissenster Bauunternehmer Frankfurts. Kauft billig, verkauft teuer.',
    strategy: 'aggressiv',
    startCapital: 20000,
    aggressionLevel: 0.8,
  },
  {
    id: 'mayer',
    name: 'Mayer',
    fullName: 'Rosa Mayer',
    background: 'Aufgebaut aus dem Nichts. Ihre Hotelkette wächst rasant durch ganz Europa.',
    strategy: 'spezialist',
    specialization: 'gastro',
    startCapital: 14000,
    aggressionLevel: 0.3,
  },
  {
    id: 'wolff',
    name: 'Wolff',
    fullName: 'Anton Wolff',
    background: 'Fabrikant mit Verbindungen zu Zulieferern in ganz Europa.',
    strategy: 'spezialist',
    specialization: 'produktion',
    startCapital: 16000,
    aggressionLevel: 0.5,
  },
  {
    id: 'steinbach',
    name: 'Steinbach',
    fullName: 'Werner Steinbach',
    background: 'Rücksichtsloser Aufsteiger. Scheut keine Konfrontation.',
    strategy: 'aggressiv',
    startCapital: 10000,
    aggressionLevel: 1.0,
  },
  {
    id: 'fischer',
    name: 'Fischer',
    fullName: 'Margarethe Fischer',
    background: 'Geduldige Strategin. Wartet auf die richtige Gelegenheit.',
    strategy: 'spezialist',
    specialization: 'bau',
    startCapital: 22000,
    aggressionLevel: 0.2,
  },
]
