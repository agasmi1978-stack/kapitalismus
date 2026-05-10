import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { CITIES } from '../data/cities'
import { MILESTONES } from '../data/milestones'

function formatMoney(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} Mio. ℛℳ`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ℛℳ`
  return `${n.toFixed(0)} ℛℳ`
}

export default function GameOver() {
  const { gameOverReason, playerName, capital, debt, companies, turn, year, month,
    achievedMilestones, setPhase } = useGameStore()

  const netWorth = capital + companies.reduce((s, c) => s + c.revenue * 12, 0)
  const totalEmployees = companies.reduce((s, c) => s + c.employees.length, 0)
  const uniqueCities = new Set(companies.map(c => c.cityId)).size
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl text-center"
      >
        {/* Zeitungsartikel-Stil */}
        <div className="bg-stone-100 text-stone-900 p-8 shadow-2xl" style={{ fontFamily: 'Georgia, serif' }}>
          <p className="text-xs tracking-[0.4em] uppercase text-stone-500 mb-1">
            {MONTHS[month - 1]} {year}
          </p>
          <h1 className="text-3xl font-black mb-1">EUROPÄISCHE WIRTSCHAFTS-ZEITUNG</h1>
          <div className="h-0.5 bg-stone-800 my-3" />
          <h2 className="text-2xl font-black leading-tight mb-4">
            {playerName} & Co. ist Geschichte
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            {gameOverReason ?? 'Das Unternehmen konnte nicht weiter bestehen.'}
          </p>
          <div className="h-px bg-stone-300 my-4" />

          {/* Statistiken */}
          <div className="grid grid-cols-2 gap-4 text-left mb-6">
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">Nettovermögen</p>
              <p className="text-lg font-bold">{formatMoney(netWorth)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">Schulden</p>
              <p className="text-lg font-bold text-red-700">{formatMoney(debt)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">Firmen</p>
              <p className="text-lg font-bold">{companies.length}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">Mitarbeiter</p>
              <p className="text-lg font-bold">{totalEmployees}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">Städte</p>
              <p className="text-lg font-bold">{uniqueCities}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">Monate gespielt</p>
              <p className="text-lg font-bold">{turn}</p>
            </div>
          </div>

          {/* Errungenschaften */}
          {achievedMilestones.length > 0 && (
            <>
              <div className="h-px bg-stone-300 my-4" />
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Erreichte Meilensteine</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {achievedMilestones.map(id => {
                  const ms = MILESTONES.find(m => m.id === id)
                  return ms ? (
                    <span key={id} className="text-xs px-2 py-0.5 bg-stone-200 text-stone-700">
                      {ms.title}
                    </span>
                  ) : null
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6 justify-center">
          <button
            onClick={() => setPhase('menu')}
            className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 text-sm font-bold tracking-widest uppercase transition-colors"
          >
            Neues Spiel
          </button>
          <button
            onClick={() => setPhase('setup')}
            className="px-6 py-3 border border-stone-600 text-stone-400 hover:text-amber-200 hover:border-amber-700 text-sm font-bold tracking-widest uppercase transition-colors"
          >
            Neu starten
          </button>
        </div>
      </motion.div>
    </div>
  )
}
