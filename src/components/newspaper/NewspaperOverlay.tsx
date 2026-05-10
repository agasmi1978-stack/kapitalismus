import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export default function NewspaperOverlay() {
  const { currentNews, dismissNews } = useGameStore()

  return (
    <AnimatePresence>
      {currentNews && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={dismissNews}
        >
          <motion.div
            initial={{ scale: 0.85, rotate: -1 }}
            animate={{ scale: 1, rotate: -0.5 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg mx-4"
            style={{
              background: '#f5f0e8',
              color: '#1a1208',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 4px 4px 0 rgba(0,0,0,0.3)',
            }}
          >
            {/* Zeitungskopf */}
            <div className="border-b-4 border-stone-800 px-8 pt-6 pb-3 text-center">
              <p className="text-xs tracking-[0.4em] uppercase text-stone-600 mb-1">
                {currentNews.date}
              </p>
              <h1 className="text-2xl font-black tracking-tight text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>
                EUROPÄISCHE WIRTSCHAFTS-ZEITUNG
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-px bg-stone-800" />
                <p className="text-xs text-stone-500 tracking-widest uppercase">
                  {currentNews.type === 'weltereignis' ? 'Weltgeschehen' :
                   currentNews.type === 'meilenstein' ? 'Persönliches' :
                   currentNews.type === 'rival' ? 'Wirtschaft' : 'Märkte'}
                </p>
                <div className="flex-1 h-px bg-stone-800" />
              </div>
            </div>

            {/* Schlagzeile & Text */}
            <div className="px-8 py-6">
              <h2 className="text-2xl font-black leading-tight mb-4 text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>
                {currentNews.headline}
              </h2>
              <p className="text-sm leading-relaxed text-stone-700" style={{ fontFamily: 'Georgia, serif' }}>
                {currentNews.body}
              </p>

              {currentNews.branchEffect && (
                <div className="mt-4 pt-4 border-t border-stone-300">
                  <p className="text-xs text-stone-500 uppercase tracking-widest mb-2">Auswirkungen auf Branchen</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(currentNews.branchEffect).map(([branch, effect]) => (
                      <span
                        key={branch}
                        className={`text-xs px-2 py-1 font-mono ${(effect as number) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {branch}: {(effect as number) > 0 ? '+' : ''}{((effect as number) * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-300 px-8 py-4 flex justify-between items-center">
              <p className="text-xs text-stone-400 italic">Klicken zum Schließen</p>
              <button
                onClick={dismissNews}
                className="text-xs uppercase tracking-widest text-stone-600 hover:text-stone-900 font-bold transition-colors"
              >
                Weiter →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
