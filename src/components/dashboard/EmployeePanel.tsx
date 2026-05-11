import { useState } from 'react'
import { useGameStore, type EmployeeLevel, type Employee, HIRING_COST, TRAINING_COST, REVENUE_PER_EMPLOYEE } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'

const LEVEL_LABELS: Record<EmployeeLevel, string> = {
  arbeiter: 'Arbeiter',
  fachkraft: 'Fachkraft',
  manager: 'Manager',
}

const LEVEL_COLOR: Record<EmployeeLevel, string> = {
  arbeiter: 'text-stone-400',
  fachkraft: 'text-blue-400',
  manager: 'text-amber-400',
}

function MoraleBar({ morale }: { morale: number }) {
  const color = morale >= 60 ? 'bg-green-500' : morale >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="w-full h-1.5 bg-stone-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${morale}%` }} />
    </div>
  )
}

function ProductivityBar({ productivity }: { productivity: number }) {
  const color = productivity >= 90 ? 'bg-green-500' : productivity >= 70 ? 'bg-amber-500' : 'bg-orange-600'
  return (
    <div className="w-full h-1.5 bg-stone-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${productivity}%` }} />
    </div>
  )
}

function EmployeeRow({ emp, companyId }: { emp: Employee; companyId: string }) {
  const { fireEmployee, trainEmployee, setSalary } = useGameStore()
  const { addToast } = useToastStore()
  const [editSalary, setEditSalary] = useState(false)
  const [salaryInput, setSalaryInput] = useState(String(emp.salary))

  const handleTrain = () => {
    const err = trainEmployee(companyId, emp.id)
    if (err) addToast(err, 'error')
    else addToast('Weiterbildung abgeschlossen!', 'success')
  }

  const handleSalary = () => {
    const val = parseInt(salaryInput)
    if (isNaN(val) || val < 100) { addToast('Mindestgehalt: 100 ℛℳ', 'error'); return }
    setSalary(companyId, emp.id, val)
    setEditSalary(false)
  }

  const currentRevenue = Math.round(REVENUE_PER_EMPLOYEE[emp.level] * (emp.productivity / 100))
  const trainingCost = TRAINING_COST[emp.level]

  return (
    <div className="bg-stone-800 border border-stone-700 p-3 rounded">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${LEVEL_COLOR[emp.level]}`}>
            {LEVEL_LABELS[emp.level]}
          </span>
          <span className="text-xs text-stone-500">· Qualifikation {emp.skill}/100</span>
        </div>
        <button
          onClick={() => fireEmployee(companyId, emp.id)}
          className="text-xs text-red-600 hover:text-red-400 transition-colors px-2 py-0.5 border border-red-900 hover:border-red-700"
        >
          Entlassen
        </button>
      </div>

      {/* Moral */}
      <MoraleBar morale={emp.morale} />
      <p className="text-xs text-stone-600 mt-0.5 mb-1.5">
        Moral: {emp.morale}/100 {emp.morale < 40 ? '⚠ Streikgefahr' : ''}
      </p>

      {/* Produktivität */}
      <ProductivityBar productivity={emp.productivity} />
      <p className="text-xs text-stone-600 mt-0.5 mb-2">
        Produktivität: {Math.round(emp.productivity)} % · Ertrag: <span className="text-stone-400 font-mono">{currentRevenue.toLocaleString('de-DE')} ℛℳ/Mo</span>
        {emp.productivity < 100 && <span className="text-stone-600"> (wächst noch)</span>}
      </p>

      <div className="flex items-center justify-between gap-3">
        {editSalary ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              value={salaryInput}
              onChange={e => setSalaryInput(e.target.value)}
              className="w-24 bg-stone-900 border border-stone-600 text-stone-100 text-xs px-2 py-1 font-mono"
            />
            <span className="text-xs text-stone-500">ℛℳ/Monat</span>
            <button onClick={handleSalary} className="text-xs text-green-500 hover:text-green-300">✓</button>
            <button onClick={() => setEditSalary(false)} className="text-xs text-stone-500 hover:text-stone-300">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setEditSalary(true)}
            className="text-xs text-stone-400 hover:text-amber-300 transition-colors"
          >
            Gehalt: <span className="font-mono text-stone-300">{emp.salary.toLocaleString('de-DE')} ℛℳ/Mo</span>
          </button>
        )}

        {emp.level !== 'manager' && (
          <button
            onClick={handleTrain}
            className="text-xs px-2 py-0.5 border border-stone-600 hover:border-amber-600 text-stone-400 hover:text-amber-300 transition-colors whitespace-nowrap"
            title={`Weiterbildung: ${trainingCost.toLocaleString('de-DE')} ℛℳ`}
          >
            Weiterbilden ({(trainingCost / 1000).toFixed(0)}K ℛℳ) →
          </button>
        )}
      </div>
    </div>
  )
}

export default function EmployeePanel({ companyId }: { companyId: string }) {
  const { companies, laborMarketAvailability, hireEmployee } = useGameStore()
  const { addToast } = useToastStore()
  // Welcher Level wartet auf Standort-Auswahl?
  const [pendingLevel, setPendingLevel] = useState<EmployeeLevel | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')

  const company = companies.find(c => c.id === companyId)
  if (!company) return null

  const { assignedEmployeeCount } = (() => {
    const fn = (propId: string) => company.employees.filter(e => e.propertyId === propId).length
    return { assignedEmployeeCount: fn }
  })()

  const propertiesWithSlots = company.properties.filter(p => assignedEmployeeCount(p.id) < p.employeeSlots)

  const handleLevelClick = (level: EmployeeLevel) => {
    if (company.properties.length === 0) {
      addToast('Keine Immobilie vorhanden. Kaufe zuerst einen Standort.', 'error')
      return
    }
    setPendingLevel(level)
    setSelectedPropertyId(propertiesWithSlots[0]?.id ?? '')
  }

  const handleConfirmHire = () => {
    if (!pendingLevel || !selectedPropertyId) return
    const err = hireEmployee(companyId, pendingLevel, selectedPropertyId)
    if (err) addToast(err, 'error')
    else addToast(`${LEVEL_LABELS[pendingLevel]} eingestellt! Kosten: ${HIRING_COST[pendingLevel].toLocaleString('de-DE')} ℛℳ`, 'success')
    setPendingLevel(null)
    setSelectedPropertyId('')
  }

  const byLevel = (level: EmployeeLevel) => company.employees.filter(e => e.level === level)
  const atRisk = company.employees.filter(e => e.morale < 40).length

  return (
    <div className="space-y-4">
      {/* Übersicht */}
      <div className="grid grid-cols-3 gap-3">
        {(['arbeiter', 'fachkraft', 'manager'] as EmployeeLevel[]).map(level => (
          <div key={level} className="bg-stone-900 border border-stone-700 p-3 text-center">
            <div className={`text-2xl font-bold ${LEVEL_COLOR[level]}`}>{byLevel(level).length}</div>
            <div className="text-xs text-stone-500 uppercase tracking-wider mt-0.5">{LEVEL_LABELS[level]}</div>
          </div>
        ))}
      </div>

      {atRisk > 0 && (
        <div className="bg-red-950 border border-red-800 px-4 py-2 text-xs text-red-300">
          ⚠ {atRisk} Mitarbeiter mit kritisch niedriger Moral — Streikgefahr!
        </div>
      )}

      {/* Einstellen */}
      <div>
        <p className="text-xs text-stone-500 uppercase tracking-widest mb-2">Einstellen — Arbeitsmarkt diesen Monat</p>

        {/* Standort-Auswahl Dialog */}
        {pendingLevel && (
          <div className="bg-stone-800 border border-amber-700 p-3 mb-3 space-y-2">
            <p className="text-xs text-amber-300 font-semibold">
              {LEVEL_LABELS[pendingLevel]} einstellen — Standort wählen:
            </p>
            {propertiesWithSlots.length === 0 ? (
              <p className="text-xs text-red-400">Alle Standorte voll. Kaufe eine weitere Immobilie.</p>
            ) : (
              <select
                value={selectedPropertyId}
                onChange={e => setSelectedPropertyId(e.target.value)}
                className="w-full bg-stone-700 border border-stone-600 text-stone-200 text-xs px-2 py-1.5 focus:outline-none focus:border-amber-600"
              >
                {propertiesWithSlots.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({assignedEmployeeCount(p.id)}/{p.employeeSlots} Plätze)
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleConfirmHire}
                disabled={!selectedPropertyId || propertiesWithSlots.length === 0}
                className="px-3 py-1.5 text-xs bg-amber-700 hover:bg-amber-600 text-amber-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Einstellen ({HIRING_COST[pendingLevel].toLocaleString('de-DE')} ℛℳ)
              </button>
              <button
                onClick={() => setPendingLevel(null)}
                className="px-3 py-1.5 text-xs border border-stone-600 text-stone-400 hover:text-stone-200"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {(['arbeiter', 'fachkraft', 'manager'] as EmployeeLevel[]).map(level => {
            const available = laborMarketAvailability[level]
            return (
              <button
                key={level}
                onClick={() => available && handleLevelClick(level)}
                disabled={!available}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs border transition-colors ${
                  available
                    ? 'border-stone-700 hover:border-amber-600 text-stone-400 hover:text-amber-300'
                    : 'border-stone-800 text-stone-700 cursor-not-allowed'
                }`}
              >
                <span>
                  {available ? '+ ' : '✕ '}
                  {LEVEL_LABELS[level]}
                  {!available && ' (nicht verfügbar)'}
                </span>
                <span className="font-mono text-stone-500">
                  {HIRING_COST[level].toLocaleString('de-DE')} ℛℳ · max {REVENUE_PER_EMPLOYEE[level].toLocaleString('de-DE')} ℛℳ/Mo
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-stone-700 mt-1.5">
          Verfügbarkeit ändert sich jeden Monat. Produktivität startet bei 50 % und wächst über ~8 Monate auf 100 %.
        </p>
      </div>

      {/* Mitarbeiterliste */}
      {company.employees.length === 0 ? (
        <p className="text-sm text-stone-600 text-center py-4">Noch keine Mitarbeiter eingestellt.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {company.employees.map(emp => (
            <EmployeeRow key={emp.id} emp={emp} companyId={companyId} />
          ))}
        </div>
      )}
    </div>
  )
}
