import { useGameStore } from '../../store/gameStore'
import { computeSynergies } from '../../engine/synergies'

export default function SynergiesPanel() {
  const { companies } = useGameStore()
  const synergies = computeSynergies(companies)

  if (synergies.length === 0) return null

  return (
    <div className="mb-4 bg-amber-950/20 border border-amber-800 p-4">
      <p className="text-xs text-amber-600 uppercase tracking-widest mb-3">
        ⚡ Aktive Synergien ({synergies.length})
      </p>
      <div className="space-y-2">
        {synergies.map(s => (
          <div key={s.definition.label} className="flex items-center justify-between">
            <div>
              <span className="text-amber-300 text-sm font-semibold">{s.definition.label}</span>
              <p className="text-stone-500 text-xs">{s.definition.description}</p>
            </div>
            <span className="text-green-400 text-sm font-mono font-bold ml-4 shrink-0">
              +{s.definition.bonusPercent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
