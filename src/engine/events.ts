import type { Branch } from '../data/cities'
import type { NewsEvent } from '../store/gameStore'

interface EventTemplate {
  id: string
  headline: string
  body: string
  type: NewsEvent['type']
  branchEffect: Partial<Record<Branch, number>>
  probability: number
  minYear?: number
  maxYear?: number
}

const EVENT_POOL: EventTemplate[] = [
  // Wirtschaftlich
  {
    id: 'rezession',
    headline: 'Wirtschaftskrise erschüttert Europa',
    body: 'Die Nachkriegswirtschaft zeigt erste Schwächen. Konsumausgaben sinken drastisch, Händler melden rückläufige Umsätze.',
    type: 'weltereignis',
    branchEffect: { handel: -0.2, gastro: -0.15, produktion: -0.1 },
    probability: 0.04,
  },
  {
    id: 'wirtschaftsboom',
    headline: 'Wirtschaftswunder: Aufbruchstimmung in Europa',
    body: 'Die Industrie brummt, die Kaufkraft steigt. Unternehmen verzeichnen Rekordumsätze.',
    type: 'weltereignis',
    branchEffect: { handel: 0.2, produktion: 0.25, gastro: 0.15 },
    probability: 0.04,
  },
  {
    id: 'rohstoffknappheit',
    headline: 'Rohstoffmangel trifft Industrie hart',
    body: 'Stahl, Kohle und Holz sind knapp. Produktionskosten steigen, Bauprojekte verzögern sich.',
    type: 'weltereignis',
    branchEffect: { produktion: -0.2, bau: -0.25, transport: -0.1 },
    probability: 0.05,
  },
  {
    id: 'waehrungsreform',
    headline: 'Währungsreform: Neues Geld, neue Chancen',
    body: 'Die Währungsreform stabilisiert die Wirtschaft. Investitionen werden attraktiver, das Vertrauen kehrt zurück.',
    type: 'weltereignis',
    branchEffect: { handel: 0.15, bau: 0.2, transport: 0.1 },
    probability: 0.02,
    minYear: 1947,
    maxYear: 1950,
  },
  // Politisch
  {
    id: 'marshall_plan',
    headline: 'Marshall-Plan: Amerika investiert in Europa',
    body: 'Die Vereinigten Staaten stellen Milliarden für den europäischen Wiederaufbau bereit. Bauunternehmen und Industrie profitieren massiv.',
    type: 'weltereignis',
    branchEffect: { bau: 0.3, produktion: 0.2, transport: 0.15 },
    probability: 0.03,
    minYear: 1947,
    maxYear: 1952,
  },
  {
    id: 'neue_gesetze',
    headline: 'Neue Handelsgesetze erleichtern Exporte',
    body: 'Zollsenkungen und Handelsabkommen öffnen neue Märkte. Händler und Transporteure jubeln.',
    type: 'weltereignis',
    branchEffect: { handel: 0.2, transport: 0.15 },
    probability: 0.04,
  },
  {
    id: 'wahl',
    headline: 'Regierungswechsel: Neue Wirtschaftspolitik',
    body: 'Nach der Wahl kündigt die neue Regierung Konjunkturprogramme an. Die Märkte reagieren verhalten.',
    type: 'weltereignis',
    branchEffect: { bau: 0.1, handel: 0.05, produktion: -0.05 },
    probability: 0.05,
  },
  // Gesellschaftlich
  {
    id: 'streikwelle',
    headline: 'Streikwelle lähmt Betriebe',
    body: 'Arbeiter in mehreren Branchen legen die Arbeit nieder. Forderungen nach höheren Löhnen und besseren Bedingungen.',
    type: 'weltereignis',
    branchEffect: { produktion: -0.25, transport: -0.2, bau: -0.15 },
    probability: 0.05,
  },
  {
    id: 'bevoelkerungswachstum',
    headline: 'Bevölkerungswachstum kurbelt Konsum an',
    body: 'Die Geburtenrate steigt, Flüchtlinge strömen in die Städte. Der Bedarf an Wohnraum und Gütern explodiert.',
    type: 'weltereignis',
    branchEffect: { gastro: 0.15, bau: 0.2, handel: 0.1 },
    probability: 0.05,
  },
  {
    id: 'konsumtrend',
    headline: 'Neuer Konsumtrend: Europäer kaufen mehr',
    body: 'Steigende Löhne und wachsendes Vertrauen lassen den Konsum anziehen. Gastronomie und Handel profitieren.',
    type: 'weltereignis',
    branchEffect: { gastro: 0.2, handel: 0.15 },
    probability: 0.06,
  },
  // Katastrophen
  {
    id: 'ueberschwemmung',
    headline: 'Überschwemmungen verwüsten Transportwege',
    body: 'Starkregen und Hochwasser unterbrechen wichtige Handelsrouten. Logistikunternehmen melden massive Ausfälle.',
    type: 'weltereignis',
    branchEffect: { transport: -0.3, handel: -0.15 },
    probability: 0.03,
  },
  {
    id: 'brand',
    headline: 'Großbrand zerstört Industriegebiet',
    body: 'Ein verheerendes Feuer vernichtet mehrere Fabriken. Die Produktion in der Region bricht ein.',
    type: 'weltereignis',
    branchEffect: { produktion: -0.2, bau: 0.15 },
    probability: 0.03,
  },
  {
    id: 'harter_winter',
    headline: 'Rekordkälte lähmt Europa',
    body: 'Der härteste Winter seit Jahrzehnten. Straßen und Häfen frieren zu, die Versorgung stockt.',
    type: 'weltereignis',
    branchEffect: { transport: -0.25, handel: -0.1, gastro: 0.1 },
    probability: 0.04,
  },
]

export function generateEvent(year: number): EventTemplate | null {
  const eligible = EVENT_POOL.filter(e => {
    if (e.minYear && year < e.minYear) return false
    if (e.maxYear && year > e.maxYear) return false
    return Math.random() < e.probability
  })
  if (eligible.length === 0) return null
  return eligible[Math.floor(Math.random() * eligible.length)]
}

export function templateToNewsEvent(t: EventTemplate, year: number, month: number): NewsEvent {
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
  return {
    id: `${t.id}-${year}-${month}`,
    headline: t.headline,
    body: t.body,
    date: `${MONTHS[month - 1]} ${year}`,
    type: t.type,
    branchEffect: t.branchEffect,
  }
}
