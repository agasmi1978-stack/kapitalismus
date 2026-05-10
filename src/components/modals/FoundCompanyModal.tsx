import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { CITIES, BRANCH_LABELS, type Branch } from '../../data/cities'

const BRANCHES: Branch[] = ['handel', 'produktion', 'gastro', 'transport', 'bau']
const BRANCH_ICONS: Record<Branch, string> = {
  handel: '⚓', produktion: '⚙', gastro: '🍽', transport: '🚂', bau: '🏗',
}

export default function FoundCompanyModal({ onClose }: { onClose: () => void }) {
  const { unlockedCities, playerName, capital, foundCompany } = useGameStore()
  const [name, setName] = useState(`${playerName} Zweigstelle`)
  const [branch, setBranch] = useState<Branch | ''>('')
  const [cityId, setCityId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const availableCities = CITIES.filter(c => unlockedCities.includes(c.id))
  const canAfford = capital >= 10000

  const handleFound = () => {
    if (!name.trim() || !branch || !cityId) { setError('Alle Felder ausfüllen.'); return }
    const err = foundCompany(name.trim(), branch as Branch, cityId)
    if (err) { setError(err); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-stone-900 border border-stone-700 w-full max-w-md mx-4 shadow-2xl"
      >
        <div className="px-6 pt-6 pb-4 border-b border-stone-700 flex justify-between items-start">
          <div>
            <h3 className="text-amber-100 font-bold text-lg" style={{ fontFamily: 'Georgia, serif' }}>
              Neue Firma gründen
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">Gründungskosten: 10.000 ℛℳ</p>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 text-xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-amber-600 tracking-widest uppercase mb-1.5">Firmenname</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-stone-800 border border-stone-600 text-stone-100 px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs text-amber-600 tracking-widest uppercase mb-1.5">Branche</label>
            <div className="grid grid-cols-1 gap-1.5">
              {BRANCHES.map(b => (
                <button
                  key={b}
                  onClick={() => setBranch(b)}
                  className={`px-3 py-2 text-left text-sm border flex items-center gap-2 transition-colors ${branch === b ? 'border-amber-600 bg-amber-900/30 text-amber-200' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}
                >
                  <span>{BRANCH_ICONS[b]}</span>
                  <span>{BRANCH_LABELS[b]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-amber-600 tracking-widest uppercase mb-1.5">Stadt</label>
            <div className="grid grid-cols-2 gap-1.5">
              {availableCities.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCityId(c.id)}
                  className={`px-3 py-2 text-left text-sm border transition-colors ${cityId === c.id ? 'border-amber-600 bg-amber-900/30 text-amber-200' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={handleFound}
            disabled={!canAfford}
            className={`w-full py-3 text-sm font-bold tracking-widest uppercase transition-colors ${canAfford ? 'bg-amber-700 hover:bg-amber-600 text-amber-50' : 'bg-stone-800 text-stone-600 cursor-not-allowed'}`}
          >
            {canAfford ? 'Firma gründen (10.000 ℛℳ)' : 'Zu wenig Kapital'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
