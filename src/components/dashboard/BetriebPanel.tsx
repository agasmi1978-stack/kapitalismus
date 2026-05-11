import { useState } from 'react'
import { useGameStore, computeManagerEfficiency, calcTransferInfo, type Employee, type EmployeeLevel } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'
import { CITIES, type City } from '../../data/cities'

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

function formatMoney(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K ℛℳ`
  return `${n} ℛℳ`
}

// ---------------------------------------------------------------------------
// Transfer-Modal
// ---------------------------------------------------------------------------

interface TransferTarget {
  companyId: string
  companyName: string
  cityId: string
  cityName: string
  propertyId: string
  propertyName: string
  freeSlots: number
  cost: number
  newProductivity: number
}

function TransferModal({
  employee,
  fromCompanyId,
  onClose,
}: {
  employee: Employee
  fromCompanyId: string
  onClose: () => void
}) {
  const { companies, capital, transferEmployee } = useGameStore()
  const { addToast } = useToastStore()
  const [selected, setSelected] = useState<string>('')  // "companyId::propertyId"

  const fromCompany = companies.find(c => c.id === fromCompanyId)!
  const fromCity = CITIES.find(c => c.id === fromCompany.cityId)

  // Alle erreichbaren Standorte (außer dem aktuellen)
  const targets: TransferTarget[] = []
  companies.forEach(company => {
    const city = CITIES.find(c => c.id === company.cityId)
    company.properties.forEach(prop => {
      if (prop.id === employee.propertyId && company.id === fromCompanyId) return
      const freeSlots = prop.employeeSlots - company.employees.filter(e => e.propertyId === prop.id).length
      if (freeSlots <= 0) return
      const { cost, newProductivity } = calcTransferInfo(fromCompany.cityId, company.cityId)
      targets.push({
        companyId: company.id,
        companyName: company.name,
        cityId: company.cityId,
        cityName: city?.name ?? company.cityId,
        propertyId: prop.id,
        propertyName: prop.name,
        freeSlots,
        cost,
        newProductivity,
      })
    })
  })

  const selectedTarget = targets.find(t => `${t.companyId}::${t.propertyId}` === selected)

  const handleTransfer = () => {
    if (!selectedTarget) return
    const err = transferEmployee(fromCompanyId, employee.id, selectedTarget.companyId, selectedTarget.propertyId)
    if (err) { addToast(err, 'error'); return }
    const prodHint = selectedTarget.newProductivity < employee.productivity
      ? ` Produktivität sinkt auf ${selectedTarget.newProductivity}%.`
      : ''
    addToast(`Versetzt nach ${selectedTarget.propertyName}.${prodHint}`, 'success')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-stone-900 border border-stone-600 w-full max-w-sm mx-4 shadow-2xl">
        <div className="px-5 py-4 border-b border-stone-700 flex justify-between items-center">
          <div>
            <p className="text-amber-100 font-semibold text-sm">Mitarbeiter versetzen</p>
            <p className="text-stone-500 text-xs mt-0.5">
              {LEVEL_LABELS[employee.level]} · Produktivität {Math.round(employee.productivity)}%
            </p>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 text-xl">×</button>
        </div>

        <div className="p-5 space-y-4">
          {targets.length === 0 ? (
            <p className="text-sm text-stone-500 text-center py-2">
              Keine freien Standorte verfügbar.
            </p>
          ) : (
            <>
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-widest mb-2">Zielstandort wählen</p>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {targets.map(t => {
                    const key = `${t.companyId}::${t.propertyId}`
                    const sameFirm = t.companyId === fromCompanyId
                    const sameCity = t.cityId === fromCompany.cityId
                    return (
                      <button
                        key={key}
                        onClick={() => setSelected(key)}
                        className={`w-full text-left px-3 py-2.5 border text-xs transition-colors ${
                          selected === key
                            ? 'border-amber-600 bg-amber-900/20'
                            : 'border-stone-700 bg-stone-800 hover:border-stone-500'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-stone-200 font-semibold">{t.propertyName}</span>
                            <span className="text-stone-500 ml-1.5">
                              {sameFirm ? '' : `· ${t.companyName}`}
                            </span>
                            <p className="text-stone-500 mt-0.5">
                              {sameCity ? 'gleiche Stadt' : t.cityName} · {t.freeSlots} Platz{t.freeSlots !== 1 ? 'e' : ''} frei
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-amber-400 font-mono font-bold">{formatMoney(t.cost)}</p>
                            {t.newProductivity < Math.round(employee.productivity) && (
                              <p className="text-orange-400 text-xs">Prod. → {t.newProductivity}%</p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedTarget && (
                <div className="bg-stone-800 border border-stone-700 p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Transferkosten</span>
                    <span className={`font-mono font-bold ${capital >= selectedTarget.cost ? 'text-amber-300' : 'text-red-400'}`}>
                      {formatMoney(selectedTarget.cost)}
                    </span>
                  </div>
                  {selectedTarget.newProductivity < Math.round(employee.productivity) && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Produktivität nach Versetzung</span>
                      <span className="text-orange-400 font-mono">{selectedTarget.newProductivity}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-500">Kapital nach Transfer</span>
                    <span className={`font-mono ${capital - selectedTarget.cost >= 0 ? 'text-stone-300' : 'text-red-400'}`}>
                      {(capital - selectedTarget.cost).toLocaleString('de-DE')} ℛℳ
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleTransfer}
                  disabled={!selectedTarget || capital < (selectedTarget?.cost ?? 0)}
                  className="flex-1 py-2 text-xs bg-amber-700 hover:bg-amber-600 text-amber-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Versetzen →
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs border border-stone-700 text-stone-400 hover:text-stone-200"
                >
                  Abbrechen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BetriebPanel
// ---------------------------------------------------------------------------

export default function BetriebPanel({ companyId }: { companyId: string }) {
  const { companies, assignEmployee, unassignEmployee } = useGameStore()
  const { addToast } = useToastStore()
  const [transferTarget, setTransferTarget] = useState<Employee | null>(null)

  const company = companies.find(c => c.id === companyId)
  if (!company) return null

  const unassigned = company.employees.filter(e => !e.propertyId)
  const totalEmployees = company.employees.length
  const activeEmployees = company.employees.filter(e => e.propertyId).length

  const handleAssign = (employeeId: string, propertyId: string) => {
    const err = assignEmployee(companyId, employeeId, propertyId)
    if (err) addToast(err, 'error')
  }

  const handleUnassign = (employeeId: string) => {
    unassignEmployee(companyId, employeeId)
    addToast('Mitarbeiter in den Pool zurückgezogen.', 'info')
  }

  const freeSlots = (propertyId: string) => {
    const prop = company.properties.find(p => p.id === propertyId)
    if (!prop) return 0
    const used = company.employees.filter(e => e.propertyId === propertyId).length
    return prop.employeeSlots - used
  }

  return (
    <div className="space-y-5">

      {/* Transfer-Modal */}
      {transferTarget && (
        <TransferModal
          employee={transferTarget}
          fromCompanyId={companyId}
          onClose={() => setTransferTarget(null)}
        />
      )}

      {/* Kopfzeile */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-500">
          <span className="text-green-400 font-mono font-bold">{activeEmployees}</span>
          <span className="text-stone-600"> / {totalEmployees} Mitarbeiter aktiv</span>
        </p>
        {unassigned.length > 0 && (
          <span className="text-xs text-amber-500">⚠ {unassigned.length} im Pool — kein Umsatz</span>
        )}
      </div>

      {/* Unzugewiesener Pool */}
      {unassigned.length > 0 && (
        <div className="border border-amber-900/50 bg-amber-950/20 p-4 space-y-2">
          <p className="text-xs text-amber-600 uppercase tracking-widest">Unzugewiesen — generieren keinen Umsatz</p>
          {unassigned.map(emp => (
            <div key={emp.id} className="flex items-center justify-between gap-2 bg-stone-800/50 px-3 py-2">
              <div>
                <span className={`text-xs font-bold ${LEVEL_COLOR[emp.level]}`}>{LEVEL_LABELS[emp.level]}</span>
                <span className="text-stone-500 text-xs ml-2">Prod. {Math.round(emp.productivity)}%</span>
              </div>
              <div className="flex items-center gap-2">
                {company.properties.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={e => e.target.value && handleAssign(emp.id, e.target.value)}
                    className="bg-stone-700 border border-stone-600 text-stone-300 text-xs px-2 py-1 focus:outline-none focus:border-amber-600"
                  >
                    <option value="">→ Zuweisen</option>
                    {company.properties.filter(p => freeSlots(p.id) > 0).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({freeSlots(p.id)} frei)
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => setTransferTarget(emp)}
                  className="text-xs px-2 py-1 border border-stone-600 text-stone-400 hover:text-amber-300 hover:border-amber-700 transition-colors whitespace-nowrap"
                >
                  ↗ Versetzen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Standorte */}
      {company.properties.length === 0 ? (
        <p className="text-sm text-stone-600 text-center py-4">Keine Immobilien vorhanden.</p>
      ) : (
        company.properties.map(prop => {
          const assigned = company.employees.filter(e => e.propertyId === prop.id)
          const used = assigned.length
          const managerEff = prop.managerId ? computeManagerEfficiency(company, prop.managerId) : null

          return (
            <div key={prop.id} className="border border-stone-700 bg-stone-800/60">
              {/* Standort-Header */}
              <div className="px-4 py-3 border-b border-stone-700/60 flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-100 font-semibold">{prop.name}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {CITIES.find(c => c.id === prop.cityId)?.name ?? prop.cityId}
                    {' · '}{used}/{prop.employeeSlots} Plätze
                    {prop.managerId
                      ? ` · Leiter Eff. ${managerEff}%`
                      : ' · Kein Leiter'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Kapazitätsbalken */}
                  <div className="w-16 h-1.5 bg-stone-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${used / prop.employeeSlots > 0.9 ? 'bg-red-500' : used / prop.employeeSlots > 0.6 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${prop.employeeSlots > 0 ? (used / prop.employeeSlots) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Mitarbeiter */}
              <div className="p-3 space-y-1.5">
                {assigned.length === 0 ? (
                  <p className="text-xs text-stone-600 italic px-1 py-1">Keine Mitarbeiter zugewiesen.</p>
                ) : (
                  assigned.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-stone-700/30 rounded">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-bold shrink-0 ${LEVEL_COLOR[emp.level]}`}>{LEVEL_LABELS[emp.level]}</span>
                        <div className="w-14 h-1 bg-stone-700 rounded-full overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full ${emp.productivity >= 90 ? 'bg-green-500' : emp.productivity >= 70 ? 'bg-amber-500' : 'bg-orange-600'}`}
                            style={{ width: `${emp.productivity}%` }}
                          />
                        </div>
                        <span className="text-stone-500 text-xs">{Math.round(emp.productivity)}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleUnassign(emp.id)}
                          className="text-xs px-2 py-0.5 border border-stone-700 text-stone-500 hover:text-stone-200 hover:border-stone-500 transition-colors"
                          title="Abziehen (kostenlos, zurück in Pool)"
                        >
                          ← Abziehen
                        </button>
                        <button
                          onClick={() => setTransferTarget(emp)}
                          className="text-xs px-2 py-0.5 border border-stone-700 text-stone-500 hover:text-amber-300 hover:border-amber-700 transition-colors"
                          title="Zu anderem Standort versetzen"
                        >
                          ↗ Versetzen
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* Aus Pool zuweisen */}
                {unassigned.length > 0 && freeSlots(prop.id) > 0 && (
                  <div className="pt-1 border-t border-stone-700/40">
                    <select
                      defaultValue=""
                      onChange={e => e.target.value && handleAssign(e.target.value, prop.id)}
                      className="w-full bg-stone-700/60 border border-stone-600 text-stone-400 text-xs px-2 py-1.5 focus:outline-none focus:border-amber-600"
                    >
                      <option value="">+ Aus Pool zuweisen …</option>
                      {unassigned.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {LEVEL_LABELS[emp.level]} · Prod. {Math.round(emp.productivity)}%
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
