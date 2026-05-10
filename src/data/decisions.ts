import type { Branch } from './cities'

export interface DecisionOption {
  id: string
  label: string
  description: string
  consequence: string
  effect: {
    capitalDelta?: number
    branchBonus?: Partial<Record<Branch, number>>
    debtDelta?: number
    moraleDelta?: number
  }
}

export interface Decision {
  id: string
  milestoneId: string
  title: string
  situation: string
  options: DecisionOption[]
}

export const DECISIONS: Decision[] = [
  {
    id: 'dec_erste_erweiterung',
    milestoneId: 'erste_erweiterung',
    title: 'Wohin führt der Weg?',
    situation: 'Dein erstes Büro steht. Deine Berater streiten sich über die Richtung: Wachstum um jeden Preis oder solide Fundamente?',
    options: [
      {
        id: 'aggressiv',
        label: 'Aggressiv expandieren',
        description: 'Schulden aufnehmen, schnell wachsen. Hohes Risiko, hohe Rendite.',
        consequence: '+20.000 ℛℳ Kredit, +20% Einnahmen in allen Branchen für 12 Monate.',
        effect: { debtDelta: 20000, branchBonus: { handel: 0.2, produktion: 0.2, gastro: 0.2, transport: 0.2, bau: 0.2 } },
      },
      {
        id: 'konservativ',
        label: 'Konservativ wachsen',
        description: 'Langsam, aber sicher. Keine Schulden, stabile Basis.',
        consequence: '+10.000 ℛℳ Eigenkapital, niedrigeres Steuerrisiko.',
        effect: { capitalDelta: 10000 },
      },
      {
        id: 'spezialisieren',
        label: 'Branche dominieren',
        description: 'Alles auf eine Karte — Spezialisierung in deiner Startbranche.',
        consequence: '+35% Einnahmen in deiner Startbranche.',
        effect: { branchBonus: { handel: 0.35, produktion: 0.35, gastro: 0.35, transport: 0.35, bau: 0.35 } },
      },
    ],
  },
  {
    id: 'dec_erste_million',
    milestoneId: 'erste_million',
    title: 'Der erste Millionär',
    situation: 'Eine Million Reichsmark. Die Presse klopft an deine Tür. Wie gehst du damit um?',
    options: [
      {
        id: 'oeffentlich',
        label: 'Öffentlich feiern',
        description: 'Pressekonferenz, Zeitungsartikel, Bekanntheit steigt. Auch das Finanzamt schaut genauer hin.',
        consequence: '+15% Einnahmen (Reputation), aber +5% Steuerbelastung.',
        effect: { branchBonus: { handel: 0.15, gastro: 0.15 } },
      },
      {
        id: 'diskret',
        label: 'Diskret bleiben',
        description: 'Kein Aufheben. Reinvestieren, unter dem Radar bleiben.',
        consequence: '+15.000 ℛℳ sofort reinvestiert.',
        effect: { capitalDelta: 15000 },
      },
      {
        id: 'spenden',
        label: 'Großzügig spenden',
        description: 'Ein Teil geht an den Wiederaufbau. Goodwill bei Behörden und Mitarbeitern.',
        consequence: '-5.000 ℛℳ, aber bessere Arbeitnehmerbeziehungen — kein Streik für 12 Monate.',
        effect: { capitalDelta: -5000, moraleDelta: 30 },
      },
    ],
  },
  {
    id: 'dec_erste_stadt',
    milestoneId: 'erste_stadt',
    title: 'Neue Stadt, neue Chancen',
    situation: 'Du hast eine zweite Stadt erschlossen. Wie nutzt du diesen Brückenkopf?',
    options: [
      {
        id: 'hafen',
        label: 'Hafenwirtschaft aufbauen',
        description: 'Investition in Handels- und Transportinfrastruktur der neuen Stadt.',
        consequence: '+25% Einnahmen in Handel & Transport.',
        effect: { branchBonus: { handel: 0.25, transport: 0.25 } },
      },
      {
        id: 'produktion',
        label: 'Produktionsstätte errichten',
        description: 'Günstige Löhne in der neuen Stadt für Fabrikbetrieb nutzen.',
        consequence: '+30% Einnahmen in Produktion.',
        effect: { branchBonus: { produktion: 0.3 } },
      },
      {
        id: 'kapital',
        label: 'Kapital sichern',
        description: 'Erst Geld ansparen, dann investieren.',
        consequence: '+20.000 ℛℳ sofort.',
        effect: { capitalDelta: 20000 },
      },
    ],
  },
  {
    id: 'dec_drei_laender',
    milestoneId: 'drei_laender',
    title: 'Europäischer Akteur',
    situation: 'Dein Imperium überspannt drei Länder. Lokale Behörden und internationale Partner melden sich.',
    options: [
      {
        id: 'lobbying',
        label: 'Politische Kontakte pflegen',
        description: 'Investition in Beziehungen zu Regulierungsbehörden.',
        consequence: '-8.000 ℛℳ, aber +20% in Bau & Handel durch Aufträge.',
        effect: { capitalDelta: -8000, branchBonus: { bau: 0.2, handel: 0.2 } },
      },
      {
        id: 'eigenstaendig',
        label: 'Eigenständig bleiben',
        description: 'Keine politischen Abhängigkeiten. Volle unternehmerische Freiheit.',
        consequence: '+25.000 ℛℳ — kein Geld für Lobbyisten.',
        effect: { capitalDelta: 25000 },
      },
    ],
  },
  {
    id: 'dec_alle_branchen',
    milestoneId: 'alle_branchen',
    title: 'Konglomeratstrategie',
    situation: 'Fünf Branchen unter deinem Dach. Synergiepotential ist riesig — aber Komplexität auch.',
    options: [
      {
        id: 'synergie',
        label: 'Synergien maximieren',
        description: 'Interne Prozesse vernetzen. Höhere Effizienz, mehr Einnahmen.',
        consequence: '+15% Einnahmen in allen Branchen.',
        effect: { branchBonus: { handel: 0.15, produktion: 0.15, gastro: 0.15, transport: 0.15, bau: 0.15 } },
      },
      {
        id: 'verkaufen',
        label: 'Schwächste Branche abstoßen',
        description: 'Fokus auf die stärksten Bereiche.',
        consequence: '+30.000 ℛℳ aus Firmenverkauf.',
        effect: { capitalDelta: 30000 },
      },
    ],
  },
  {
    id: 'dec_grosser_arbeitgeber',
    milestoneId: 'grosser_arbeitgeber',
    title: '500 Mitarbeiter',
    situation: 'Fünfhundert Familien hängen an dir. Die Gewerkschaft klopft an — sie fordern bessere Bedingungen.',
    options: [
      {
        id: 'gewerkschaft',
        label: 'Kollektivvertrag abschließen',
        description: 'Höhere Löhne, bessere Moral, weniger Streiks.',
        consequence: '-10% Gewinn (höhere Löhne), aber Streikrisiko auf 0.',
        effect: { capitalDelta: -15000, moraleDelta: 40 },
      },
      {
        id: 'ablehnen',
        label: 'Forderungen ablehnen',
        description: 'Kurzfristig günstiger, aber Unruhen möglich.',
        consequence: '+10.000 ℛℳ gespart, aber Streikgefahr steigt.',
        effect: { capitalDelta: 10000, moraleDelta: -20 },
      },
      {
        id: 'kompromiss',
        label: 'Kompromiss anbieten',
        description: 'Teilweise Lohnerhöhung, Mitarbeiterfonds.',
        consequence: '-5.000 ℛℳ, moderate Moralverbesserung.',
        effect: { capitalDelta: -5000, moraleDelta: 15 },
      },
    ],
  },
]
