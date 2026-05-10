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

const SALARY_DEFAULT: Record<EmployeeLevel, number> = {
  arbeiter: 300,
  fachkraft: 600,
  manager: 1200,
}

const REVENUE_PER_EMPLOYEE: Record<EmployeeLevel, number> = {
  arbeiter: 450,
  fachkraft: 900,
  manager: 1600,
}

const TRAINING_COST: Record<EmployeeLevel, number> = {
  arbeiter: 2000,
  fachkraft: 2500,
  manager: 0,
}

let _employeeCounter = 0
function newEmployeeId() { return `emp-${++_employeeCounter}` }

export type EmployeeLevel = 'arbeiter' | 'fachkraft' | 'manager'
export type InvestmentGoodType = 'maschine' | 'fahrzeug' | 'gebaeude' | 'lager'
export type GamePhase = 'menu' | 'setup' | 'playing' | 'gameover' | 'victory'
export type VictoryCondition = 'vermoegen' | 'marktfuehrer' | 'expansion' | 'endlos'

export interface Employee {
  id: string
  level: EmployeeLevel
  salary: number
  morale: number
  skill: number
}

export interface InvestmentGood {
  id: string
  type: InvestmentGoodType
  name: string
  cost: number
  capacityBonus: number
}

export interface Company {
  id: string
  name: string
  branch: Branch
  cityId: string
  revenue: number
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
}

