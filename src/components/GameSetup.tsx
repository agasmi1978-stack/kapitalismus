import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { CITIES, BRANCH_LABELS, type Branch } from '../data/cities'

const BRANCHES: Branch[] = ['handel', 'produktion', 'gastro', 'transport', 'bau']

const BRANCH_ICONS: Record<Branch, string> = {
  handel: '⚓',
  produktion: '⚙',
  gastro: '🍽',
  transport: '🚂',
  bau: '🏗',
}

export default function GameSetup() {
  const { setPhase, setPlayerName, setStartCity, setStartBranch, setVictoryCondition, setAiVictoryEnabled, startNewGame } = useGameStore()
  const [name, setName] = useState('')
  const [cityId, setCityId] = useState('')
  const [branch, setBranch] = useState<Branch | ''>('')
  const [victory, setVictory] = useState<string>('endlos')
  const [aiVictory, setAiVictory] = useState(false)

  const randomize = () => {
    const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)]
    const randomBranch = BRANCHES[Math.floor(Math.random() * BRANCHES.length)]
    setCityId(randomCity.id)
    setBranch(randomBranch)
  }

  const canStart = name.trim() && cityId && branch

  const handleStart = () => {
    if (!canStart) return
    setPlayerName(name.trim())
    setStartCity(cityId)
    setStartBranch(branch as Branch)
    setVictoryCondition(victory as any)
    setAiVictoryEnabled(aiVictory)
    startNewGame()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <button onClick={() => setPhase('menu')} className="text-stone-500 hover:text-amber-400 text-sm mb-8 flex items-center gap-2 transition-colors">
          ← Zurück zum Menü
        </button>

        <h2 className="text-3xl font-bold text-amber-100 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          Das Erbe annehmen
        </h2>
        <p className="text-stone-500 text-sm mb-8">Wähle deinen Ausgangspunkt — oder lass das Schicksal entscheiden.</p>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-xs text-amber-600 tracking-widest uppercase mb-2">Dein Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Familienname des Unternehmers"
              className="w-full bg-stone-900 border border-stone-700 text-stone-100 px-4 py-3 focus:outline-none focus:border-amber-600 transition-colors"
              style={{ fontFamily: 'Georgia, serif' }}
            />
          </div>

          {/* Startstadt */}
          <div>
            <label className="block text-xs text-amber-600 tracking-widest uppercase mb-2">Startstadt</label>
            <div className="grid grid-cols-2 gap-2">
              {CITIES.filter(c => c.unlockCost === 0 || ['muenchen','berlin','ruhrgebiet'].includes(c.id)).map((city) => (
                <button
                  key={city.id}
                  onClick={() => setCityId(city.id)}
                  className={`px-4 py-2 text-left text-sm border transition-colors ${cityId === city.id ? 'border-amber-600 bg-amber-900/30 text-amber-200' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}
                >
                  <span className="font-semibold">{city.name}</span>
                  <span className="text-xs text-stone-600 ml-2">{city.country}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Startbranche */}
          <div>
            <label className="block text-xs text-amber-600 tracking-widest uppercase mb-2">Familienunternehmen — Branche</label>
            <div className="grid grid-cols-1 gap-2">
              {BRANCHES.map((b) => (
                <button
                  key={b}
                  onClick={() => setBranch(b)}
                  className={`px-4 py-3 text-left text-sm border transition-colors flex items-center gap-3 ${branch === b ? 'border-amber-600 bg-amber-900/30 text-amber-200' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}
                >
                  <span className="text-lg">{BRANCH_ICONS[b]}</span>
                  <span>{BRANCH_LABELS[b]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Zufällig */}
          <button
            onClick={randomize}
            className="w-full py-2 border border-dashed border-stone-600 text-stone-500 hover:text-amber-400 hover:border-amber-700 text-sm transition-colors"
          >
            Schicksal entscheiden lassen (zufällig)
          </button>

          {/* Siegbedingung */}
          <div>
            <label className="block text-xs text-amber-600 tracking-widest uppercase mb-2">Spielziel</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'endlos', label: 'Endlosspiel' },
                { value: 'vermoegen', label: 'Vermögensziel' },
                { value: 'marktfuehrer', label: 'Marktführerschaft' },
                { value: 'expansion', label: 'Expansion' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVictory(opt.value)}
                  className={`px-4 py-2 text-sm border transition-colors ${victory === opt.value ? 'border-amber-600 bg-amber-900/30 text-amber-200' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* KI-Sieg */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={aiVictory}
              onChange={(e) => setAiVictory(e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
            <span className="text-stone-400 text-sm">KI-Rivalen können das Spiel gewinnen</span>
          </label>

          {/* Start */}
          <motion.button
            whileHover={canStart ? { scale: 1.02 } : {}}
            whileTap={canStart ? { scale: 0.98 } : {}}
            onClick={handleStart}
            disabled={!canStart}
            className={`w-full py-4 text-sm font-bold tracking-widest uppercase transition-colors ${canStart ? 'bg-amber-700 hover:bg-amber-600 text-amber-50' : 'bg-stone-800 text-stone-600 cursor-not-allowed'}`}
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Das Erbe annehmen — Spiel beginnen
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
