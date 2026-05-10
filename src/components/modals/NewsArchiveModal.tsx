import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

const TYPE_LABELS: Record<string, string> = {
  weltereignis: 'Weltgeschehen',
  meilenstein:  'Meilenstein',
  rival:        'Rivale',
  markt:        'Markt',
}

const TYPE_COLORS: Record<string, string> = {
  weltereignis: 'text-blue-400 border-blue-800',
  meilenstein:  'text-amber-400 border-amber-800',
  rival:        'text-red-400 border-red-800',
  markt:        'text-green-400 border-green-800',
}

export default function NewsArchiveModal({ onClose }: { onClose: () => void }) {
  const { newsHistory } = useGameStore()
  const sorted = [...newsHistory].reverse()

  return (
    <AnimatePresence>
      <motion.div
        key="news-archive-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-16 px-4"
        onClick={onClose}
      >
        <motion.div
          key="news-archive-panel"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="bg-stone-900 border border-stone-700 w-full max-w-xl max-h-[75vh] flex flex-col shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-700 shrink-0">
            <div>
              <h2 className="text-amber-100 font-bold tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                📰 Zeitungsarchiv
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {newsHistory.length === 0 ? 'Noch keine Ereignisse' : `${newsHistory.length} Berichte`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-stone-200 text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sorted.length === 0 ? (
              <p className="text-stone-600 text-sm text-center py-8">
                Noch keine Ereignisse eingetreten.
              </p>
            ) : (
              sorted.map(event => {
                const colorClass = TYPE_COLORS[event.type] ?? 'text-stone-400 border-stone-700'
                return (
                  <div
                    key={event.id}
                    className="bg-stone-800 border border-stone-700 p-4"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs uppercase tracking-wider font-semibold border px-1.5 py-0.5 ${colorClass}`}>
                        {TYPE_LABELS[event.type] ?? event.type}
                      </span>
                      <span className="text-xs text-stone-600 font-mono">{event.date}</span>
                    </div>
                    <h3 className="text-amber-100 font-bold text-sm mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                      {event.headline}
                    </h3>
                    <p className="text-stone-400 text-xs leading-relaxed">{event.body}</p>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