const STARTING_CAPITAL = 30000

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
      achievedMilestones: ['erbe'],
      marketPrices: initMarketPrices(),
      insolvencyTurns: 0,
      gameOverReason: null,
    })
  },

  endTurn: () => {
    const state = get()
    let { capital, month, year, turn, marketPrices } = state

    // 1. Weltereignis würfeln
    let newEvent = generateEvent(year)
    const branchEffect = newEvent?.branchEffect ?? {}

    // 2. Marktpreise aktualisieren
    const newMarketPrices = updateMarketPrices(marketPrices, branchEffect)

    // 3. Kooperationen aktualisieren (Laufzeit reduzieren)
    const updatedCooperations = state.activeCooperations
      .map(c => ({ ...c, turnsLeft: c.turnsLeft - 1 }))
      .filter(c => c.turnsLeft > 0)

    // Kooperations-Bonus auf Marktpreise aufaddieren
    const cooperationBonus: Partial<Record<Branch, number>> = {}
    updatedCooperations.forEach(coop => {
      cooperationBonus[coop.branch] = (cooperationBonus[coop.branch] ?? 0) + 0.12
    })

    // 4. Unternehmensgewinne berechnen (Marktpreise + Synergien + Kooperation + Entscheidungsboni)
    const synergies = computeSynergies(state.companies)
    const combinedBonus: Partial<Record<Branch, number>> = { ...state.branchBonusOverrides }
    Object.entries(cooperationBonus).forEach(([b, v]) => {
      combinedBonus[b as Branch] = (combinedBonus[b as Branch] ?? 0) + v
    })

    let income = 0
    state.companies.forEach((c) => {
      const marketRevenue = applyMarketToRevenue(c.revenue, c.branch, newMarketPrices)
      const synergyRevenue = applySynergiesToRevenue(marketRevenue, c.branch, synergies)
      const decisionBonus = 1 + (combinedBonus[c.branch] ?? 0)
      income += synergyRevenue * decisionBonus - c.expenses
    })
    capital += income

    // 4. Moral-Drift: niedrige Gehälter senken Moral, hohe heben sie
    const updatedCompanies = state.companies.map(c => ({
      ...c,
      employees: c.employees.map(e => {
        const fairSalary = e.level === 'manager' ? 1200 : e.level === 'fachkraft' ? 600 : 300
        const moraleDrift = e.salary >= fairSalary ? 2 : -3
        return { ...e, morale: Math.max(0, Math.min(100, e.morale + moraleDrift)) }
      }),
    }))

    // 5. Streiks verarbeiten
    updatedCompanies.forEach(c => {
      const strikers = c.employees.filter(e => e.morale < 40)
      if (strikers.length > 0) {
        const lostRevenue = strikers.length * 200
        income -= lostRevenue
        capital -= lostRevenue
      }
    })

    // 6. KI-Rivalen aktualisieren
    const playerNetWorth = capital + state.companies.reduce((s, c) => s + c.revenue * 12, 0)
    const { updatedRivals, events: rivalEvents } = updateRivals(state.rivals, newMarketPrices, playerNetWorth)

    // 7. News-Queue aufbauen
    const newQueue: NewsEvent[] = [...state.newsQueue]
    if (newEvent) {
      const newsItem = templateToNewsEvent(newEvent, year, month)
      newQueue.push(newsItem)
    }
    rivalEvents.forEach(e => {
      const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
      newQueue.push({ ...e, date: `${MONTHS[month - 1]} ${year}` })
    })

    // Marktpreiseffekte auch auf Rivalen anwenden (via rivalEvents bereits)

    // 8. Steuern (15% auf positiven Gewinn)
    const grossProfit = income
    if (grossProfit > 0) {
      const tax = Math.round(grossProfit * 0.15)
      capital -= tax
    }

    // 9. Kreditzinsen (5% p.a. = ~0.417% pro Monat)
    const { debt } = state
    if (debt > 0) {
      const interest = Math.round(debt * 0.00417)
      capital -= interest
    }

    // 10. Meilensteine prüfen
    const newMilestones = [...state.achievedMilestones]
    const netWorth = capital + updatedCompanies.reduce((s, c) => s + c.revenue * 12, 0)
    const totalEmployees = updatedCompanies.reduce((s, c) => s + c.employees.length, 0)
    const uniqueBranches = new Set(updatedCompanies.map(c => c.branch)).size
    const uniqueCities = new Set(updatedCompanies.map(c => c.cityId)).size
    const uniqueCountries = new Set(updatedCompanies.map(c => CITIES.find(ci => ci.id === c.cityId)?.country)).size

    const milestoneChecks: Array<{ id: string; met: boolean }> = [
      { id: 'erste_erweiterung', met: updatedCompanies.length >= 2 },
      { id: 'erste_stadt', met: uniqueCities >= 2 },
      { id: 'erste_million', met: netWorth >= 1_000_000 },
      { id: 'alle_branchen', met: uniqueBranches >= 5 },
      { id: 'drei_laender', met: uniqueCountries >= 3 },
      { id: 'zehn_millionen', met: netWorth >= 10_000_000 },
      { id: 'fuenf_staedte', met: uniqueCities >= 5 },
      { id: 'grosser_arbeitgeber', met: totalEmployees >= 500 },
      { id: 'hundert_millionen', met: netWorth >= 100_000_000 },
    ]
    const milestoneNews: NewsEvent[] = []
    const MONTHS2 = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

    milestoneChecks.forEach(({ id, met }) => {
      if (met && !newMilestones.includes(id)) {
        newMilestones.push(id)
        const ms = MILESTONES.find(m => m.id === id)
        if (ms) {
          milestoneNews.push({
            id: `milestone-${id}`,
            headline: ms.title,
            body: ms.storyText,
            date: `${MONTHS2[month - 1]} ${year}`,
            type: 'meilenstein',
          })
        }
      }
    })
    newQueue.push(...milestoneNews)

    // 11b. Entscheidung auslösen wenn neuer Meilenstein mit Decision verknüpft
    let pendingDecision: Decision | null = state.pendingDecision
    const newlyAchieved = newMilestones.filter(id => !state.achievedMilestones.includes(id))
    if (!pendingDecision) {
      for (const milestoneId of newlyAchieved) {
        const decision = DECISIONS.find(
          d => d.milestoneId === milestoneId && !state.decisionsMade.includes(d.id)
        )
        if (decision) { pendingDecision = decision; break }
      }
    }

    // 11. Zeit vorrücken
    month += 1
    if (month > 12) { month = 1; year += 1 }

    // 12. Victory prüfen
    if (state.victoryCondition !== 'endlos') {
      let victoryMet = false
      const uniqueCitiesV = new Set(updatedCompanies.map(c => c.cityId)).size
      const uniqueBranchesV = new Set(updatedCompanies.map(c => c.branch)).size

      if (state.victoryCondition === 'vermoegen' && netWorth >= 5_000_000) victoryMet = true
      if (state.victoryCondition === 'expansion' && uniqueCitiesV >= 8) victoryMet = true
      if (state.victoryCondition === 'marktfuehrer' && uniqueBranchesV >= 4 && updatedCompanies.length >= 6) victoryMet = true

      if (victoryMet) {
        newQueue.push({
          id: 'victory-news',
          headline: 'Sieg! Das Imperium ist vollbracht.',
          body: `${state.playerName} hat das gesteckte Ziel erreicht. Europa kennt keinen größeren Namen mehr in der Wirtschaft.`,
          date: `${MONTHS2[month - 1]} ${year}`,
          type: 'meilenstein',
        })
        const nextNews2 = newQueue[0] ?? null
        const remainingQueue2 = newQueue.slice(1)
        set({ phase: 'victory', currentNews: nextNews2, newsQueue: remainingQueue2 })
        return
      }

      // KI-Sieg prüfen
      if (state.aiVictoryEnabled) {
        const topRival = updatedRivals.filter(r => !r.eliminated).sort((a, b) => b.netWorth - a.netWorth)[0]
        if (topRival) {
          let rivalWon = false
          if (state.victoryCondition === 'vermoegen' && topRival.netWorth >= 5_000_000) rivalWon = true
          if (state.victoryCondition === 'expansion' && topRival.cities.length >= 8) rivalWon = true
          if (rivalWon) {
            newQueue.push({
              id: 'rival-victory',
              headline: `${topRival.name} hat gewonnen!`,
              body: `${topRival.name} hat das Spielziel als Erster erreicht. Dein Imperium bleibt unvollendet.`,
              date: `${MONTHS2[month - 1]} ${year}`,
              type: 'rival',
            })
            set({ phase: 'gameover', gameOverReason: `${topRival.name} hat das Ziel vor dir erreicht.`, currentNews: newQueue[0] ?? null, newsQueue: newQueue.slice(1) })
            return
          }
        }
      }
    }

    // 13. Insolvenz prüfen
    let { insolvencyTurns } = state
    let newPhase: GamePhase = state.phase
    let gameOverReason: string | null = state.gameOverReason

    if (capital < -10000) {
      insolvencyTurns += 1
      if (insolvencyTurns >= 3) {
        newPhase = 'gameover'
        gameOverReason = 'Insolvenz — dein Kapital war drei Monate in Folge tief im Minus. Die Gläubiger haben übernommen.'
      }
    } else {
      insolvencyTurns = 0
    }

    const nextNews = newQueue[0] ?? null
    const remainingQueue = newQueue.slice(1)

    set({
      capital,
      month,
      year,
      turn: turn + 1,
      companies: updatedCompanies,
      rivals: updatedRivals,
      marketPrices: newMarketPrices,
      currentNews: nextNews,
      newsQueue: remainingQueue,
      achievedMilestones: newMilestones,
      insolvencyTurns,
      phase: newPhase,
      gameOverReason,
      pendingDecision,
      activeCooperations: updatedCooperations,
    })
  },

  dismissNews: () => {
    const state = get()
    const nextNews = state.newsQueue[0] ?? null
    const remainingQueue = state.newsQueue.slice(1)
    set({ currentNews: nextNews, newsQueue: remainingQueue })
  },

  saveGame: () => {
    const state = get()
    const saveData = {
      phase: state.phase,
      turn: state.turn,
      year: state.year,
      month: state.month,
      playerName: state.playerName,
      startCityId: state.startCityId,
      startBranch: state.startBranch,
      capital: state.capital,
      debt: state.debt,
      companies: state.companies,
      unlockedCities: state.unlockedCities,
      rivals: state.rivals,
      achievedMilestones: state.achievedMilestones,
      victoryCondition: state.victoryCondition,
      aiVictoryEnabled: state.aiVictoryEnabled,
    }
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kapitalismus_${state.playerName}_${state.year}-${String(state.month).padStart(2, '0')}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  loadGame: (data: unknown) => {
    const d = data as Partial<GameState>
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
      companies: d.companies ?? [],
      unlockedCities: d.unlockedCities ?? [],
      rivals: d.rivals ?? [],
      achievedMilestones: d.achievedMilestones ?? [],
      victoryCondition: d.victoryCondition ?? 'endlos',
      aiVictoryEnabled: d.aiVictoryEnabled ?? false,
      currentNews: null,
      newsQueue: [],
    })
  },

  hireEmployee: (companyId, level) => {
    const state = get()
    const company = state.companies.find(c => c.id === companyId)
    if (!company) return 'Firma nicht gefunden.'

    // Arbeitsmarkt: Fachkräfte/Manager sind begrenzt verfügbar (einfache Simulation)
    const totalOfLevel = state.companies.flatMap(c => c.employees).filter(e => e.level === level).length
    const marketLimit = level === 'manager' ? 5 : level === 'fachkraft' ? 20 : 999
    if (totalOfLevel >= marketLimit) return `Keine ${level === 'manager' ? 'Manager' : 'Fachkräfte'} am Markt verfügbar.`

    const salary = SALARY_DEFAULT[level]
    const employee: Employee = {
      id: newEmployeeId(),
      level,
      salary,
      morale: 70,
      skill: level === 'manager' ? 80 : level === 'fachkraft' ? 60 : 40,
    }

    set({
      companies: state.companies.map(c =>
        c.id !== companyId ? c : {
          ...c,
          employees: [...c.employees, employee],
          expenses: c.expenses + salary,
          revenue: c.revenue + REVENUE_PER_EMPLOYEE[level],
        }
      ),
    })
    return null
  },

  fireEmployee: (companyId, employeeId) => {
    const state = get()
    set({
      companies: state.companies.map(c => {
        if (c.id !== companyId) return c
        const emp = c.employees.find(e => e.id === employeeId)
        if (!emp) return c
        return {
          ...c,
          employees: c.employees.filter(e => e.id !== employeeId),
          expenses: c.expenses - emp.salary,
          revenue: c.revenue - REVENUE_PER_EMPLOYEE[emp.level],
        }
      }),
    })
  },

  trainEmployee: (companyId, employeeId) => {
    const state = get()
    const company = state.companies.find(c => c.id === companyId)
    const emp = company?.employees.find(e => e.id === employeeId)
    if (!emp) return 'Mitarbeiter nicht gefunden.'
    if (emp.level === 'manager') return 'Manager können nicht weiter geschult werden.'

    const cost = TRAINING_COST[emp.level]
    if (state.capital < cost) return `Nicht genug Kapital. Kosten: ${cost.toLocaleString('de-DE')} ℛℳ`

    const nextLevel: EmployeeLevel = emp.level === 'arbeiter' ? 'fachkraft' : 'manager'
    const salaryDiff = SALARY_DEFAULT[nextLevel] - emp.salary
    const revenueDiff = REVENUE_PER_EMPLOYEE[nextLevel] - REVENUE_PER_EMPLOYEE[emp.level]

    set({
      capital: state.capital - cost,
      companies: state.companies.map(c =>
        c.id !== companyId ? c : {
          ...c,
          expenses: c.expenses + salaryDiff,
          revenue: c.revenue + revenueDiff,
          employees: c.employees.map(e =>
            e.id !== employeeId ? e : {
              ...e,
              level: nextLevel,
              salary: SALARY_DEFAULT[nextLevel],
              skill: Math.min(100, e.skill + 20),
              morale: Math.min(100, e.morale + 10),
            }
          ),
        }
      ),
    })
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
        return {
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
      }),
    })
  },

  foundCompany: (name, branch, cityId) => {
    const state = get()
    const FOUND_COST = 10000
    if (state.capital < FOUND_COST) return `Nicht genug Kapital. Kosten: ${FOUND_COST.toLocaleString('de-DE')} ℛℳ`
    if (!state.unlockedCities.includes(cityId)) return 'Diese Stadt ist noch nicht erschlossen.'
    const company: Company = {
      id: newCompanyId(),
      name,
      branch,
      cityId,
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
    if (state.debt + amount > MAX_DEBT) return `Kreditlimit überschritten. Maximale Verschuldung: ${MAX_DEBT.toLocaleString('de-DE')} ℛℳ`
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

  buyInvestmentGood: (companyId, templateId) => {
    const state = get()
    const template = INVESTMENT_GOOD_TEMPLATES.find(t => t.id === templateId)
    if (!template) return 'Investitionsgut nicht gefunden.'

    const company = state.companies.find(c => c.id === companyId)
    if (!company) return 'Firma nicht gefunden.'

    if (!template.applicableBranches.includes(company.branch))
      return 'Dieses Gut passt nicht zur Branche dieser Firma.'

    if (state.capital < template.cost)
      return `Nicht genug Kapital. Kosten: ${template.cost.toLocaleString('de-DE')} ℛℳ`

    const alreadyOwned = company.investmentGoods.some(g => g.id === templateId)
    if (alreadyOwned) return 'Dieses Investitionsgut besitzt diese Firma bereits.'

    const good: InvestmentGood = {
      id: templateId,
      type: template.type,
      name: template.name,
      cost: template.cost,
      capacityBonus: template.revenueBonus,
    }

    set({
      capital: state.capital - template.cost,
      companies: state.companies.map(c =>
        c.id !== companyId ? c : {
          ...c,
          investmentGoods: [...c.investmentGoods, good],
          revenue: c.revenue + template.revenueBonus,
        }
      ),
    })
    return null
  },

  sellCompany: (companyId) => {
    const state = get()
    if (state.companies.length <= 1) return 'Du kannst deine letzte Firma nicht verkaufen.'
    const company = state.companies.find(c => c.id === companyId)
    if (!company) return 'Firma nicht gefunden.'
    const salePrice = Math.round(company.revenue * 10 * 0.8)
    set({
      capital: state.capital + salePrice,
      companies: state.companies.filter(c => c.id !== companyId),
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
      const updatedCompanies = state.companies.map(c => ({
        ...c,
        employees: c.employees.map(e => ({
          ...e,
          morale: Math.max(0, Math.min(100, e.morale + (option.effect.moraleDelta ?? 0))),
        })),
      }))
      set({ companies: updatedCompanies })
    }

    set({
      capital,
      debt,
      branchBonusOverrides: newBonuses,
      pendingDecision: null,
      decisionsMade: [...state.decisionsMade, decisionId],
    })
  },

  proposeCooperation: (rivalId, branch) => {
    const state = get()
    const rival = state.rivals.find(r => r.id === rivalId)
    if (!rival || rival.eliminated) return 'Rivale nicht verfügbar.'
    const template = RIVAL_TEMPLATES.find(t => t.id === rival.templateId)
    if (!template) return 'Rivale unbekannt.'

    const COST = 15000
    if (state.capital < COST) return `Kooperationsangebot kostet ${COST.toLocaleString('de-DE')} ℛℳ.`

    // Aggressiver Rivale lehnt öfter ab
    const acceptChance = 1 - template.aggressionLevel * 0.6
    if (Math.random() > acceptChance) return `${rival.name} lehnt das Angebot ab.`

    const alreadyActive = state.activeCooperations.some(c => c.rivalId === rivalId)
    if (alreadyActive) return 'Mit diesem Rivalen läuft bereits eine Kooperation.'

    set({
      capital: state.capital - COST,
      activeCooperations: [
        ...state.activeCooperations,
        { rivalId, rivalName: rival.name, branch, turnsLeft: 12 },
      ],
    })
    return null
  },

  buyRivalCompany: (rivalId) => {
    const state = get()
    const rival = state.rivals.find(r => r.id === rivalId)
    if (!rival || rival.eliminated) return 'Rivale nicht verfügbar.'
    if (rival.companies <= 0) return 'Dieser Rivale hat keine Firmen mehr.'
    const price = Math.round((rival.netWorth / Math.max(1, rival.companies)) * 1.5)
    if (state.capital < price) return `Nicht genug Kapital. Preis: ${price.toLocaleString('de-DE')} ℛℳ`

    const branches: Branch[] = ['handel', 'produktion', 'gastro', 'transport', 'bau']
    const acquiredBranch = branches[Math.floor(Math.random() * branches.length)]
    const cityId = rival.cities[0] ?? state.unlockedCities[0]

    const acquiredCompany: Company = {
      id: newCompanyId(),
      name: `${rival.name.split(' ')[1] ?? rival.name} Übernahme`,
      branch: acquiredBranch,
      cityId,
      revenue: Math.round(price / 15),
      expenses: Math.round(price / 25),
      employees: [],
      investmentGoods: [],
      listed: false,
      sharePrice: 100,
      founded: state.turn,
    }

    const updatedRival = rival.companies <= 1
      ? { ...rival, companies: 0, netWorth: rival.netWorth * 0.3, eliminated: true }
      : { ...rival, companies: rival.companies - 1, netWorth: rival.netWorth - price / 1.5 }

    set({
      capital: state.capital - price,
      companies: [...state.companies, acquiredCompany],
      rivals: state.rivals.map(r => r.id === rivalId ? updatedRival : r),
    })
    return null
  },
}))
