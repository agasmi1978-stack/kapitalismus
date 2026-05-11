import { useState } from 'react'
import { motion } from 'framer-motion'
import { BRANCH_LABELS, CITIES } from '../../data/cities'
import { useGameStore, type Company } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'
import EmployeePanel from './EmployeePanel'
import InvestmentGoodsPanel from './InvestmentGoodsPanel'
import PropertiesPanel from './PropertiesPanel'
import BetriebPanel from './BetriebPanel'
import MachinesPanel from './MachinesPanel'

type DetailTab = 'uebersicht' | 'mitarbeiter' | 'investitionen' | 'immobilien' | 'betrieb' | 'maschinen'

function formatMoney(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} Mio. ℛℳ`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K ℛℳ`
  return `${n.toFixed(0)} ℛℳ`
}

export default function CompanyDetail({
  company,
  onClose,
}: {
  company: Company
  onClose: () => void
}) {
  const [tab, setTab] = useState<DetailTab>('uebersicht')
  const [sellConfirm, setSellConfirm] = useState(false)
  const [sellError, setSellError] = useState<string | null>(null)
  const [ipoConfirm, setIpoConfirm] = useState(false)
  const { sellCompany, listCompany, turn } = useGameStore()
  const { addToast } = useToastStore()
  const city = CITIES.find(c => c.id === company.cityId)
  const profit = company.revenue - company.expenses
  const salePrice = Math.round(company.revenue * 10 * 0.8)

  // IPO-Kalkulation
  const firmenwert = company.revenue * 10
  const ipoKosten = 40000 + Math.round(firmenwert * 0.03)
  const emissionserloes = Math.round(company.revenue * 8)
  const ipoNetto = emissionserloes - ipoKosten
  const age = turn - company.founded

  // Börsengang-Bedingungen
  const ipoBedingungen = [
    { label: 'Alter ≥ 12 Monate', ok: age >= 12, wert: `${age} Mo.` },
    { label: 'Profitabel', ok: profit > 0, wert: profit > 0 ? '✓' : '✗' },
    { label: 'Mindestens 5 Mitarbeiter', ok: company.employees.length >= 5, wert: `${company.employees.length}` },
    { label: 'Umsatz ≥ 8.000 ℛℳ/Mo', ok: company.revenue >= 8000, wert: `${Math.round(company.revenue / 1000)}K` },
  ]
  const ipoMoeglich = ipoBedingungen.every(b => b.ok) && !company.listed

  const handleSell = () => {
    const err = sellCompany(company.id)
    if (err) { setSellError(err); return }
    onClose()
  }

  const handleIpo = () => {
    const err = listCompany(company.id)
    if (err) { addToast(err, 'error'); setIpoConfirm(false); return }
    addToast(`${company.name} erfolgreich an die Börse gebracht! +${formatMoney(emissionserloes)} Emissionserlös.`, 'success')
    setIpoConfirm(false)
  }

  return (
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="absolute bottom-0 left-0 right-0 h-[78%] bg-stone-900 border-t border-stone-700 flex flex-col z-20 shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-stone-700">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-amber-100 font-bold text-lg" style={{ fontFamily: 'Georgia, serif' }}>
                {company.name}
              </h3>
              <p className="text-stone-500 text-xs mt-0.5">
                {BRANCH_LABELS[company.branch]} · {city?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-stone-200 text-xl leading-none mt-1"
            >
              ×
            </button>
          </div>

          {/* Schnellkennzahlen */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Einnahmen</div>
              <div className="text-green-400 font-mono text-sm font-bold">{formatMoney(company.revenue)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Ausgaben</div>
              <div className="text-red-400 font-mono text-sm font-bold">{formatMoney(company.expenses)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Gewinn/Mo</div>
              <div className={`font-mono text-sm font-bold ${profit >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {profit >= 0 ? '+' : ''}{formatMoney(profit)}
              </div>
            </div>
          </div>
        </div>

        {/* Verkaufen */}
        <div className="px-5 py-2 border-b border-stone-800">
          {!sellConfirm ? (
            <button
              onClick={() => setSellConfirm(true)}
              className="text-xs text-stone-600 hover:text-red-400 transition-colors"
            >
              Firma verkaufen (≈ {formatMoney(salePrice)})
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-red-400">Wirklich verkaufen für {formatMoney(salePrice)}?</span>
              <button onClick={handleSell} className="text-xs text-red-500 hover:text-red-300 font-bold">Ja</button>
              <button onClick={() => setSellConfirm(false)} className="text-xs text-stone-500 hover:text-stone-300">Abbrechen</button>
            </div>
          )}
          {sellError && <p className="text-xs text-red-400 mt-1">{sellError}</p>}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-700">
          {([
            { id: 'uebersicht', label: 'Übersicht' },
            { id: 'mitarbeiter', label: `Mitarbeiter (${company.employees.length})` },
            { id: 'maschinen', label: `Maschinen (${(company.machines ?? []).length})` },
          { id: 'investitionen', label: `Güter (${company.investmentGoods.filter(g => g.type !== 'maschine').length})` },
            { id: 'immobilien', label: `Immobilien (${company.properties.length})` },
            { id: 'betrieb', label: 'Betrieb' },
          ] as { id: DetailTab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs uppercase tracking-wider font-semibold transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-amber-600 text-amber-300'
                  : 'border-transparent text-stone-500 hover:text-stone-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Inhalt */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'uebersicht' && (
            <div className="space-y-4">
              <div className="bg-stone-800 border border-stone-700 p-4">
                <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Stadtvorteile</p>
                {city && Object.entries(city.branchStrengths).map(([b, bonus]) => (
                  <div key={b} className="flex justify-between text-sm mb-1.5">
                    <span className="text-stone-400">{BRANCH_LABELS[b as keyof typeof BRANCH_LABELS]}</span>
                    <span className={Number(bonus) >= 1.3 ? 'text-amber-400 font-bold' : 'text-stone-300'}>
                      ×{Number(bonus).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>

              {company.investmentGoods.length > 0 && (
                <div className="bg-stone-800 border border-stone-700 p-4">
                  <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Investitionsgüter</p>
                  {company.investmentGoods.map(g => (
                    <div key={g.id} className="flex justify-between text-sm mb-1.5">
                      <span className="text-stone-400">{g.name}</span>
                      <span className="text-green-400 font-mono">+{formatMoney(g.maxBonus)}/Mo max</span>
                    </div>
                  ))}
                </div>
              )}

              {company.listed ? (
                <div className="bg-stone-800 border border-amber-800 p-4">
                  <p className="text-xs text-amber-600 uppercase tracking-widest mb-2">Börsennotiert</p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-stone-400">Aktienkurs</span>
                    <span className="text-amber-300 font-mono font-bold">{formatMoney(company.sharePrice)} / Aktie</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Dividende (monatl.)</span>
                    <span className="text-red-400 font-mono">−{formatMoney(Math.round(Math.max(0, profit) * 0.10))}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-800 border border-stone-700 p-4">
                  <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Börsengang (IPO)</p>

                  {/* Bedingungen */}
                  <div className="space-y-1 mb-3">
                    {ipoBedingungen.map(b => (
                      <div key={b.label} className="flex justify-between text-xs">
                        <span className={b.ok ? 'text-stone-400' : 'text-stone-600'}>{b.label}</span>
                        <span className={b.ok ? 'text-green-400' : 'text-red-600'}>{b.wert}</span>
                      </div>
                    ))}
                  </div>

                  {!ipoConfirm && (
                    <div className="relative group">
                      <button
                        onClick={() => ipoMoeglich && setIpoConfirm(true)}
                        disabled={!ipoMoeglich}
                        className={`w-full py-2 text-xs border transition-colors ${
                          ipoMoeglich
                            ? 'border-amber-700 text-amber-400 hover:bg-amber-900/30 cursor-pointer'
                            : 'border-stone-700 text-stone-600 cursor-not-allowed'
                        }`}
                      >
                        An die Börse bringen →
                      </button>
                      {!ipoMoeglich && (
                        <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-stone-800 border border-stone-600 p-2.5 hidden group-hover:block z-50 shadow-xl">
                          <p className="text-stone-400 text-xs font-semibold mb-2 uppercase tracking-wider">IPO-Bedingungen</p>
                          <div className="space-y-1">
                            {ipoBedingungen.map(b => (
                              <div key={b.label} className="flex justify-between items-center gap-3 text-xs">
                                <span className={b.ok ? 'text-stone-400' : 'text-stone-500'}>{b.label}</span>
                                <span className={`font-mono font-bold ${b.ok ? 'text-green-400' : 'text-red-500'}`}>{b.wert}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {ipoMoeglich && ipoConfirm && (
                    <div className="space-y-2">
                      <div className="border border-stone-700 p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-stone-500">Fixgebühr + Wirtschaftsprüfer</span>
                          <span className="text-red-400 font-mono">−40.000 ℛℳ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Variable Gebühr (3 % von {formatMoney(firmenwert)})</span>
                          <span className="text-red-400 font-mono">−{formatMoney(ipoKosten - 40000)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Emissionserlös (Aktienausgabe)</span>
                          <span className="text-green-400 font-mono">+{formatMoney(emissionserloes)}</span>
                        </div>
                        <div className="flex justify-between border-t border-stone-700 pt-1.5 font-bold">
                          <span className="text-stone-300">Netto-Effekt</span>
                          <span className={ipoNetto >= 0 ? 'text-green-400 font-mono' : 'text-red-400 font-mono'}>
                            {ipoNetto >= 0 ? '+' : ''}{formatMoney(ipoNetto)}
                          </span>
                        </div>
                        <p className="text-stone-600 pt-1">
                          Laufend: 10 % des monatlichen Gewinns als Dividende.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleIpo}
                          className="flex-1 py-2 text-xs bg-amber-700 hover:bg-amber-600 text-amber-50 font-bold transition-colors"
                        >
                          Jetzt an die Börse!
                        </button>
                        <button
                          onClick={() => setIpoConfirm(false)}
                          className="px-4 py-2 text-xs text-stone-500 hover:text-stone-300 border border-stone-700"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'mitarbeiter' && (
            <EmployeePanel companyId={company.id} />
          )}

          {tab === 'maschinen' && (
            <MachinesPanel companyId={company.id} />
          )}

          {tab === 'investitionen' && (
            <InvestmentGoodsPanel companyId={company.id} branch={company.branch} />
          )}

          {tab === 'immobilien' && (
            <PropertiesPanel companyId={company.id} />
          )}

          {tab === 'betrieb' && (
            <BetriebPanel companyId={company.id} />
          )}
        </div>
      </motion.div>
  )
}
