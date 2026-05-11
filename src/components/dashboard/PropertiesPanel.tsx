import { useState } from 'react'
import { useGameStore, computeManagerEfficiency } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'
import { PROPERTY_TEMPLATES } from '../../data/properties'
import { CITIES } from '../../data/cities'

function formatMoney(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} Mio. ℛℳ`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K ℛℳ`
  return `${n.toFixed(0)} ℛℳ`
}

export default function PropertiesPanel({ companyId }: { companyId: string }) {
  const { companies, capital, unlockedCities, buyProperty, assignPropertyManager, removePropertyManager } = useGameStore()
  const { addToast } = useToastStore()
  const [buyError, setBuyError] = useState<string | null>(null)
  const [managerError, setManagerError] = useState<string | null>(null)
  const [selectedCityId, setSelectedCityId] = useState<string>('')

  const company = companies.find(c => c.id === companyId)
  if (!company) return null

  const managers = company.employees.filter(e => e.level === 'manager')
  const usedSlots = company.employees.filter(e => e.propertyId).length
  const maxSlots = company.properties.reduce((s, p) => s + p.employeeSlots, 0)

  const unlockedCityObjects = CITIES.filter(c => unlockedCities.includes(c.id))

  const availableTemplates = PROPERTY_TEMPLATES.filter(t =>
    t.applicableBranches.length === 0 || t.applicableBranches.includes(company.branch)
  )

  function handleBuy(templateId: string) {
    setBuyError(null)
    if (!selectedCityId) { setBuyError('Bitte zuerst eine Stadt auswählen.'); return }
    const err = buyProperty(companyId, templateId, selectedCityId)
    if (err) {
      setBuyError(err)
      addToast(err, 'error')
    } else {
      const t = PROPERTY_TEMPLATES.find(x => x.id === templateId)
      const cityName = CITIES.find(c => c.id === selectedCityId)?.name ?? selectedCityId
      addToast(`${t?.name ?? 'Immobilie'} in ${cityName} erworben.`, 'success')
    }
  }

  function handleAssignManager(propertyId: string, employeeId: string) {
    setManagerError(null)
    if (!employeeId) {
      removePropertyManager(companyId, propertyId)
      return
    }
    const err = assignPropertyManager(companyId, propertyId, employeeId)
    if (err) {
      setManagerError(err)
      addToast(err, 'error')
    }
  }

  return (
    <div className="space-y-5">

      {/* Kapazitätsübersicht */}
      <div className="bg-stone-800 border border-stone-700 p-4">
        <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Mitarbeiterkapazität gesamt</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-stone-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usedSlots / maxSlots > 0.9 ? 'bg-red-500' : usedSlots / maxSlots > 0.7 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, maxSlots > 0 ? (usedSlots / maxSlots) * 100 : 0)}%` }}
            />
          </div>
          <span className="text-sm font-mono text-stone-300 whitespace-nowrap">{usedSlots} / {maxSlots}</span>
        </div>
        {usedSlots >= maxSlots && (
          <p className="text-xs text-red-400 mt-2">Alle Plätze belegt — kaufe eine weitere Immobilie zum Einstellen.</p>
        )}
      </div>

      {/* Bestehende Immobilien */}
      <div>
        <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Deine Standorte</p>
        <div className="space-y-3">
          {company.properties.map(prop => {
            const managerEff = prop.managerId
              ? computeManagerEfficiency(company, prop.managerId)
              : null
            const mgr = prop.managerId
              ? company.employees.find(e => e.id === prop.managerId)
              : null

            return (
              <div key={prop.id} className="bg-stone-800 border border-stone-700 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-semibold">{prop.name}</p>
                    <p className="text-stone-500 text-xs mt-0.5">
                      {CITIES.find(c => c.id === prop.cityId)?.name ?? prop.cityId}
                      {prop.templateId === 'firmensitz' && ' · Stammhaus (geerbt)'}
                    </p>
                  </div>
                  <span className="text-red-400 font-mono text-xs">−{formatMoney(prop.maintenanceCost)}/Mo</span>
                </div>

                {/* Kapazitäten */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-stone-700/50 p-2 rounded">
                    <span className="text-stone-500">Mitarbeiterplätze</span>
                    <p className="text-stone-200 font-mono font-bold mt-0.5">{prop.employeeSlots}</p>
                  </div>
                  <div className="bg-stone-700/50 p-2 rounded">
                    <span className="text-stone-500">Maschineneinheiten</span>
                    <p className="text-stone-500 font-mono font-bold mt-0.5">{prop.machineSlots} <span className="text-stone-600">(Phase 2)</span></p>
                  </div>
                </div>

                {/* Manager-Zuweisung */}
                <div>
                  <p className="text-xs text-stone-500 mb-1.5">Standortleiter</p>
                  {managers.length === 0 ? (
                    <p className="text-xs text-stone-600 italic">Kein Manager in dieser Firma verfügbar.</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={prop.managerId ?? ''}
                        onChange={e => handleAssignManager(prop.id, e.target.value)}
                        className="flex-1 bg-stone-700 border border-stone-600 text-stone-200 text-xs px-2 py-1.5 focus:outline-none focus:border-amber-600"
                      >
                        <option value="">— kein Manager —</option>
                        {managers.map(m => {
                          const eff = computeManagerEfficiency(
                            { ...company, properties: company.properties.map(p => p.id === prop.id ? { ...p, managerId: m.id } : p) },
                            m.id
                          )
                          return (
                            <option key={m.id} value={m.id}>
                              Manager #{m.id.slice(-3)} (Eff. bei Zuweisung: {eff}%)
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  )}
                  {prop.managerId && (
                    <p className={`text-xs mt-1.5 ${managerEff !== null && managerEff < 60 ? 'text-amber-500' : 'text-green-500'}`}>
                      {mgr ? `Manager #${mgr.id.slice(-3)}` : 'Manager'} · Effizienz: {managerEff}%
                      {managerEff !== null && managerEff < 100 && (
                        <span className="text-stone-500"> (leitet mehrere Standorte)</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Kaufbereich */}
      <div>
        <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Neue Immobilie kaufen</p>

        {/* Schritt 1: Stadt wählen */}
        <div className="mb-3">
          <p className="text-xs text-stone-400 mb-1.5">1. Standort (Stadt) wählen</p>
          <select
            value={selectedCityId}
            onChange={e => { setSelectedCityId(e.target.value); setBuyError(null) }}
            className="w-full bg-stone-800 border border-stone-600 text-stone-200 text-xs px-3 py-2 focus:outline-none focus:border-amber-600"
          >
            <option value="">— Stadt auswählen —</option>
            {unlockedCityObjects.map(city => (
              <option key={city.id} value={city.id}>{city.name} ({city.country})</option>
            ))}
          </select>
        </div>

        {/* Schritt 2: Immobilientyp wählen */}
        {selectedCityId && (
          <p className="text-xs text-stone-400 mb-2">2. Immobilientyp wählen</p>
        )}
        {buyError && <p className="text-xs text-red-400 mb-2">{buyError}</p>}
        <div className="space-y-2">
          {availableTemplates.map(t => {
            const canAfford = capital >= t.cost
            const inactive = !selectedCityId
            return (
              <div
                key={t.id}
                className={`border p-3 flex items-center justify-between gap-3 transition-opacity ${
                  inactive ? 'opacity-30 pointer-events-none border-stone-800 bg-stone-900'
                  : canAfford ? 'border-stone-700 bg-stone-800'
                  : 'border-stone-800 bg-stone-900 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-200 font-semibold">{t.name}</p>
                  <p className="text-xs text-stone-500 mt-0.5 leading-snug">{t.description}</p>
                  <div className="flex gap-3 mt-1.5 text-xs text-stone-400">
                    <span>👤 {t.employeeSlots} Plätze</span>
                    <span>⚙️ {t.machineSlots} ME</span>
                    <span className="text-red-400">−{formatMoney(t.maintenanceCost)}/Mo</span>
                  </div>
                </div>
                <button
                  onClick={() => handleBuy(t.id)}
                  disabled={!canAfford || inactive}
                  className={`shrink-0 px-3 py-2 text-xs font-bold border transition-colors ${
                    canAfford && !inactive
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
