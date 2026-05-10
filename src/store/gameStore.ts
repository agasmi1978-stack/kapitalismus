import { create } from 'zustand'
import { CITIES, type Branch } from '../data/cities'
import { INVESTMENT_GOOD_TEMPLATES } from '../data/investmentGoods'
import { generateEvent, templateToNewsEvent } from '../engine/events'
import { initMarketPrices, updateMarketPrices, applyMarketToRevenue } from '../engine/market'
import { spawnInitialRivals, updateRivals } from '../engine/ai'
import { MILESTONES } from '../data/milestones'
import { computeSynergies, applySynergiesToRevenue } from '../engine/synergies'
import { DECISIONS, type Decision } from '../data/decisions'
import { RIVAL_TEMPLATES } from '../data/rivals'

let _companyCounter = 0
function newCompanyId() { return `company-${++_companyCounter}` }
let _employeeCounter = 0
function newEmployeeId() { return `emp-${++_employeeCounter}` }

// ---------------------------------------------------------------------------
// Konstanten
// ---------------------------------------------------------------------------

const SALARY_DEFAULT: Record<EmployeeLevel, number> = {
  arbeiter: 300,
  fachkraft: 600,
  manager: 1200,
}

// Maximalertrag bei 100 % Produktivität
export const REVENUE_PER_EMPLOYEE: Record<EmployeeLevel, number> = {
  arbeiter: 500,
  fachkraft: 1000,
  manager: 1800,
}

// Einmalige Einstellungskosten (Arbeitsplatz, Einarbeitung, Verwaltung)
export const HIRING_COST: Record<EmployeeLevel, number> = {
  arbeiter: 1500,
  fachkraft: 5000,
  manager: 15000,
}

// Weiterbildungskosten
export const TRAINING_COST: Record<EmployeeLevel, number> = {
  arbeiter: 10000,
  fachkraft: 30000,
  manager: 0,
}

// Produktivität wächst 6,25 % pro Monat → von 50 % auf 100 % in 8 Monaten
const PRODUCTIVITY_GAIN_PER_TURN = 6.25

// Chancen auf Verfügbarkeit pro Monat
const LABOR_MARKET_CHANCE: Record<EmployeeLevel, number> = {
  arbeiter: 0.80,
  fachkraft: 0.55,
  manager: 0.35,
}

const FOUND_COST = 35000

// ---------------------------------------------------------------------------
// Typen & Interfaces
// ---------------------------------------------------------------------------

export type EmployeeLevel = 'arbeiter' | 'fachkraft' | 'manager'
export type InvestmentGoodType = 'maschine' | 'fahrzeug' | 'gebaeude' | 'lager' | 'sonstiges'
export type GamePhase = 'menu' | 'setup' | 'playing' | 'gameover' | 'victory'
export type VictoryCondition = 'vermoegen' | 'marktfuehrer' | 'expansion' | 'endlos'

export interface Employee {
  id: string
  level: EmployeeLevel
  salary: number
  morale: number
  skill: number
  hiredAt: number       // Runde, in der eingestellt
  productivity: number  // 50–100, wächst über Zeit
}

export interface InvestmentGood {
  id: string
  type: InvestmentGoodType
  name: string
  cost: number
  maxBonus: number      // Vollertrag bei 100 % Reife
  maturityTurns: number // Monate bis Vollertrag
  purchasedAt: number   // Runde des Kaufs
}

export interface Company {
  id: string
  name: string
  branch: Branch
  cityId: string
  baseRevenue: number   // Grundumsatz ohne Mitarbeiter/Güter
  revenue: number       // Gesamtumsatz (dynamisch berechnet & gespeichert)
  expenses: number
  employees: Employee[]
  investmentGoods: InvestmentGood[]
  listed: boolean
  sharePrice: number
  founded: number
}

export interface Rival {
  id: string
  templateId: string
  name: string
  capital: number
  companies: number
  cities: string[]
  netWorth: number
  eliminated: boolean
}

export interface NewsEvent {
  id: string
  headline: string
  body: string
  date: string
  type: 'weltereignis' | 'meilenstein' | 'rival' | 'markt'
  branchEffect?: Partial<Record<Branch, number>>
}

export interface GameState {
  phase: GamePhase
  turn: number
  year: number
  month: number
  playerName: string
  startCityId: string
  startBranch: Branch | null
  capital: number
  debt: number
  companies: Company[]
  unlockedCities: string[]
  rivals: Rival[]
  newsQueue: NewsEvent[]
  currentNews: NewsEvent | null
  newsHistory: NewsEvent[]
  achievedMilestones: string[]
  victoryCondition: VictoryCondition
  aiVictoryEnabled: boolean
  marketPrices: Partial<Record<Branch, number>>
  insolvencyTurns: number
  gameOverReason: string | null
  pendingDecision: Decision | null
  branchBonusOverrides: Partial<Record<Branch, number>>
  activeCooperations: Array<{ rivalId: string; rivalName: string; branch: Branch; turnsLeft: number }>
  decisionsMade: string[]
  laborMarketAvailability: Record<EmployeeLevel, boolean>

