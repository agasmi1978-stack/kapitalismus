import { useState } from 'react'
import { useGameStore, type EmployeeLevel, type Employee } from '../../store/gameStore'

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

const HIRE_COST: Record<EmployeeLevel, number> = {
  arbeiter: 0,
  fachkraft: 0,
  manager: 0,
}

function MoraleBar({ morale }: { morale: number }) {
  const color = morale >= 60 ? 'bg-green-500' : morale >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="w-full h-1.5 bg-stone-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${morale}%` }} />
    </div>
  )
}

function EmployeeRow({ emp, companyId }: { emp: Employee; companyId: string }) {
  const { fireEmployee, trainEmployee, setSalary } = useGameStore()
  const [editSalary, setEditSalary] = useState(false)
  const [salaryInput, setSalaryInput] = useState(String(emp.salary))
  const [error, setError] = useState<string | null>(null)

  const handleTrain = () => {
    const err = trainEmployee(companyId, emp.id)
    setError(err)
    if (!err) setTimeout(() => setError(null), 3000)
  }

  const handleSalary = () => {
    const val = parseInt(salaryInput)
    if (isNaN(val) || val < 100) { setError('Mindestgehalt: 100 ℛℳ'); return }
    setSalary(companyId, emp.id, val)
    setEditSalary(false)
    setError(null)
  }

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

      <MoraleBar morale={emp.morale} />
      <p className="text-xs text-stone-600 mt-1 mb-2">
        Moral: {emp.morale}/100 {emp.morale < 40 ? '⚠ Streikgefahr' : ''}
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
          >
            Weiterbilden →
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}

export default function EmployeePanel({ companyId, branch }: { companyId: string; branch: string }) {
  const { companies, capital, hireEmployee } = useGameStore()
  const company = companies.find(c => c.id === companyId)
  const [error, setError] = useState<string | null>(null)

  if (!company) return null

  const handleHire = (level: EmployeeLevel) => {
    const err = hireEmployee(companyId, level)
    setError(err)
    if (!err) setTimeout(() => setError(null), 3000)
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
        <p className="text-xs text-stone-500 uppercase tracking-widest mb-2">Einstellen</p>
        <div className="flex gap-2">
          {(['arbeiter', 'fachkraft', 'manager'] as EmployeeLevel[]).map(level => (
            <button
              key={level}
              onClick={() => handleHire(level)}
              className="flex-1 py-2 text-xs border border-stone-700 hover:border-amber-600 text-stone-400 hover:text-amber-300 transition-colors"
            >
              + {LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      {/* Mitarbeiterliste */}
      {company.employees.length === 0 ? (
        <p className="text-sm text-stone-600 text-center py-4">Noch keine Mitarbeiter eingestellt.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {company.employees.map(emp => (
            <EmployeeRow key={emp.id} emp={emp} companyId={companyId} />
          ))}
        </div>
      )}
    </div>
  )
}
