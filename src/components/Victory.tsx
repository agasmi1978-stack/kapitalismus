import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { MILESTONES } from '../data/milestones'

function formatMoney(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} Mio. ℛℳ`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ℛℳ`
  return `${n.toFixed(0)} ℛℳ`
}

const VICTORY_TITLES: Record<string, string> = {
  vermoegen: 'Der reichste Mann Europas',
  marktfuehrer: 'Der Marktbeherrscher',
  expansion: 'Der Kontinentalimperialist',
  endlos: 'Legende der Wirtschaft',
}

export default function Victory() {
  const { playerName, capital, debt, companies, turn, year, month,
    achievedMilestones, victoryCondition, setPhase } = useGameStore()

  const netWorth = capital + companies.reduce((s, c) => s + c.revenue * 12, 0)
  const totalEmployees = companies.reduce((s, c) => s + c.employees.length, 0)
  const uniqueCities = new Set(companies.map(c => c.cityId)).size
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 px-4 overflow-auto py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl"
      >
        {/* Goldener Rahmen */}
        <div className="border-4 border-amber-600 p-1 mb-6">
          <div className="bg-amber-950/40 p-8 text-center" style={{ fontFamily: 'Georgia, serif' }}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-amber-500 text-xs tracking-[0.4em] uppercase mb-3">
                {MONTHS[month - 1]} {year} · Nachkriegseuropa
              </p>
              <h1 className="text-4xl font-black text-amber-200 mb-2 leading-tight">
                {VICTORY_TITLES[victoryCondition] ?? 'Sieg!'}
              </h1>
              <p className="text-amber-400 text-xl mb-4">{playerName} & Co.</p>
              <div className="w-24 h-0.5 bg-amber-600 mx-auto mb-4" />
              <p className="text-stone-300 text-sm leading-relaxed">
                Aus den Trümmern des Krieges hast du ein Imperium errichtet, das Europa das Staunen lehrt.
                Geschichte wurde geschrieben — mit deinem Namen.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Statistiken */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-stone-900 border border-stone-700 p-6 mb-4"
        >
          <p className="text-xs text-amber-600 uppercase tracking-widest mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Abschlussbilanz
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Nettovermögen', value: formatMoney(netWorth), highlight: true },
              { label: 'Firmen', value: String(companies.length) },
              { label: 'Mitarbeiter', value: String(totalEmployees) },
              { label: 'Städte', value: String(uniqueCities) },
              { label: 'Schulden', value: formatMoney(debt) },
              { label: 'Monate', value: String(turn) },
            ].map(({ label, value, highlight }) => (
              <div key={label}>
                <div className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">{label}</div>
                <div className={`font-mono font-bold text-sm ${highlight ? 'text-amber-400' : 'text-stone-300'}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Errungenschaften */}
        {achievedMilestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-stone-900 border border-stone-700 p-4 mb-6"
          >
            <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">
              Erreichte Meilensteine ({achievedMilestones.length}/{MILESTONES.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {achievedMilestones.map(id => {
                const ms = MILESTONES.find(m => m.id === id)
                return ms ? (
                  <span key={id} className="text-xs px-2 py-0.5 bg-amber-900/40 border border-amber-800 text-amber-300">
                    {ms.title}
                  </span>
                ) : null
              })}
            </div>
          </motion.div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setPhase('menu')}
            className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 text-sm font-bold tracking-widest uppercase transition-colors"
          >
            Hauptmenü
          </button>
          <button
            onClick={() => setPhase('setup')}
            className="px-6 py-3 border border-stone-600 text-stone-400 hover:text-amber-200 hover:border-amber-700 text-sm font-bold tracking-widest uppercase transition-colors"
          >
            Neues Spiel
          </button>
        </div>
      </motion.div>
    </div>
  )
}