  setPhase: (phase: GamePhase) => void
  setPlayerName: (name: string) => void
  setStartCity: (cityId: string) => void
  setStartBranch: (branch: Branch) => void
  setVictoryCondition: (v: VictoryCondition) => void
  setAiVictoryEnabled: (v: boolean) => void
  startNewGame: () => void
  endTurn: () => void
  dismissNews: () => void
  saveGame: () => void
  loadGame: (data: unknown) => void
  hireEmployee: (companyId: string, level: EmployeeLevel) => string | null
  fireEmployee: (companyId: string, employeeId: string) => void
  trainEmployee: (companyId: string, employeeId: string) => string | null
  setSalary: (companyId: string, employeeId: string, salary: number) => void
  buyInvestmentGood: (companyId: string, templateId: string) => string | null
  foundCompany: (name: string, branch: Branch, cityId: string) => string | null
  unlockCity: (cityId: string) => string | null
  takeLoan: (amount: number) => string | null
  repayLoan: (amount: number) => string | null
  sellCompany: (companyId: string) => string | null
  buyRivalCompany: (rivalId: string) => string | null
  makeDecision: (decisionId: string, optionId: string) => void
  proposeCooperation: (rivalId: string, branch: Branch) => string | null
  listCompany: (companyId: string) => string | null
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

function rollLaborMarket(): Record<EmployeeLevel, boolean> {
  return {
    arbeiter: Math.random() < LABOR_MARKET_CHANCE.arbeiter,
    fachkraft: Math.random() < LABOR_MARKET_CHANCE.fachkraft,
    manager: Math.random() < LABOR_MARKET_CHANCE.manager,
  }
}

/** Berechnet den aktuellen Gesamtumsatz einer Firma dynamisch */
function computeCompanyRevenue(company: Company, turn: number): number {
  const empRevenue = company.employees.reduce((sum, e) => {
    return sum + Math.round(REVENUE_PER_EMPLOYEE[e.level] * (e.productivity / 100))
  }, 0)

  const goodsRevenue = company.investmentGoods.reduce((sum, g) => {
    const monthsOwned = Math.max(0, turn - g.purchasedAt)
    const maturity = Math.min(1.0, 0.2 + (monthsOwned / Math.max(1, g.maturityTurns)) * 0.8)
    return sum + Math.round(g.maxBonus * maturity)
  }, 0)

  return (company.baseRevenue ?? 1500) + empRevenue + goodsRevenue
}

const STARTING_CAPITAL = 30000

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  turn: 0,
  year: 1945,
  month: 1,
  playerName: '',
  startCityId: '',
  startBranch: null,
  capital: STARTING_CAPITAL,
  debt: 0,
  companies: [],
  unlockedCities: [],
  rivals: [],
  newsQueue: [],
  currentNews: null,
  newsHistory: [],
  achievedMilestones: [],
  victoryCondition: 'endlos',
  aiVictoryEnabled: false,
  marketPrices: {},
  insolvencyTurns: 0,
  gameOverReason: null,
  pendingDecision: null,
  branchBonusOverrides: {},
  activeCooperations: [],
  decisionsMade: [],
  laborMarketAvailability: { arbeiter: true, fachkraft: true, manager: true },

  setPhase: (phase) => set({ phase }),
  setPlayerName: (name) => set({ playerName: name }),
  setStartCity: (cityId) => set({ startCityId: cityId }),
  setStartBranch: (branch) => set({ startBranch: branch }),
  setVictoryCondition: (v) => set({ victoryCondition: v }),
  setAiVictoryEnabled: (v) => set({ aiVictoryEnabled: v }),

