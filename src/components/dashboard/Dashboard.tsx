import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGameStore, type Company } from '../../store/gameStore'
import { BRANCH_LABELS, CITIES } from '../../data/cities'
import CompanyDetail from './CompanyDetail'
import FoundCompanyModal from '../modals/FoundCompanyModal'
import SynergiesPanel from './SynergiesPanel'

function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)} Mio. ℛℳ`
  if (Math.abs(amount) >= 1_000) return `${(amount / 1_000).toFixed(1)}K ℛℳ`
  return `${amount.toFixed(0)} ℛℳ`
}

function CompanyCard({ company, onClick }: { company: Company; onClick: () => void }) {
  const city = CITIES.find(c => c.id === company.cityId)
  const profit = company.revenue - company.expenses
  const strikeRisk = company.employees.some(e => e.morale < 40)

  return (
    <div
      onClick={onClick}
      className="bg-stone-900 border border-stone-700 hover:border-amber-700 p-5 cursor-pointer transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-amber-100 font-bold text-base group-hover:text-amber-300 transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
            {company.name}
          </h3>
          <p className="text-stone-500 text-xs mt-0.5">
            {BRANCH_LABELS[company.branch]} · {city?.name ?? company.cityId}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-mono font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profit >= 0 ? '+' : ''}{formatMoney(profit)}/Mo
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center">
        <div>
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">Einnahmen</div>
          <div className="text-green-400 font-mono text-xs">{formatMoney(company.revenue)}</div>
        </div>
        <div>
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">Ausgaben</div>
          <div className="text-red-400 font-mono text-xs">{formatMoney(company.expenses)}</div>
        </div>
        <div>
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">Mitarbeiter</div>
          <div className="text-stone-300 font-mono text-xs">{company.employees.length}</div>
        </div>
        <div>
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">Güter</div>
          <div className="text-stone-300 font-mono text-xs">{company.investmentGoods.length}</div>
        </div>
      </div>

      {strikeRisk && (
        <div className="mt-3 pt-3 border-t border-stone-700 text-xs text-red-400">
          ⚠ Streikgefahr — Moral kritisch niedrig
        </div>
      )}

      <div className="mt-3 text-xs text-stone-600 group-hover:text-stone-400 transition-colors text-right">
        Details öffnen →
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { companies } = useGameStore()
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showFound, setShowFound] = useState(false)

  if (companies.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-600 text-sm">
        Keine Firmen vorhanden.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden relative flex">
      {/* Firmenliste */}
      <div className="flex-1 overflow-auto p-6 bg-stone-950">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-amber-200 uppercase tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
            Meine Firmen
          </h2>
          <button
            onClick={() => setShowFound(true)}
            className="text-xs px-4 py-2 border border-amber-700 text-amber-400 hover:bg-amber-900/30 transition-colors uppercase tracking-widest"
          >
            + Neue Firma
          </button>
        </div>
        <SynergiesPanel />
        <div className="grid grid-cols-1 gap-4">
          {companies.map(company => (
            <CompanyCard
              key={company.id}
              company={company}
              onClick={() => setSelectedCompany(company)}
            />
          ))}
        </div>
      </div>

      {showFound && <FoundCompanyModal onClose={() => setShowFound(false)} />}

      {/* Detailpanel — blendet von unten ein */}
      <AnimatePresence>
        {selectedCompany && (
          <CompanyDetail
            key={selectedCompany.id}
            company={companies.find(c => c.id === selectedCompany.id) ?? selectedCompany}
            onClose={() => setSelectedCompany(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
