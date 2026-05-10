import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'
import { RIVAL_TEMPLATES } from '../../data/rivals'
import { CITIES, BRANCH_LABELS, type Branch } from '../../data/cities'

const BRANCHES: Branch[] = ['handel', 'produktion', 'gastro', 'transport', 'bau']

function formatMoney(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} Mio. ℛℳ`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ℛℳ`
  return `${n.toFixed(0)} ℛℳ`
}

const STRATEGY_COLOR: Record<string, string> = {
  aggressiv: 'text-red-400 border-red-900',
  spezialist: 'text-blue-400 border-blue-900',
}

const STRATEGY_LABEL: Record<string, string> = {
  aggressiv: 'Aggressiv',
  spezialist: 'Spezialist',
}

export default function RivalsTab() {
  const { rivals, capital, activeCooperations, buyRivalCompany, proposeCooperation } = useGameStore()
  const { addToast } = useToastStore()
  const [coopRival, setCoopRival] = useState<string | null>(null)
  const [coopBranch, setCoopBranch] = useState<Branch>('handel')
  const [justBought, setJustBought] = useState<string | null>(null)

  const handleCoop = (rivalId: string) => {
    const err = proposeCooperation(rivalId, coopBranch)
    if (err) {
      addToast(err, 'error')
    } else {
      addToast('Kooperationsvertrag geschlossen! 12 Monate aktiv.', 'success')
      setCoopRival(null)
    }
  }

  const handleBuy = (rivalId: string) => {
    const err = buyRivalCompany(rivalId)
    if (err) {
      addToast(err, 'error')
    } else {
      addToast('Firma erfolgreich übernommen!', 'success')
      setJustBought(rivalId)
      setTimeout(() => setJustBought(null), 1200)
    }
  }

  const active = rivals.filter(r => !r.eliminated).sort((a, b) => b.netWorth - a.netWorth)
  const eliminated = rivals.filter(r => r.eliminated)

  return (
    <div className="flex-1 overflow-auto p-6 bg-stone-950 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-amber-200 mb-1 uppercase tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
          Rivalen
        </h2>
        <p className="text-stone-500 text-xs mb-4">
          {active.length} aktive Gegner · {eliminated.length} ausgeschieden
        </p>

        {/* Aktive Kooperationen */}
        {activeCooperations.length > 0 && (
          <div className="mb-4 bg-blue-950/20 border border-blue-800 p-3">
            <p className="text-xs text-blue-400 uppercase tracking-widest mb-2">🤝 Aktive Kooperationen</p>
            {activeCooperations.map(c => (
              <div key={c.rivalId} className="flex justify-between text-xs text-stone-300 mb-1">
                <span>{c.rivalName} — {BRANCH_LABELS[c.branch]}</span>
                <span className="text-stone-500">{c.turnsLeft} Monate verbleibend</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
            {active.map((rival, idx) => {
              const template = RIVAL_TEMPLATES.find(t => t.id === rival.templateId)
              const cities = rival.cities.map(id => CITIES.find(c => c.id === id)?.name ?? id).join(', ')
              const isBought = justBought === rival.id

              return (
                <motion.div
                  key={rival.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    backgroundColor: isBought ? 'rgba(245,158,11,0.12)' : 'rgba(28,25,23,0)',
                  }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.25 }}
                  className="bg-stone-900 border border-stone-700 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-stone-600 font-mono text-sm font-bold">#{idx + 1}</span>
                      <div>
                        <h3 className="text-stone-100 font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                          {rival.name}
                        </h3>
                        {template && (
                          <p className="text-stone-500 text-xs mt-0.5 max-w-xs">{template.background}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-amber-300 font-mono text-sm font-bold">{formatMoney(rival.netWorth)}</div>
                      <div className="text-stone-500 text-xs">Nettovermögen</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    {template && (
                      <span className={`text-xs px-2 py-0.5 border ${STRATEGY_COLOR[template.strategy]}`}>
                        {STRATEGY_LABEL[template.strategy]}
                        {template.specialization && ` · ${template.specialization}`}
                      </span>
                    )}
                    <span className="text-xs text-stone-500">
                      {rival.companies} {rival.companies === 1 ? 'Firma' : 'Firmen'}
                    </span>
                    <span className="text-xs text-stone-500">
                      Städte: {cities}
                    </span>
                  </div>

                  {/* Stärkeanzeige */}
                  <div className="mt-3">
                    <div className="w-full h-1 bg-stone-700 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-red-700 transition-all duration-500"
                        style={{ width: `${Math.min(100, (rival.netWorth / 500000) * 100)}%` }}
                      />
                    </div>
                    {rival.companies > 0 && (() => {
                      const price = Math.round((rival.netWorth / Math.max(1, rival.companies)) * 1.5)
                      const canAfford = capital >= price
                      return (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-stone-600">
                            Firma übernehmen: <span className={`font-mono ${canAfford ? 'text-amber-500' : 'text-stone-600'}`}>{formatMoney(price)}</span>
                          </span>
                          <button
                            onClick={() => handleBuy(rival.id)}
                            disabled={!canAfford}
                            className={`text-xs px-3 py-1 border transition-colors ${canAfford ? 'border-amber-700 text-amber-400 hover:bg-amber-900/30' : 'border-stone-700 text-stone-600 cursor-not-allowed'}`}
                          >
                            Übernehmen
                          </button>
                        </div>
                      )
                    })()}

                    {/* Kooperation */}
                    {!activeCooperations.some(c => c.rivalId === rival.id) && (
                      coopRival === rival.id ? (
                        <div className="mt-2 space-y-2">
                          <select
                            value={coopBranch}
                            onChange={e => setCoopBranch(e.target.value as Branch)}
                            className="w-full bg-stone-800 border border-stone-600 text-stone-300 text-xs px-2 py-1"
                          >
                            {BRANCHES.map(b => (
                              <option key={b} value={b}>{BRANCH_LABELS[b]}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button onClick={() => handleCoop(rival.id)} className="flex-1 text-xs py-1 border border-blue-700 text-blue-400 hover:bg-blue-900/30 transition-colors">
                              Angebot machen (15K ℛℳ)
                            </button>
                            <button onClick={() => setCoopRival(null)} className="text-xs px-2 py-1 text-stone-500 hover:text-stone-300">✕</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCoopRival(rival.id)}
                          className="mt-2 text-xs text-stone-600 hover:text-blue-400 transition-colors"
                        >
                          🤝 Kooperation anbieten
                        </button>
                      )
                    )}
                    {activeCooperations.some(c => c.rivalId === rival.id) && (
                      <p className="mt-2 text-xs text-blue-500">🤝 Kooperation aktiv</p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {eliminated.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-stone-600 uppercase tracking-widest mb-2">Ausgeschieden</p>
            <div className="space-y-1">
              <AnimatePresence>
                {eliminated.map(r => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.35 }}
                    className="text-xs text-stone-600 px-3 py-1.5 bg-stone-900 border border-stone-800 line-through overflow-hidden"
                  >
                    {r.name}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