  startNewGame: () => {
    const { startCityId, startBranch, playerName } = get()
    if (!startCityId || !startBranch || !playerName) return

    const startingCompany: Company = {
      id: 'company-start',
      name: `${playerName} & Co.`,
      branch: startBranch,
      cityId: startCityId,
      baseRevenue: 2500,
      revenue: 2500,
      expenses: 1400,
      employees: [],
      investmentGoods: [],
      listed: false,
      sharePrice: 100,
      founded: 0,
    }

    const introNews: NewsEvent = {
      id: 'news-intro',
      headline: 'Ein neues Kapitel beginnt',
      body: `${playerName} übernimmt das Familienunternehmen. Europa liegt in Trümmern — doch in Trümmern stecken die größten Chancen. Der Wiederaufbau beginnt.`,
      date: 'Januar 1945',
      type: 'meilenstein',
    }

    set({
      phase: 'playing',
      turn: 1,
      year: 1945,
      month: 1,
      capital: STARTING_CAPITAL,
      debt: 0,
      companies: [startingCompany],
      unlockedCities: [startCityId],
      rivals: spawnInitialRivals(6),
      newsQueue: [],
      currentNews: introNews,
      newsHistory: [introNews],
      achievedMilestones: ['erbe'],
      marketPrices: initMarketPrices(),
      insolvencyTurns: 0,
      gameOverReason: null,
      laborMarketAvailability: rollLaborMarket(),
      pendingDecision: null,
      decisionsMade: [],
      branchBonusOverrides: {},
      activeCooperations: [],
    })
  },

