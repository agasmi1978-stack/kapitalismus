import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import LoanModal from '../modals/LoanModal'
import NewsArchiveModal from '../modals/NewsArchiveModal'

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} Mio. ℛℳ`
  if (Math.abs(amount) >= 1_000) return `${(amount / 1_000).toFixed(0)}K ℛℳ`
  return `${amount.toFixed(0)} ℛℳ`
}

export default function TopBar() {
  const { year, month, capital, debt, playerName, companies, insolvencyTurns, endTurn, saveGame, newsHistory } = useGameStore()
  const [showLoan, setShowLoan] = useState(false)
  const [showArchive, setShowArchive] = useState(false)

  const netProfit = companies.reduce((sum, c) => sum + c.revenue - c.expenses, 0)
  const monthlyInterest = Math.round(debt * 0.00417)
  const monthlyTax = netProfit > 0 ? Math.round(netProfit * 0.15) : 0

  return (
    <>
      <div className="bg-stone-900 border-b border-stone-700 shrink-0">
        {/* Insolvenzwarnung */}
        {insolvencyTurns > 0 && (
          <motion.div
            animate={{ opacity: [1, 0.55, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-red-950 border-b border-red-800 px-4 py-1 text-center"
          >
            <span className="text-xs text-red-400 font-bold">
              ⚠ Insolvenzgefahr — {3 - insolvencyTurns} Monat{3 - insolvencyTurns !== 1 ? 'e' : ''} verbleibend um das Kapital zu stabilisieren
            </span>
          </motion.div>
        )}

        <div className="h-14 flex items-center px-4 gap-6">
          {/* Name */}
          <div className="text-amber-500 font-bold tracking-wider text-sm uppercase" style={{ fontFamily: 'Georgia, serif' }}>
            {playerName} & Co.
          </div>

          <div className="w-px h-6 bg-stone-700" />

          {/* Datum */}
          <div className="text-stone-300 text-sm font-mono">
            {MONTHS[month - 1]} {year}
          </div>

          {/* Zeitungsarchiv */}
          <button
            onClick={() => setShowArchive(true)}
            title={`Zeitungsarchiv (${newsHistory.length} Berichte)`}
            className="relative text-stone-500 hover:text-amber-400 transition-colors text-base leading-none"
          >
            📰
            {newsHistory.length > 0 && (
              <span className="absolute -top-1 -right-1.5 text-[9px] bg-amber-700 text-amber-100 rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold leading-none">
                {newsHistory.length > 9 ? '9+' : newsHistory.length}
              </span>
            )}
          </button>

          <div className="flex-1" />

          {/* Finanzen */}
          <div className="flex items-center gap-5 text-sm">
            <div className="text-center">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Kapital</div>
              <div className={`font-mono font-bold ${capital >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {formatMoney(capital)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Schulden</div>
              <div className={`font-mono font-bold ${debt > 0 ? 'text-red-400' : 'text-stone-500'}`}>
                {formatMoney(debt)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Gewinn/Mo</div>
              <div className={`font-mono font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {netProfit >= 0 ? '+' : ''}{formatMoney(netProfit)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Steuer/Mo</div>
              <div className="font-mono font-bold text-orange-400">
                -{formatMoney(monthlyTax + monthlyInterest)}
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* Aktionen */}
          <button
            onClick={() => setShowLoan(true)}
            className="text-xs text-stone-500 hover:text-amber-400 uppercase tracking-widest transition-colors px-3 py-1 border border-stone-700 hover:border-amber-700"
          >
            Bank
          </button>
          <button
            onClick={saveGame}
            className="text-xs text-stone-500 hover:text-amber-400 uppercase tracking-widest transition-colors px-3 py-1 border border-stone-700 hover:border-amber-700"
          >
            Speichern
          </button>
          <button
            onClick={endTurn}
            className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 text-sm font-bold tracking-widest uppercase transition-colors"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Runde beenden →
          </button>
        </div>
      </div>

      {showLoan && <LoanModal onClose={() => setShowLoan(false)} />}
      {showArchive && <NewsArchiveModal onClose={() => setShowArchive(false)} />}
    </>
  )
}
