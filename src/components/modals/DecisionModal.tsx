import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export default function DecisionModal() {
  const { pendingDecision, makeDecision } = useGameStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  if (!pendingDecision) return null

  const handleConfirm = () => {
    if (!selected) return
    setConfirmed(true)
    setTimeout(() => {
      makeDecision(pendingDecision.id, selected)
      setSelected(null)
      setConfirmed(false)
    }, 600)
  }

  const selectedOption = pendingDecision.options.find(o => o.id === selected)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg mx-4"
          style={{ background: '#f5f0e8', color: '#1a1208', fontFamily: 'Georgia, serif' }}
        >
          {/* Zeitungsartikel-Kopf */}
          <div className="border-b-4 border-stone-800 px-8 pt-6 pb-3 text-center">
            <p className="text-xs tracking-[0.4em] uppercase text-stone-500 mb-1">Entscheidung</p>
            <h1 className="text-xl font-black tracking-tight text-stone-900">
              EUROPÄISCHE WIRTSCHAFTS-ZEITUNG
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-px bg-stone-800" />
              <p className="text-xs text-stone-500 tracking-widest uppercase">Weichenstellung</p>
              <div className="flex-1 h-px bg-stone-800" />
            </div>
          </div>

          <div className="px-8 py-5">
            <h2 className="text-2xl font-black leading-tight mb-2 text-stone-900">
              {pendingDecision.title}
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed mb-5">
              {pendingDecision.situation}
            </p>

            {/* Optionen */}
            <div className="space-y-2 mb-5">
              {pendingDecision.options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`w-full text-left p-3 border-2 transition-all ${
                    selected === opt.id
                      ? 'border-stone-800 bg-stone-100'
                      : 'border-stone-300 hover:border-stone-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      selected === opt.id ? 'border-stone-800 bg-stone-800' : 'border-stone-400'
                    }`}>
                      {selected === opt.id && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                    <div>
                      <p className="font-bold text-sm text-stone-900">{opt.label}</p>
                      <p className="text-xs text-stone-600 mt-0.5">{opt.description}</p>
                      <p className="text-xs text-amber-700 mt-1 italic">{opt.consequence}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Bestätigung */}
            <div className="border-t border-stone-300 pt-4 flex justify-between items-center">
              <p className="text-xs text-stone-400 italic">Diese Entscheidung ist endgültig.</p>
              <button
                onClick={handleConfirm}
                disabled={!selected || confirmed}
                className={`px-6 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                  selected && !confirmed
                    ? 'bg-stone-800 text-stone-100 hover:bg-stone-700'
                    : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                }`}
              >
                {confirmed ? 'Entschieden...' : 'Entscheiden →'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
