import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '../../store/toastStore'

const COLORS = {
  success: 'border-green-700 bg-green-950 text-green-300',
  error:   'border-red-700 bg-red-950 text-red-300',
  info:    'border-amber-700 bg-stone-900 text-amber-200',
}

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    '›',
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 border text-sm font-semibold shadow-xl cursor-pointer min-w-64 max-w-sm ${COLORS[toast.type]}`}
          >
            <span className="text-base leading-none">{ICONS[toast.type]}</span>
            <span>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
