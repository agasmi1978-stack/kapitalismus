import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'

export default function LoanModal({ onClose }: { onClose: () => void }) {
  const { capital, debt, takeLoan, repayLoan } = useGameStore()
  const { addToast } = useToastStore()
  const [mode, setMode] = useState<'nehmen' | 'tilgen'>('nehmen')
  const [amount, setAmount] = useState('')

  const monthlyInterest = Math.round(debt * 0.00417)

  const handle = () => {
    const val = parseInt(amount.replace(/\D/g, ''))
    if (isNaN(val) || val <= 0) { addToast('Ungültiger Betrag.', 'error'); return }
    const err = mode === 'nehmen' ? takeLoan(val) : repayLoan(val)
    if (err) {
      addToast(err, 'error')
    } else {
      addToast(
        mode === 'nehmen'
          ? `${val.toLocaleString('de-DE')} ℛℳ aufgenommen.`
          : `${val.toLocaleString('de-DE')} ℛℳ getilgt.`,
        'success'
      )
      setAmount('')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-stone-900 border border-stone-700 w-full max-w-sm mx-4 shadow-2xl"
      >
        <div className="px-6 pt-6 pb-4 border-b border-stone-700 flex justify-between items-start">
          <div>
            <h3 className="text-amber-100 font-bold text-lg" style={{ fontFamily: 'Georgia, serif' }}>
              Bankgeschäfte
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">Zinssatz: 5% p.a. · Limit: 200.000 ℛℳ</p>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 text-xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Übersicht */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-800 p-3 text-center">
              <div className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">Aktuelle Schulden</div>
              <div className="text-red-400 font-mono font-bold">{debt.toLocaleString('de-DE')} ℛℳ</div>
            </div>
            <div className="bg-stone-800 p-3 text-center">
              <div className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">Zinsen/Monat</div>
              <div className="text-orange-400 font-mono font-bold">{monthlyInterest.toLocaleString('de-DE')} ℛℳ</div>
            </div>
          </div>

          {/* Modus */}
          <div className="flex">
            {(['nehmen', 'tilgen'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-xs uppercase tracking-widest font-bold border-b-2 transition-colors ${
                  mode === m ? 'border-amber-600 text-amber-300' : 'border-stone-700 text-stone-500 hover:text-stone-300'
                }`}
              >
                {m === 'nehmen' ? 'Kredit aufnehmen' : 'Tilgen'}
              </button>
            ))}
          </div>

          {/* Betrag */}
          <div>
            <label className="block text-xs text-amber-600 tracking-widest uppercase mb-1.5">
              Betrag (ℛℳ)
            </label>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="z.B. 20000"
              className="w-full bg-stone-800 border border-stone-600 text-stone-100 px-3 py-2 text-sm focus:outline-none focus:border-amber-600 font-mono"
            />
          </div>

          {/* Schnellbeträge */}
          <div className="flex gap-2 flex-wrap">
            {[5000, 10000, 25000, 50000].map(v => (
              <button key={v}
                onClick={() => setAmount(String(v))}
                className="text-xs px-2 py-1 border border-stone-600 text-stone-400 hover:border-amber-700 hover:text-amber-400 transition-colors font-mono"
              >
                {(v / 1000).toFixed(0)}K
              </button>
            ))}
          </div>

          <button
            onClick={handle}
            className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 text-sm font-bold tracking-widest uppercase transition-colors"
          >
            {mode === 'nehmen' ? 'Kredit aufnehmen' : 'Tilgen'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
