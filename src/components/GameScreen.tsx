import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TopBar from './hud/TopBar'
import Dashboard from './dashboard/Dashboard'
import EuropeMap from './map/EuropeMap'
import MarketTab from './market/MarketTab'
import RivalsTab from './rivals/RivalsTab'
import AchievementsTab from './achievements/AchievementsTab'
import NewspaperOverlay from './newspaper/NewspaperOverlay'
import DecisionModal from './modals/DecisionModal'
import ToastContainer from './ui/ToastContainer'

type Tab = 'karte' | 'firmen' | 'markt' | 'rivalen' | 'errungenschaften'

const TABS: { id: Tab; label: string }[] = [
  { id: 'karte', label: 'Europakarte' },
  { id: 'firmen', label: 'Meine Firmen' },
  { id: 'markt', label: 'Markt & Börse' },
  { id: 'rivalen', label: 'Rivalen' },
  { id: 'errungenschaften', label: 'Errungenschaften' },
]

export default function GameScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('firmen')

  return (
    <div className="flex flex-col h-screen bg-stone-950 text-stone-100">
      <TopBar />

      {/* Tab-Navigation */}
      <div className="flex border-b border-stone-700 bg-stone-900 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-xs uppercase tracking-widest font-semibold transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-amber-600 text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab-Inhalt mit Animation */}
      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex flex-1 overflow-hidden absolute inset-0"
          >
            {activeTab === 'firmen' && <Dashboard />}
            {activeTab === 'karte' && <EuropeMap />}
            {activeTab === 'markt' && <MarketTab />}
            {activeTab === 'rivalen' && <RivalsTab />}
            {activeTab === 'errungenschaften' && <AchievementsTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <NewspaperOverlay />
      <DecisionModal />
      <ToastContainer />
    </div>
  )
}
