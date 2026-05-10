import type { Rival, NewsEvent } from '../store/gameStore'
import type { MarketPrices } from './market'
import { RIVAL_TEMPLATES } from '../data/rivals'
import { CITIES } from '../data/cities'

let _rivalCounter = 0

export function spawnInitialRivals(count: number = 6): Rival[] {
  const shuffled = [...RIVAL_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, count)
  return shuffled.map(t => ({
    id: `rival-${++_rivalCounter}`,
    templateId: t.id,
    name: t.fullName,
    capital: t.startCapital,
    companies: 1,
    cities: [CITIES[Math.floor(Math.random() * 4)].id],
    netWorth: t.startCapital,
    eliminated: false,
  }))
}

export function updateRivals(
  rivals: Rival[],
  marketPrices: MarketPrices,
  playerNetWorth: number
): { updatedRivals: Rival[]; events: NewsEvent[] } {
  const events: NewsEvent[] = []
  const updatedRivals = rivals.map(rival => {
    if (rival.eliminated) return rival

    const template = RIVAL_TEMPLATES.find(t => t.id === rival.templateId)
    if (!template) return rival

    // Einfaches Wachstumsmodell
    const growthRate = template.strategy === 'aggressiv' ? 0.03 : 0.02
    const marketBonus = template.specialization
      ? (marketPrices[template.specialization] ?? 1.0) - 1.0
      : 0
    const growth = rival.capital * (growthRate + marketBonus * 0.5)

    let newCapital = rival.capital + growth
    let newNetWorth = rival.netWorth + growth * 1.2
    let newCompanies = rival.companies
    let newCities = [...rival.cities]

    // Expansion: aggressiver Rivale expandiert häufiger
    if (newCapital > rival.companies * 25000 && Math.random() < template.aggressionLevel * 0.15) {
      newCompanies += 1
      newCapital -= 15000
      if (newCities.length < 3 && Math.random() < 0.4) {
        const newCity = CITIES.find(c => !newCities.includes(c.id))
        if (newCity) newCities.push(newCity.id)
      }
    }

    // Rivalenreaktion: wenn Spieler zu mächtig wird
    if (playerNetWorth > rival.netWorth * 3 && template.aggressionLevel > 0.6 && Math.random() < 0.1) {
      events.push({
        id: `rival-retaliation-${rival.id}-${Date.now()}`,
        headline: `${template.name} schlägt zurück!`,
        body: `${rival.name} beobachtet deinen Aufstieg mit Argwohn. Der Rivale investiert massiv in deine stärksten Märkte, um deinen Vorsprung zu verringern.`,
        date: '',
        type: 'rival',
        branchEffect: template.specialization
          ? { [template.specialization]: -0.08 }
          : undefined,
      })
      newCapital += 20000
    }

    // Insolvenz
    if (newCapital < 0) {
      events.push({
        id: `rival-bankrupt-${rival.id}`,
        headline: `${template.name} ist insolvent!`,
        body: `${rival.name} konnte die Schulden nicht mehr bedienen. Das Unternehmen wird liquidiert — eine Übernahmechance für kluge Investoren.`,
        date: '',
        type: 'rival',
      })
      return { ...rival, eliminated: true, capital: 0, netWorth: 0 }
    }

    return {
      ...rival,
      capital: newCapital,
      netWorth: newNetWorth,
      companies: newCompanies,
      cities: newCities,
    }
  })

  return { updatedRivals, events }
}
