import { useState } from 'react'
import { useGameStore, computeMachineEfficiency, type Machine } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'
import { MACHINE_TEMPLATES } from '../../data/machineTemplates'
import { CITIES } from '../../data/cities'

function formatMoney(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} Mio. ℛℳ`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K ℛℳ`
  return `${n.toFixed(0)} ℛℳ`
}

function EffBar({ pct }: { pct: number }) {
  const color = pct === 0 ? 'bg-red-600' : pct < 60 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-stone-700 h-1.5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-stone-300 w-8 text-right">{pct}%</span>
    </div>
  )
}

function TransferMachineModal({
  machine,
  companyId,
  onClose,
}: {
  machine: Machine
  companyId: string
  onClose: () => void
}) {
  const { companies, capital, transferMachine } = useGameStore()
  const { addToast } = useToastStore()
  const company = companies.find(c => c.id === companyId)
  if (!company) return null

  const otherProperties = company.properties.filter(p => p.id !== machine.propertyId)
  const currentProperty = company.properties.find(p => p.id === machine.propertyId)

  function usedME(propertyId: string) {
    return (company!.machines ?? [])
      .filter(m => m.propertyId === propertyId && m.id !== machine.id)
      .reduce((s, m) => s + m.machineSize, 0)
  }

  function calcCost(toPropertyId: string) {
    const toProperty = company!.properties.find(p => p.id === toPropertyId)
    const fromCityId = currentProperty?.cityId ?? company!.cityId
    const toCityId = toProperty?.cityId ?? company!.cityId
    if (fromCityId === toCityId) return 800
    const from = CITIES.find(c => c.id === fromCityId)
    const to = CITIES.find(c => c.id === toCityId)
    if (!from || !to) return 1500
    const dx = from.coordinates[0] - to.coordinates[0]
    const dy = from.coordinates[1] - to.coordinates[1]
    const dist = Math.sqrt(dx * dx + dy * dy)
    return Math.round(500 + dist * 350)
  }

  function handleTransfer(toPropertyId: string) {
    const err = transferMachine(companyId, machine.id, toPropertyId)
    if (err) {
      addToast(err, 'error')
    } else {
      addToast(`${machine.name} versetzt. Effizienz läuft in 2 Monaten auf 100 % hoch.`, 'success')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-md shadow-2xl">
        <div className="px-5 pt-5 pb-4 border-b border-stone-700">
          <h4 className="text-amber-100 font-bold text-sm">{machine.name} versetzen</h4>
          <p className="text-stone-500 text-xs mt-0.5">Nur firmeneigene Standorte. Alle Besetzungen werden gelöst.</p>
        </div>
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {otherProperties.length === 0 ? (
            <p className="text-stone-600 text-xs italic">Keine weiteren Standorte vorhanden.</p>
          ) : (
            otherProperties.map(prop => {
              const free = prop.machineSlots - usedME(prop.id)
              const fits = free >= machine.machineSize
              const cost = calcCost(prop.id)
              const canAfford = capital >= cost
              const cityName = CITIES.find(c => c.id === prop.cityId)?.name ?? prop.cityId
              return (
                <div
                  key={prop.id}
                  className={`border p-3 flex items-center justify-between gap-3 ${
                    fits && canAfford
                      ? 'border-stone-700 bg-stone-800'
                      : 'border-stone-800 bg-stone-900 opacity-50'
                  }`}
                >
                  <div>
                    <p className="text-stone-200 text-xs font-semibold">{prop.name}</p>
                    <p className="text-stone-500 text-xs">{cityName} · {free} ME frei</p>
                    <p className="text-amber-500 text-xs font-mono">{formatMoney(cost)} Transferkosten</p>
                  </div>
                  <button
                    onClick={() => handleTransfer(prop.id)}
                    disabled={!fits || !canAfford}
                    className={`shrink-0 px-3 py-1.5 text-xs border transition-colors ${
                      fits && canAfford
                        ? 'border-amber-700 text-amber-400 hover:bg-amber-900/30 cursor-pointer'
                        : 'border-stone-700 text-stone-600 cursor-not-allowed'
                    }`}
                  >
                    {!fits ? 'Kein Platz' : !canAfford ? 'Zu teuer' : 'Versetzen'}
                  </button>
                </div>
              )
            })
          )}
        </div>
        <div className="px-5 py-3 border-t border-stone-700">
          <button onClick={onClose} className="text-xs text-stone-500 hover:text-stone-300">
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}

function MachineCard({
  machine,
  companyId,
}: {
  machine: Machine
  companyId: string
}) {
  const { companies, turn, assignWorkerToMachine, removeWorkerFromMachine, assignMachineManager, removeMachineManager } = useGameStore()
  const { addToast } = useToastStore()
  const [showTransfer, setShowTransfer] = useState(false)
  const company = companies.find(c => c.id === companyId)
  if (!company) return null

  const eff = computeMachineEfficiency(machine, company, turn)
  const property = company.properties.find(p => p.id === machine.propertyId)
  const cityName = property ? (CITIES.find(c => c.id === property.cityId)?.name ?? property.cityId) : '—'

  // Mitarbeiter am selben Standort
  const atProperty = company.employees.filter(e => e.propertyId === machine.propertyId)
  const availableWorkers = atProperty.filter(e =>
    e.level === 'arbeiter' && !machine.assignedWorkerIds.includes(e.id)
  )
  const availableSpecialists = atProperty.filter(e =>
    e.level === 'fachkraft' && !machine.assignedSpecialistIds.includes(e.id)
  )
  const managers = company.employees.filter(e => e.level === 'manager')

  const assignedWorkers = company.employees.filter(e => machine.assignedWorkerIds.includes(e.id))
  const assignedSpecialists = company.employees.filter(e => machine.assignedSpecialistIds.includes(e.id))
  const currentManager = machine.managerId ? company.employees.find(e => e.id === machine.managerId) : null

  const monthsOwned = Math.max(0, turn - machine.purchasedAt)
  const maturity = Math.min(1.0, 0.2 + (monthsOwned / Math.max(1, machine.maturityTurns)) * 0.8)
  const currentBonus = Math.round(machine.maxBonus * maturity * (eff / 100))

  function handleAssignWorker(employeeId: string, isSpecialist: boolean) {
    if (!employeeId) return
    const err = assignWorkerToMachine(companyId, machine.id, employeeId)
    if (err) addToast(err, 'error')
  }

  function handleRemoveWorker(employeeId: string) {
    removeWorkerFromMachine(companyId, machine.id, employeeId)
  }

  function handleManager(managerId: string) {
    if (!managerId) {
      removeMachineManager(companyId, machine.id)
    } else {
      const err = assignMachineManager(companyId, machine.id, managerId)
      if (err) addToast(err, 'error')
    }
  }

  return (
    <>
      <div className="bg-stone-800 border border-stone-700 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-amber-100 text-sm font-semibold">{machine.name}</p>
            <p className="text-stone-500 text-xs mt-0.5">{property?.name ?? '—'} · {cityName}</p>
          </div>
          <div className="text-right">
            <p className="text-green-400 font-mono text-xs">+{formatMoney(currentBonus)}/Mo</p>
            <p className="text-stone-600 text-xs">max {formatMoney(machine.maxBonus)}</p>
          </div>
        </div>

        {/* Effizienz */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-stone-500">Effizienz</span>
            {machine.transferredAt !== null && turn - machine.transferredAt < 2 && (
              <span className="text-amber-600 text-xs">Einlaufphase</span>
            )}
          </div>
          <EffBar pct={eff} />
        </div>

        {/* Besetzung — Arbeiter */}
        <div className="space-y-1.5">
          <p className="text-xs text-stone-500">
            Arbeiter ({assignedWorkers.length}/{machine.minWorkers} mind.)
          </p>
          <div className="flex flex-wrap gap-1">
            {assignedWorkers.map(e => (
              <button
                key={e.id}
                onClick={() => handleRemoveWorker(e.id)}
                className="text-xs bg-stone-700 text-stone-300 px-2 py-0.5 hover:bg-red-900/40 hover:text-red-400 transition-colors"
                title="Abziehen"
              >
                Arb. #{e.id.slice(-3)} ×
              </button>
            ))}
            {availableWorkers.length > 0 && (
              <select
                defaultValue=""
                onChange={e => { handleAssignWorker(e.target.value, false); e.target.value = '' }}
                className="text-xs bg-stone-700 border border-stone-600 text-stone-400 px-1 py-0.5 focus:outline-none"
              >
                <option value="">+ Arbeiter</option>
                {availableWorkers.map(e => (
                  <option key={e.id} value={e.id}>Arb. #{e.id.slice(-3)}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Besetzung — Fachkräfte */}
        {machine.minSpecialists > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-stone-500">
              Fachkräfte ({assignedSpecialists.length}/{machine.minSpecialists} mind.)
            </p>
            <div className="flex flex-wrap gap-1">
              {assignedSpecialists.map(e => (
                <button
                  key={e.id}
                  onClick={() => handleRemoveWorker(e.id)}
                  className="text-xs bg-stone-700 text-stone-300 px-2 py-0.5 hover:bg-red-900/40 hover:text-red-400 transition-colors"
                  title="Abziehen"
                >
                  FK #{e.id.slice(-3)} ×
                </button>
              ))}
              {availableSpecialists.length > 0 && (
                <select
                  defaultValue=""
                  onChange={e => { handleAssignWorker(e.target.value, true); e.target.value = '' }}
                  className="text-xs bg-stone-700 border border-stone-600 text-stone-400 px-1 py-0.5 focus:outline-none"
                >
                  <option value="">+ Fachkraft</option>
                  {availableSpecialists.map(e => (
                    <option key={e.id} value={e.id}>FK #{e.id.slice(-3)}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Manager */}
        {machine.requiresManager && (
          <div>
            <p className="text-xs text-stone-500 mb-1">Maschinenleiter</p>
            {managers.length === 0 ? (
              <p className="text-xs text-stone-600 italic">Kein Manager verfügbar.</p>
            ) : (
              <select
                value={machine.managerId ?? ''}
                onChange={e => handleManager(e.target.value)}
                className="w-full bg-stone-700 border border-stone-600 text-stone-200 text-xs px-2 py-1.5 focus:outline-none focus:border-amber-600"
              >
                <option value="">— kein Manager —</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>Manager #{m.id.slice(-3)}</option>
                ))}
              </select>
            )}
            {!currentManager && (
              <p className="text-xs text-amber-600 mt-1">Ohne Manager läuft die Maschine auf 50 % Effizienz.</p>
            )}
          </div>
        )}

        {/* Transfer */}
        <div className="pt-1 border-t border-stone-700">
          <button
            onClick={() => setShowTransfer(true)}
            className="text-xs text-stone-600 hover:text-amber-400 transition-colors"
          >
            Maschine versetzen →
          </button>
        </div>
      </div>

      {showTransfer && (
        <TransferMachineModal
          machine={machine}
          companyId={companyId}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </>
  )
}

export default function MachinesPanel({ companyId }: { companyId: string }) {
  const { companies, capital, buyMachine } = useGameStore()
  const { addToast } = useToastStore()
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [buyError, setBuyError] = useState<string | null>(null)

  const company = companies.find(c => c.id === companyId)
  if (!company) return null

  const machines = company.machines ?? []
  const availableTemplates = MACHINE_TEMPLATES.filter(t =>
    t.applicableBranches.includes(company.branch)
  )

  const selectedProperty = company.properties.find(p => p.id === selectedPropertyId)
  const usedMEInSelected = selectedPropertyId
    ? machines.filter(m => m.propertyId === selectedPropertyId).reduce((s, m) => s + m.machineSize, 0)
    : 0
  const freeMEInSelected = selectedProperty ? selectedProperty.machineSlots - usedMEInSelected : 0

  function handleBuy(templateId: string) {
    setBuyError(null)
    if (!selectedPropertyId) { setBuyError('Bitte zuerst einen Standort wählen.'); return }
    const err = buyMachine(companyId, templateId, selectedPropertyId)
    if (err) {
      setBuyError(err)
      addToast(err, 'error')
    } else {
      const t = MACHINE_TEMPLATES.find(x => x.id === templateId)
      addToast(`${t?.name ?? 'Maschine'} angeschafft.`, 'success')
    }
  }

  // Maschinen nach Standort gruppieren
  const byProperty = company.properties.map(prop => ({
    property: prop,
    machines: machines.filter(m => m.propertyId === prop.id),
    usedME: machines.filter(m => m.propertyId === prop.id).reduce((s, m) => s + m.machineSize, 0),
  })).filter(g => g.machines.length > 0)

  return (
    <div className="space-y-5">

      {/* Bestand */}
      {byProperty.length > 0 && (
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Maschinenbestand</p>
          <div className="space-y-3">
            {byProperty.map(({ property, machines: pMachines, usedME }) => (
              <div key={property.id}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-stone-400 font-semibold">{property.name}</p>
                  <p className="text-xs text-stone-600 font-mono">
                    {usedME} / {property.machineSlots} ME
                  </p>
                </div>
                <div className="space-y-3">
                  {pMachines.map(m => (
                    <MachineCard key={m.id} machine={m} companyId={companyId} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kaufbereich */}
      <div>
        <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Maschine kaufen</p>

        {/* Standort wählen */}
        <div className="mb-3">
          <p className="text-xs text-stone-400 mb-1.5">1. Standort wählen</p>
          <select
            value={selectedPropertyId}
            onChange={e => { setSelectedPropertyId(e.target.value); setBuyError(null) }}
            className="w-full bg-stone-800 border border-stone-600 text-stone-200 text-xs px-3 py-2 focus:outline-none focus:border-amber-600"
          >
            <option value="">— Standort auswählen —</option>
            {company.properties.map(p => {
              const used = machines.filter(m => m.propertyId === p.id).reduce((s, m) => s + m.machineSize, 0)
              const free = p.machineSlots - used
              return (
                <option key={p.id} value={p.id}>
                  {p.name} ({free} ME frei)
                </option>
              )
            })}
          </select>
          {selectedProperty && (
            <p className="text-xs text-stone-500 mt-1">
              {freeMEInSelected} von {selectedProperty.machineSlots} Maschineneinheiten frei
            </p>
          )}
        </div>

        {selectedPropertyId && (
          <p className="text-xs text-stone-400 mb-2">2. Maschinentyp wählen</p>
        )}
        {buyError && <p className="text-xs text-red-400 mb-2">{buyError}</p>}

        {availableTemplates.length === 0 && (
          <p className="text-xs text-stone-600 italic">Keine Maschinen für diese Branche verfügbar.</p>
        )}

        <div className="space-y-2">
          {availableTemplates.map(t => {
            const canAfford = capital >= t.cost
            const fitsInProperty = selectedPropertyId ? freeMEInSelected >= t.machineSize : true
            const inactive = !selectedPropertyId
            return (
              <div
                key={t.id}
                className={`border p-3 flex items-start justify-between gap-3 transition-opacity ${
                  inactive
                    ? 'opacity-30 pointer-events-none border-stone-800 bg-stone-900'
                    : canAfford && fitsInProperty
                    ? 'border-stone-700 bg-stone-800'
                    : 'border-stone-800 bg-stone-900 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-200 font-semibold">{t.name}</p>
                  <p className="text-xs text-stone-500 mt-0.5 leading-snug">{t.description}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-stone-400">
                    <span>⚙️ {t.machineSize} ME</span>
                    <span>👷 {t.minWorkers} Arb.</span>
                    {t.minSpecialists > 0 && <span>🔧 {t.minSpecialists} FK</span>}
                    {t.requiresManager && <span>👔 Manager</span>}
                    <span className="text-green-400">+{formatMoney(t.maxBonus)}/Mo max</span>
                    <span className="text-stone-500">{t.maturityTurns} Mo. Anlauf</span>
                  </div>
                  {selectedPropertyId && !fitsInProperty && (
                    <p className="text-xs text-red-500 mt-1">
                      Kein Platz ({t.machineSize} ME benötigt, {freeMEInSelected} ME frei)
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleBuy(t.id)}
                  disabled={!canAfford || !fitsInProperty || inactive}
                  className={`shrink-0 px-3 py-2 text-xs font-bold border transition-colors ${
                    canAfford && fitsInProperty && !inactive
                      ? 'border-amber-700 text-amber-400 hover:bg-amber-900/30 cursor-pointer'
                      : 'border-stone-700 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  {formatMoney(t.cost)}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