  endTurn: () => {
    const state = get()
    let { capital, month, year, turn, marketPrices } = state

    // 1. Weltereignis
    const newEvent = generateEvent(year)
    const branchEffect = newEvent?.branchEffect ?? {}

    // 2. Marktpreise
    const newMarketPrices = updateMarketPrices(marketPrices, branchEffect)

    // 3. Kooperationen
    const updatedCooperations = state.activeCooperations
      .map(c => ({ ...c, turnsLeft: c.turnsLeft - 1 }))
      .filter(c => c.turnsLeft > 0)

    const cooperationBonus: Partial<Record<Branch, number>> = {}
    updatedCooperations.forEach(coop => {
      cooperationBonus[coop.branch] = (cooperationBonus[coop.branch] ?? 0) + 0.12
    })

    // 4. Mitarbeiter: Produktivität steigern + Moral-Drift
    const companiesAfterGrowth = state.companies.map(c => ({
      ...c,
      employees: c.employees.map(e => {
        const newProductivity = Math.min(100, e.productivity + PRODUCTIVITY_GAIN_PER_TURN)
        const fairSalary = SALARY_DEFAULT[e.level]
        const moraleDrift = e.salary >= fairSalary ? 2 : -3
        return {
          ...e,
          productivity: newProductivity,
          morale: Math.max(0, Math.min(100, e.morale + moraleDrift)),
        }
      }),
    }))

    // 5. Umsatz dynamisch neu berechnen (Produktivität + Güter-Reife)
    const companiesWithRevenue = companiesAfterGrowth.map(c => ({
      ...c,
      revenue: computeCompanyRevenue(c, turn),
    }))

    // 6. Synergien & Boni aufbauen
    const synergies = computeSynergies(companiesWithRevenue)
    const combinedBonus: Partial<Record<Branch, number>> = { ...state.branchBonusOverrides }
    Object.entries(cooperationBonus).forEach(([b, v]) => {
      combinedBonus[b as Branch] = (combinedBonus[b as Branch] ?? 0) + v
    })

    // 7. Einkommen berechnen
    let income = 0
    companiesWithRevenue.forEach((c) => {
      const marketRevenue = applyMarketToRevenue(c.revenue, c.branch, newMarketPrices)
      const synergyRevenue = applySynergiesToRevenue(marketRevenue, c.branch, synergies)
      const decisionBonus = 1 + (combinedBonus[c.branch] ?? 0)
      income += synergyRevenue * decisionBonus - c.expenses
    })
    capital += income

    // 8. Streiks
    companiesWithRevenue.forEach(c => {
      const strikers = c.employees.filter(e => e.morale < 40)
      if (strikers.length > 0) {
        const lostRevenue = strikers.length * 200
        income -= lostRevenue
        capital -= lostRevenue
      }
    })

    // 8b. Dividende für börsennotierte Firmen (10 % des Gewinns an Aktionäre)
    let dividendTotal = 0
    companiesWithRevenue.forEach(c => {
      if (c.listed) {
        const profit = c.revenue - c.expenses
        if (profit > 0) dividendTotal += Math.round(profit * 0.10)
      }
    })
    capital -= dividendTotal

    // 8c. Share-Preise aktualisieren (basierend auf Gewinnmarge + Markt)
    const companiesWithUpdatedShares = companiesWithRevenue.map(c => {
      if (!c.listed) return c
      const profit = c.revenue - c.expenses
      const profitMargin = c.revenue > 0 ? profit / c.revenue : 0
      const marketFactor = (newMarketPrices[c.branch] ?? 1.0) - 1.0
      const priceChange = profitMargin * 0.08 + marketFactor * 0.05 + (Math.random() - 0.5) * 0.04
      const newSharePrice = Math.max(1, Math.round(c.sharePrice * (1 + priceChange) * 100) / 100)
      return { ...c, sharePrice: newSharePrice }
    })

    // 9. KI-Rivalen
    const playerNetWorth = capital + companiesWithUpdatedShares.reduce((s, c) => s + c.revenue * 12, 0)
    const { updatedRivals, events: rivalEvents } = updateRivals(state.rivals, newMarketPrices, playerNetWorth)

    // 10. News-Queue
    const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    const newQueue: NewsEvent[] = [...state.newsQueue]
    const newHistoryItems: NewsEvent[] = []
    if (newEvent) {
      const ev = templateToNewsEvent(newEvent, year, month)
      newQueue.push(ev)
      newHistoryItems.push(ev)
    }
    rivalEvents.forEach(e => {
      const ev = { ...e, date: `${MONTHS[month - 1]} ${year}` }
      newQueue.push(ev)
      newHistoryItems.push(ev)
    })

    // 11. Steuern (15 % auf positiven Gewinn)
    if (income > 0) capital -= Math.round(income * 0.15)

    // 12. Kreditzinsen
    if (state.debt > 0) capital -= Math.round(state.debt * 0.00417)

    // 13. Meilensteine
    const newMilestones = [...state.achievedMilestones]
    const netWorth = capital + companiesWithUpdatedShares.reduce((s, c) => s + c.revenue * 12, 0)
    const totalEmployees = companiesWithUpdatedShares.reduce((s, c) => s + c.employees.length, 0)
    const uniqueBranches = new Set(companiesWithUpdatedShares.map(c => c.branch)).size
    const uniqueCities = new Set(companiesWithUpdatedShares.map(c => c.cityId)).size
    const uniqueCountries = new Set(companiesWithUpdatedShares.map(c => CITIES.find(ci => ci.id === c.cityId)?.country)).size

    const milestoneChecks = [
      { id: 'erste_erweiterung', met: companiesWithRevenue.length >= 2 },
      { id: 'erste_stadt', met: uniqueCities >= 2 },
      { id: 'erste_million', met: netWorth >= 1_000_000 },
      { id: 'alle_branchen', met: uniqueBranches >= 5 },
      { id: 'drei_laender', met: uniqueCountries >= 3 },
      { id: 'zehn_millionen', met: netWorth >= 10_000_000 },
      { id: 'fuenf_staedte', met: uniqueCities >= 5 },
      { id: 'grosser_arbeitgeber', met: totalEmployees >= 500 },
      { id: 'hundert_millionen', met: netWorth >= 100_000_000 },
    ]

    milestoneChecks.forEach(({ id, met }) => {
      if (met && !newMilestones.includes(id)) {
        newMilestones.push(id)
        const ms = MILESTONES.find(m => m.id === id)
        if (ms) {
          const msEv: NewsEvent = {
            id: `milestone-${id}`,
            headline: ms.title,
            body: ms.storyText,
            date: `${MONTHS[month - 1]} ${year}`,
            type: 'meilenstein',
          }
          newQueue.push(msEv)
          newHistoryItems.push(msEv)
        }
      }
    })

    // 14. Story-Entscheidungen auslösen
    let pendingDecision: Decision | null = state.pendingDecision
    const newlyAchieved = newMilestones.filter(id => !state.achievedMilestones.includes(id))
    if (!pendingDecision) {
      for (const milestoneId of newlyAchieved) {
        const decision = DECISIONS.find(d => d.milestoneId === milestoneId && !state.decisionsMade.includes(d.id))
        if (decision) { pendingDecision = decision; break }
      }
    }

    // 15. Zeit vorrücken
    month += 1
    if (month > 12) { month = 1; year += 1 }

    // 16. Victory prüfen
    if (state.victoryCondition !== 'endlos') {
      const uniqueCitiesV = new Set(companiesWithUpdatedShares.map(c => c.cityId)).size
      const uniqueBranchesV = new Set(companiesWithUpdatedShares.map(c => c.branch)).size
      let victoryMet = false
      if (state.victoryCondition === 'vermoegen' && netWorth >= 5_000_000) victoryMet = true
      if (state.victoryCondition === 'expansion' && uniqueCitiesV >= 8) victoryMet = true
      if (state.victoryCondition === 'marktfuehrer' && uniqueBranchesV >= 4 && companiesWithRevenue.length >= 6) victoryMet = true

      if (victoryMet) {
        const victoryEv: NewsEvent = {
          id: 'victory-news',
          headline: 'Sieg! Das Imperium ist vollbracht.',
          body: `${state.playerName} hat das gesteckte Ziel erreicht. Europa kennt keinen größeren Namen mehr.`,
          date: `${MONTHS[month - 1]} ${year}`,
          type: 'meilenstein',
        }
        newQueue.push(victoryEv)
        newHistoryItems.push(victoryEv)
        set({ phase: 'victory', currentNews: newQueue[0] ?? null, newsQueue: newQueue.slice(1), newsHistory: [...state.newsHistory, ...newHistoryItems] })
        return
      }

      if (state.aiVictoryEnabled) {
        const topRival = updatedRivals.filter(r => !r.eliminated).sort((a, b) => b.netWorth - a.netWorth)[0]
        if (topRival) {
          let rivalWon = false
          if (state.victoryCondition === 'vermoegen' && topRival.netWorth >= 5_000_000) rivalWon = true
          if (state.victoryCondition === 'expansion' && topRival.cities.length >= 8) rivalWon = true
          if (rivalWon) {
            set({ phase: 'gameover', gameOverReason: `${topRival.name} hat das Ziel vor dir erreicht.`, currentNews: newQueue[0] ?? null, newsQueue: newQueue.slice(1) })
            return
          }
        }
      }
    }

    // 17. Insolvenz prüfen
    let { insolvencyTurns } = state
    let newPhase: GamePhase = state.phase
    let gameOverReason: string | null = state.gameOverReason
    if (capital < -10000) {
      insolvencyTurns += 1
      if (insolvencyTurns >= 3) {
        newPhase = 'gameover'
        gameOverReason = 'Insolvenz — drei Monate tief im Minus. Die Gläubiger haben übernommen.'
      }
    } else {
      insolvencyTurns = 0
    }

    // 18. Arbeitsmarkt neu würfeln
    const newLaborMarket = rollLaborMarket()

    set({
      capital,
      month,
      year,
      turn: turn + 1,
      companies: companiesWithUpdatedShares,
      rivals: updatedRivals,
      marketPrices: newMarketPrices,
      currentNews: newQueue[0] ?? null,
      newsQueue: newQueue.slice(1),
      newsHistory: [...state.newsHistory, ...newHistoryItems],
      achievedMilestones: newMilestones,
      insolvencyTurns,
      phase: newPhase,
      gameOverReason,
      pendingDecision,
      activeCooperations: updatedCooperations,
      laborMarketAvailability: newLaborMarket,
    })
  },

