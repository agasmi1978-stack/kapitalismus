import { useGameStore } from '../../store/gameStore'
import { BRANCH_LABELS, type Branch } from '../../data/cities'

const BRANCH_ICONS: Record<Branch, string> = {
  handel: '⚓',
  produktion: '⚙',
  gastro: '🍽',
  transport: '🚂',
  bau: '🏗',
}

function MarketBar({ value }: { value: number }) {
  const pct = Math.round((value - 0.5) / 1.3 * 100)
  const color = value >= 1.15 ? 'bg-green-500' : value >= 0.85 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function formatMultiplier(v: number) {
  const pct = Math.round((v - 1) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

export default function MarketTab() {
  const { marketPrices, companies, rivals, year, month } = useGameStore()
  const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  const branches: Branch[] = ['handel', 'produktion', 'gastro', 'transport', 'bau']

  const playerBranches = new Set(companies.map(c => c.branch))
  const activeRivals = rivals.filter(r => !r.eliminated)

  return (
    <div className="flex-1 overflow-auto p-6 bg-stone-950 space-y-8">

      {/* Marktpreise */}
      <div>
        <h2 className="text-lg font-bold text-amber-200 mb-1 uppercase tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
          Marktlage
        </h2>
        <p className="text-stone-500 text-xs mb-4">{MONTHS[month - 1]} {year} — Marktmultiplikatoren auf deine Einnahmen</p>

        <div className="space-y-4">
          {branches.map(branch => {
            const val = marketPrices[branch] ?? 1.0
            const isActive = playerBranches.has(branch)
            return (
              <div key={branch} className={`p-4 border ${isActive ? 'border-amber-800 bg-amber-950/20' : 'border-stone-800 bg-stone-900'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{BRANCH_ICONS[branch]}</span>
                    <div>
                      <span className="text-sm text-stone-200 font-semibold">{BRANCH_LABELS[branch]}</span>
                      {isActive && <span className="ml-2 text-xs text-amber-600 uppercase tracking-wider">Aktiv</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-mono font-bold ${val >= 1.1 ? 'text-green-400' : val >= 0.9 ? 'text-stone-300' : 'text-red-400'}`}>
                      ×{val.toFixed(2)}
                    </span>
                    <span className={`ml-2 text-xs font-mono ${val >= 1 ? 'text-green-500' : 'text-red-500'}`}>
                      ({formatMultiplier(val)})
                    </span>
                  </div>
                </div>
                <MarketBar value={val} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Börse */}
      <div>
        <h2 className="text-lg font-bold text-amber-200 mb-1 uppercase tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
          Börse
        </h2>
        <p className="text-stone-500 text-xs mb-4">Notierte Unternehmen — eigene und Rivalen</p>

        {companies.filter(c => c.listed).length === 0 && activeRivals.length === 0 ? (
          <p className="text-stone-600 text-sm">Noch keine Unternehmen an der Börse notiert.</p>
        ) : (
          <div className="space-y-2">
            {companies.filter(c => c.listed).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-stone-900 border border-amber-900">
                <div>
                  <span className="text-amber-200 text-sm font-semibold">{c.name}</span>
                  <span className="text-stone-500 text-xs ml-2">Eigenes Unternehmen</span>
                </div>
                <span className="text-amber-400 font-mono text-sm">{c.sharePrice.toFixed(2)} ℛℳ</span>
              </div>
            ))}
            {activeRivals.slice(0, 5).map(r => {
              const fakePrice = (r.netWorth / 1000).toFixed(2)
              return (
                <div key={r.id} className="flex items-center justify-between p-3 bg-stone-900 border border-stone-700">
                  <div>
                    <span className="text-stone-200 text-sm font-semibold">{r.name} AG</span>
                    <span className="text-stone-500 text-xs ml-2">Rivale</span>
                  </div>
                  <span className="text-stone-400 font-mono text-sm">{fakePrice} ℛℳ</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
