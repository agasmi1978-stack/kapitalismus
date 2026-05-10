import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

export default function MainMenu() {
  const { setPhase, loadGame } = useGameStore()

  const handleLoadGame = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          loadGame(data)
        } catch {
          alert('Ungültige Spielstanddatei.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-stone-950 overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4b896' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center"
      >
        <p className="text-amber-600 text-sm tracking-[0.3em] uppercase mb-2 font-mono">
          Nachkriegseuropa • 1945
        </p>
        <h1 className="text-7xl font-bold text-amber-100 mb-2" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-2px' }}>
          KAPITALISMUS
        </h1>
        <p className="text-stone-400 text-lg mb-1">
          Baue dein Firmenimperium aus den Trümmern Europas
        </p>
        <div className="w-32 h-px bg-amber-700 mx-auto mt-4 mb-12" />

        <div className="flex flex-col gap-4 items-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setPhase('setup')}
            className="w-64 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 font-semibold tracking-widest uppercase text-sm transition-colors"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Neues Spiel
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLoadGame}
            className="w-64 py-3 border border-stone-600 hover:border-amber-700 text-stone-400 hover:text-amber-200 font-semibold tracking-widest uppercase text-sm transition-colors"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Spiel laden
          </motion.button>
        </div>

        <p className="text-stone-700 text-xs mt-12 tracking-widest uppercase">
          Ein Browserspiel über Aufstieg, Strategie und Macht
        </p>
        <p className="text-stone-600 text-xs mt-2 tracking-widest">
          by Anis Gasmi
        </p>
      </motion.div>
    </div>
  )
}