  dismissNews: () => {
    const state = get()
    set({ currentNews: state.newsQueue[0] ?? null, newsQueue: state.newsQueue.slice(1) })
  },

  saveGame: () => {
    const state = get()
    const blob = new Blob([JSON.stringify({
      phase: state.phase, turn: state.turn, year: state.year, month: state.month,
      playerName: state.playerName, startCityId: state.startCityId, startBranch: state.startBranch,
      capital: state.capital, debt: state.debt, companies: state.companies,
      unlockedCities: state.unlockedCities, rivals: state.rivals,
      achievedMilestones: state.achievedMilestones,
      victoryCondition: state.victoryCondition, aiVictoryEnabled: state.aiVictoryEnabled,
    }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kapitalismus_${state.playerName}_${state.year}-${String(state.month).padStart(2, '0')}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  loadGame: (data: unknown) => {
    const d = data as Partial<GameState>
    // Rückwärtskompatibilität: alte Saves ohne baseRevenue/productivity normalisieren
    const companies = (d.companies ?? []).map((c: Company) => ({
      ...c,
      baseRevenue: c.baseRevenue ?? c.revenue ?? 1500,
      employees: (c.employees ?? []).map((e: Employee) => ({
        ...e,
        hiredAt: e.hiredAt ?? 0,
        productivity: e.productivity ?? 100,
      })),
      investmentGoods: (c.investmentGoods ?? []).map((g: InvestmentGood) => ({
        ...g,
        maxBonus: g.maxBonus ?? (g as unknown as { capacityBonus?: number }).capacityBonus ?? 0,
        maturityTurns: g.maturityTurns ?? 6,
        purchasedAt: g.purchasedAt ?? 0,
      })),
    }))
    set({
      phase: d.phase ?? 'playing',
      turn: d.turn ?? 0,
      year: d.year ?? 1945,
      month: d.month ?? 1,
      playerName: d.playerName ?? '',
      startCityId: d.startCityId ?? '',
      startBranch: d.startBranch ?? null,
      capital: d.capital ?? 0,
      debt: d.debt ?? 0,
      companies,
      unlockedCities: d.unlockedCities ?? [],
      rivals: d.rivals ?? [],
      achievedMilestones: d.achievedMilestones ?? [],
      victoryCondition: d.victoryCondition ?? 'endlos',
      aiVictoryEnabled: d.aiVictoryEnabled ?? false,
      currentNews: null,
      newsQueue: [],
      newsHistory: d.newsHistory ?? [],
      laborMarketAvailability: rollLaborMarket(),
    })
  },

  hireEmployee: (companyId, level) => {
    const state = get()

    // Arbeitsmarkt prüfen
    if (!state.laborMarketAvailability[level]) {
      const label = level === 'manager' ? 'Manager' : level === 'fachkraft' ? 'Fachkraft' : 'Arbeiter'
      return `Kein${level === 'fachkraft' ? 'e' : ''} ${label} diesen Monat verfügbar. Nächsten Monat erneut versuchen.`
    }

    // Marktlimit
    const totalOfLevel = state.companies.flatMap(c => c.employees).filter(e => e.level === level).length
    const marketLimit = level === 'manager' ? 5 : level === 'fachkraft' ? 20 : 999
    if (totalOfLevel >= marketLimit) return `Maximale Anzahl an ${level === 'manager' ? 'Managern' : 'Fachkräften'} bereits erreicht.`

    // Einstellungskosten
    const hiringCost = HIRING_COST[level]
    if (state.capital < hiringCost) return `Nicht genug Kapital für Einstellungskosten: ${hiringCost.toLocaleString('de-DE')} ℛℳ`

    const employee: Employee = {
      id: newEmployeeId(),
      level,
      salary: SALARY_DEFAULT[level],
      morale: 70,
      skill: level === 'manager' ? 80 : level === 'fachkraft' ? 60 : 40,
      hiredAt: state.turn,
      productivity: 50, // startet bei 50 %, wächst auf 100 % in ~8 Monaten
    }

    const updatedCompanies = state.companies.map(c => {
      if (c.id !== companyId) return c
      const updated = {
        ...c,
        employees: [...c.employees, employee],
        expenses: c.expenses + employee.salary,
      }
      return { ...updated, revenue: computeCompanyRevenue(updated, state.turn) }
    })

    set({ capital: state.capital - hiringCost, companies: updatedCompanies })
    return null
  },

  fireEmployee: (companyId, employeeId) => {
    const state = get()
    const updatedCompanies = state.companies.map(c => {
      if (c.id !== companyId) return c
      const emp = c.employees.find(e => e.id === employeeId)
      if (!emp) return c
      const updated = {
        ...c,
        employees: c.employees.filter(e => e.id !== employeeId),
        expenses: c.expenses - emp.salary,
      }
      return { ...updated, revenue: computeCompanyRevenue(updated, state.turn) }
    })
    set({ companies: updatedCompanies })
  },

  trainEmployee: (companyId, employeeId) => {
    const state = get()
    const company = state.companies.find(c => c.id === companyId)
    const emp = company?.employees.find(e => e.id === employeeId)
    if (!emp) return 'Mitarbeiter nicht gefunden.'
    if (emp.level === 'manager') return 'Manager können nicht weiter geschult werden.'

    const cost = TRAINING_COST[emp.level]
    if (state.capital < cost) return `Nicht genug Kapital. Weiterbildungskosten: ${cost.toLocaleString('de-DE')} ℛℳ`

    const nextLevel: EmployeeLevel = emp.level === 'arbeiter' ? 'fachkraft' : 'manager'
    const salaryDiff = SALARY_DEFAULT[nextLevel] - emp.salary

    const updatedCompanies = state.companies.map(c => {
      if (c.id !== companyId) return c
      const updated = {
        ...c,
        expenses: c.expenses + salaryDiff,
        employees: c.employees.map(e =>
          e.id !== employeeId ? e : {
            ...e,
            level: nextLevel,
            salary: SALARY_DEFAULT[nextLevel],
            skill: Math.min(100, e.skill + 20),
            morale: Math.min(100, e.morale + 10),
            productivity: 60, // nach Aufstieg leicht zurückgesetzt, wächst neu
          }
        ),
      }
      return { ...updated, revenue: computeCompanyRevenue(updated, state.turn) }
    })

    set({ capital: state.capital - cost, companies: updatedCompanies })
    return null
  },

  setSalary: (companyId, employeeId, salary) => {
    const state = get()
    set({
      companies: state.companies.map(c => {
        if (c.id !== companyId) return c
        const emp = c.employees.find(e => e.id === employeeId)
        if (!emp) return c
        const diff = salary - emp.salary
        const moraleChange = diff > 0 ? 10 : diff < 0 ? -15 : 0
        const updated = {
          ...c,
          expenses: c.expenses + diff,
          employees: c.employees.map(e =>
            e.id !== employeeId ? e : {
              ...e,
              salary,
              morale: Math.max(0, Math.min(100, e.morale + moraleChange)),
            }
          ),
        }
        return { ...updated, revenue: computeCompanyRevenue(updated, state.turn) }
      }),
    })
  },

  buyInvestmentGood: (companyId, templateId) => {
    const state = get()
    const template = INVESTMENT_GOOD_TEMPLATES.find(t => t.id === templateId)
    if (!template) return 'Investitionsgut nicht gefunden.'
    const company = state.companies.find(c => c.id === companyId)
    if (!company) return 'Firma nicht gefunden.'
    if (!template.applicableBranches.includes(company.branch)) return 'Dieses Gut passt nicht zur Branche.'
    if (state.capital < template.cost) return `Nicht genug Kapital. Kosten: ${template.cost.toLocaleString('de-DE')} ℛℳ`
    if (company.investmentGoods.some(g => g.id === templateId)) return 'Diese Firma besitzt dieses Gut bereits.'

    const good: InvestmentGood = {
      id: templateId,
      type: template.type,
      name: template.name,
      cost: template.cost,
      maxBonus: template.revenueBonus,
      maturityTurns: template.maturityTurns,
      purchasedAt: state.turn,
    }

    const updatedCompanies = state.companies.map(c => {
      if (c.id !== companyId) return c
      const updated = { ...c, investmentGoods: [...c.investmentGoods, good] }
      return { ...updated, revenue: computeCompanyRevenue(updated, state.turn) }
    })

    set({ capital: state.capital - template.cost, companies: updatedCompanies })
    return null
  },

  foundCompany: (name, branch, cityId) => {
    const state = get()
    if (state.capital < FOUND_COST) return `Nicht genug Kapital. Gründungskosten: ${FOUND_COST.toLocaleString('de-DE')} ℛℳ`
    if (!state.unlockedCities.includes(cityId)) return 'Diese Stadt ist noch nicht erschlossen.'
    const company: Company = {
      id: newCompanyId(),
      name,
      branch,
      cityId,
      baseRevenue: 1500,
      revenue: 1500,
      expenses: 900,
      employees: [],
      investmentGoods: [],
      listed: false,
      sharePrice: 100,
      founded: state.turn,
    }
    set({ capital: state.capital - FOUND_COST, companies: [...state.companies, company] })
    return null
  },

  unlockCity: (cityId) => {
    const state = get()
    const city = CITIES.find(c => c.id === cityId)
    if (!city) return 'Stadt nicht gefunden.'
    if (state.unlockedCities.includes(cityId)) return 'Stadt bereits erschlossen.'
    if (state.capital < city.unlockCost) return `Nicht genug Kapital. Kosten: ${city.unlockCost.toLocaleString('de-DE')} ℛℳ`
    set({ capital: state.capital - city.unlockCost, unlockedCities: [...state.unlockedCities, cityId] })
    return null
  },

  takeLoan: (amount) => {
    const state = get()
    const MAX_DEBT = 200000
    if (amount < 1000) return 'Mindestbetrag: 1.000 ℛℳ'
    if (state.debt + amount > MAX_DEBT) return `Kreditlimit überschritten. Max: ${MAX_DEBT.toLocaleString('de-DE')} ℛℳ`
    set({ capital: state.capital + amount, debt: state.debt + amount })
    return null
  },

  repayLoan: (amount) => {
    const state = get()
    if (amount <= 0) return 'Ungültiger Betrag.'
    if (amount > state.debt) return `Schulden betragen nur ${state.debt.toLocaleString('de-DE')} ℛℳ`
    if (amount > state.capital) return 'Nicht genug Kapital zur Tilgung.'
    set({ capital: state.capital - amount, debt: state.debt - amount })
    return null
  },

  sellCompany: (companyId) => {
    const state = get()
    if (state.companies.length <= 1) return 'Du kannst deine letzte Firma nicht verkaufen.'
    const company = state.companies.find(c => c.id === companyId)
    if (!company) return 'Firma nicht gefunden.'
    const salePrice = Math.round(company.revenue * 10 * 0.8)
    set({ capital: state.capital + salePrice, companies: state.companies.filter(c => c.id !== companyId) })
    return null
  },

  buyRivalCompany: (rivalId) => {
    const state = get()
    const rival = state.rivals.find(r => r.id === rivalId)
    if (!rival || rival.eliminated) return 'Rivale nicht verfügbar.'
    if (rival.companies <= 0) return 'Dieser Rivale hat keine Firmen mehr.'

    // Deutlich teurer: Faktor 2.5 statt 1.5
    const price = Math.round((rival.netWorth / Math.max(1, rival.companies)) * 2.5)
    if (state.capital < price) return `Nicht genug Kapital. Übernahmepreis: ${price.toLocaleString('de-DE')} ℛℳ`

    const branches: Branch[] = ['handel', 'produktion', 'gastro', 'transport', 'bau']
    const acquiredBranch = branches[Math.floor(Math.random() * branches.length)]
    const cityId = rival.cities[0] ?? state.unlockedCities[0]
    const baseRev = Math.round(price / 15)

    const acquiredCompany: Company = {
      id: newCompanyId(),
      name: `${rival.name.split(' ')[1] ?? rival.name} Übernahme`,
      branch: acquiredBranch,
      cityId,
      baseRevenue: baseRev,
      revenue: baseRev,
      expenses: Math.round(price / 25),
      employees: [],
      investmentGoods: [],
      listed: false,
      sharePrice: 100,
      founded: state.turn,
    }

    const updatedRival = rival.companies <= 1
      ? { ...rival, companies: 0, netWorth: rival.netWorth * 0.3, eliminated: true }
      : { ...rival, companies: rival.companies - 1, netWorth: rival.netWorth - price / 2.5 }

    set({
      capital: state.capital - price,
      companies: [...state.companies, acquiredCompany],
      rivals: state.rivals.map(r => r.id === rivalId ? updatedRival : r),
    })
    return null
  },

  makeDecision: (decisionId, optionId) => {
    const state = get()
    const decision = DECISIONS.find(d => d.id === decisionId)
    const option = decision?.options.find(o => o.id === optionId)
    if (!decision || !option) return

    let capital = state.capital
    let debt = state.debt
    const newBonuses = { ...state.branchBonusOverrides }

    if (option.effect.capitalDelta) capital += option.effect.capitalDelta
    if (option.effect.debtDelta) { capital += option.effect.debtDelta; debt += option.effect.debtDelta }
    if (option.effect.branchBonus) {
      Object.entries(option.effect.branchBonus).forEach(([b, v]) => {
        newBonuses[b as Branch] = (newBonuses[b as Branch] ?? 0) + (v as number) * 0.1
      })
    }
    if (option.effect.moraleDelta) {
      set({
        companies: state.companies.map(c => ({
          ...c,
          employees: c.employees.map(e => ({
            ...e,
            morale: Math.max(0, Math.min(100, e.morale + (option.effect.moraleDelta ?? 0))),
          })),
        })),
      })
    }

    set({ capital, debt, branchBonusOverrides: newBonuses, pendingDecision: null, decisionsMade: [...state.decisionsMade, decisionId] })
  },

  listCompany: (companyId) => {
    const state = get()
    const company = state.companies.find(c => c.id === companyId)
    if (!company) return 'Firma nicht gefunden.'
    if (company.listed) return 'Diese Firma ist bereits börsennotiert.'

    // Bedingungen prüfen
    const age = state.turn - company.founded
    if (age < 12) return `Zu jung. Die Firma muss mindestens 12 Monate bestehen (aktuell: ${age} Monate).`
    if (company.revenue <= company.expenses) return 'Die Firma muss monatlich profitabel sein.'
    if (company.employees.length < 5) return `Mindestens 5 Mitarbeiter erforderlich (aktuell: ${company.employees.length}).`
    if (company.revenue < 8000) return `Mindestumsatz 8.000 ℛℳ/Monat erforderlich (aktuell: ${Math.round(company.revenue).toLocaleString('de-DE')} ℛℳ).`

    // Kosten: Fixgebühr 40.000 + 3 % des Firmenwertes (revenue × 10)
    const firmenwert = company.revenue * 10
    const ipoKosten = 40000 + Math.round(firmenwert * 0.03)
    if (state.capital < ipoKosten) return `Nicht genug Kapital. Börsengang kostet: ${ipoKosten.toLocaleString('de-DE')} ℛℳ`

    // Emissionserlös: revenue × 8
    const emissionserloes = Math.round(company.revenue * 8)

    // Initial-Aktienpreis: vereinfacht revenue / 100
    const initialSharePrice = Math.round(company.revenue / 10)

    set({
      capital: state.capital - ipoKosten + emissionserloes,
      companies: state.companies.map(c =>
        c.id !== companyId
          ? c
          : { ...c, listed: true, sharePrice: initialSharePrice }
      ),
    })
    return null
  },

  proposeCooperation: (rivalId, branch) => {
    const state = get()
    const rival = state.rivals.find(r => r.id === rivalId)
    if (!rival || rival.eliminated) return 'Rivale nicht verfügbar.'
    const template = RIVAL_TEMPLATES.find(t => t.id === rival.templateId)
    if (!template) return 'Rivale unbekannt.'

    const COST = 15000
    if (state.capital < COST) return `Kooperationsangebot kostet ${COST.toLocaleString('de-DE')} ℛℳ.`
    if (state.activeCooperations.some(c => c.rivalId === rivalId)) return 'Mit diesem Rivalen läuft bereits eine Kooperation.'

    const acceptChance = 1 - template.aggressionLevel * 0.6
    if (Math.random() > acceptChance) return `${rival.name} lehnt das Angebot ab.`

    set({
      capital: state.capital - COST,
      activeCooperations: [...state.activeCooperations, { rivalId, rivalName: rival.name, branch, turnsLeft: 12 }],
    })
    return null
  },
}))
