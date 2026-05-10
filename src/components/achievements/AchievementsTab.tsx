import { useGameStore } from '../../store/gameStore'
import { MILESTONES } from '../../data/milestones'
import { CITIES } from '../../data/cities'

export default function AchievementsTab() {
  const { achievedMilestones, companies, capital, turn } = useGameStore()

  const netWorth = capital + companies.reduce((s, c) => s + c.revenue * 12, 0)
  const totalEmployees = companies.reduce((s, c) => s + c.employees.length, 0)
  const uniqueBranches = new Set(companies.map(c => c.branch)).size
  const uniqueCities = new Set(companies.map(c => c.cityId)).size
  const uniqueCountries = new Set(companies.map(c => CITIES.find(ci => ci.id === c.cityId)?.country)).size

  const achieved = achievedMilestones.length
  const total = MILESTONES.length

  return (
    <div className="flex-1 overflow-auto p-6 bg-stone-950">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-amber-200 uppercase tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
          Errungenschaften
        </h2>
        <span className="text-sm font-mono text-amber-600">{achieved} / {total}</span>
      </div>

      {/* Fortschrittsbalken */}
      <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-amber-600 transition-all duration-700"
          style={{ width: `${(achieved / total) * 100}%` }}
        />
      </div>

      {/* Aktuelle Kennzahlen */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Nettovermögen', value: netWorth >= 1_000_000 ? `${(netWorth / 1_000_000).toFixed(1)} Mio.` : netWorth >= 1000 ? `${(netWorth / 1000).toFixed(0)}K` : String(Math.round(netWorth)) },
          { label: 'Mitarbeiter', value: String(totalEmployees) },
          { label: 'Firmen', value: String(companies.length) },
          { label: 'Branchen', value: `${uniqueBranches} / 5` },
          { label: 'Städte', value: String(uniqueCities) },
          { label: 'Länder', value: String(uniqueCountries) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-stone-900 border border-stone-700 p-3 text-center">
            <div className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">{label}</div>
            <div className="text-amber-300 font-mono text-sm font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Meilensteinliste */}
      <div className="space-y-2">
        {MILESTONES.map(ms => {
          const done = achievedMilestones.includes(ms.id)
          return (
            <div
              key={ms.id}
              className={`p-4 border flex items-start gap-4 transition-colors ${
                done
                  ? 'border-amber-800 bg-amber-950/20'
                  : 'border-stone-800 bg-stone-900 opacity-60'
              }`}
            >
              <div className={`text-xl mt-0.5 shrink-0 ${done ? 'grayscale-0' : 'grayscale opacity-30'}`}>
                {done ? '✓' : '○'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className={`text-sm font-bold ${done ? 'text-amber-200' : 'text-stone-500'}`}
                    style={{ fontFamily: 'Georgia, serif' }}>
                    {ms.title}
                  </h3>
                  {ms.reward && done && (
                    <span className="text-xs text-amber-600 bg-amber-950 px-1.5 py-0.5">{ms.reward}</span>
                  )}
                </div>
                <p className={`text-xs ${done ? 'text-stone-400' : 'text-stone-600'}`}>
                  {ms.description}
                </p>
                {done && (
                  <p className="text-xs text-stone-500 italic mt-1 leading-relaxed">
                    „{ms.storyText}"
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
