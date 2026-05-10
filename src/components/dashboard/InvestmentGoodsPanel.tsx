import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { INVESTMENT_GOOD_TEMPLATES } from '../../data/investmentGoods'
import type { Branch } from '../../data/cities'

const TYPE_ICONS: Record<string, string> = {
  maschine: '⚙',
  fahrzeug: '🚛',
  gebaeude: '🏭',
  lager: '📦',
}

const TYPE_LABELS: Record<string, string> = {
  maschine: 'Maschine',
  fahrzeug: 'Fahrzeug',
  gebaeude: 'Gebäude',
  lager: 'Lager',
}

function formatMoney(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K ℛℳ`
  return `${n} ℛℳ`
}

export default function InvestmentGoodsPanel({ companyId, branch }: { companyId: string; branch: Branch }) {
  const { companies, capital, buyInvestmentGood } = useGameStore()
  const company = companies.find(c => c.id === companyId)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!company) return null

  const ownedIds = new Set(company.investmentGoods.map(g => g.id))
  const available = INVESTMENT_GOOD_TEMPLATES.filter(t => t.applicableBranches.includes(branch))

  const handleBuy = (templateId: string, name: string) => {
    const err = buyInvestmentGood(companyId, templateId)
    if (err) {
      setError(err)
      setSuccess(null)
      setTimeout(() => setError(null), 3000)
    } else {
      setSuccess(`${name} erworben!`)
      setError(null)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  return (
    <div className="space-y-4">
      {/* Besitz */}
      {company.investmentGoods.length > 0 && (
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-widest mb-2">Im Besitz</p>
          <div className="grid grid-cols-2 gap-2">
            {company.investmentGoods.map(g => (
              <div key={g.id} className="bg-stone-800 border border-amber-900 p-3 flex items-center gap-3">
                <span className="text-xl">{TYPE_ICONS[g.type]}</span>
                <div>
                  <p className="text-xs text-amber-200 font-semibold">{g.name}</p>
                  <p className="text-xs text-green-400 font-mono">+{formatMoney(g.maxBonus)}/Mo max</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verfügbare Käufe */}
      <div>
        <p className="text-xs text-stone-500 uppercase tracking-widest mb-2">Verfügbar zum Kauf</p>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {available.map(t => {
            const owned = ownedIds.has(t.id)
            const canAfford = capital >= t.cost
            return (
              <div
                key={t.id}
                className={`p-3 border flex items-center gap-3 transition-colors ${
                  owned
                    ? 'border-stone-800 bg-stone-900 opacity-50'
                    : canAfford
                    ? 'border-stone-700 bg-stone-900 hover:border-stone-500'
                    : 'border-stone-800 bg-stone-900 opacity-60'
                }`}
              >
                <span className="text-2xl shrink-0">{TYPE_ICONS[t.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-stone-500 uppercase tracking-wider">{TYPE_LABELS[t.type]}</span>
                  </div>
                  <p className="text-sm text-stone-200 font-semibold">{t.name}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{t.description}</p>
                  <p className="text-xs text-green-400 font-mono mt-1">
                    +{formatMoney(t.revenueBonus)}/Monat max · Anlauf: {t.maturityTurns} Monate
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-mono font-bold mb-1 ${canAfford ? 'text-amber-400' : 'text-stone-600'}`}>
                    {formatMoney(t.cost)}
                  </p>
                  {owned ? (
                    <span className="text-xs text-stone-600">Vorhanden</span>
                  ) : (
                    <button
                      onClick={() => handleBuy(t.id, t.name)}
                      disabled={!canAfford}
                      className={`text-xs px-3 py-1 border transition-colors ${
                        canAfford
                          ? 'border-amber-700 text-amber-400 hover:bg-amber-900/30'
                          : 'border-stone-700 text-stone-600 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Kaufen' : 'Zu teuer'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {error && <div className="text-xs text-red-400 bg-red-950 border border-red-800 px-3 py-2">{error}</div>}
      {success && <div className="text-xs text-green-400 bg-green-950 border border-green-800 px-3 py-2">✓ {success}</div>}
    </div>
  )
}
