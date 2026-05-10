import { useState } from 'react'
import { useToastStore } from '../../store/toastStore'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import { useGameStore } from '../../store/gameStore'
import { CITIES, BRANCH_LABELS, type City } from '../../data/cities'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'

const EUROPEAN_COUNTRIES = [
  'Germany', 'France', 'Netherlands', 'Belgium', 'Luxembourg',
  'Austria', 'Switzerland', 'Italy', 'Spain', 'Portugal',
  'Denmark', 'Sweden', 'Norway', 'Finland', 'Poland',
  'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria',
  'Greece', 'Croatia', 'Slovenia', 'Serbia', 'Bosnia and Herz.',
  'Albania', 'North Macedonia', 'Montenegro', 'Kosovo',
  'United Kingdom', 'Ireland', 'Iceland', 'Estonia', 'Latvia',
  'Lithuania', 'Belarus', 'Ukraine', 'Moldova',
]

function CityTooltip({ city, hasPresence }: { city: City; hasPresence: boolean }) {
  return (
    <div className="absolute z-10 bg-stone-900 border border-amber-700 p-3 w-52 shadow-xl pointer-events-none"
      style={{ bottom: '120%', left: '50%', transform: 'translateX(-50%)' }}>
      <p className="text-amber-200 font-bold text-sm" style={{ fontFamily: 'Georgia, serif' }}>
        {city.name}
      </p>
      <p className="text-stone-500 text-xs mb-2">{city.country}</p>
      {hasPresence && (
        <p className="text-green-400 text-xs mb-2 font-semibold">✓ Präsenz vorhanden</p>
      )}
      <div className="space-y-1">
        {Object.entries(city.branchStrengths).map(([branch, bonus]) => (
          <div key={branch} className="flex justify-between text-xs">
            <span className="text-stone-400">{BRANCH_LABELS[branch as keyof typeof BRANCH_LABELS]}</span>
            <span className={(bonus as number) >= 1.3 ? 'text-amber-400' : 'text-stone-300'}>
              +{(((bonus as number) - 1) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
      {city.unlockCost > 0 && !hasPresence && (
        <p className="text-stone-500 text-xs mt-2 border-t border-stone-700 pt-2">
          Erschließung: {(city.unlockCost / 1000).toFixed(0)}K ℛℳ
        </p>
      )}
    </div>
  )
}

export default function EuropeMap() {
  const { unlockedCities, companies, capital, unlockCity } = useGameStore()
  const { addToast } = useToastStore()
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null)

  const citiesWithPresence = new Set(companies.map(c => c.cityId))

  const handleCityClick = (cityId: string) => {
    if (unlockedCities.includes(cityId)) return
    const err = unlockCity(cityId)
    if (err) {
      addToast(err, 'error')
    } else {
      const city = CITIES.find(c => c.id === cityId)
      addToast(`${city?.name} erschlossen!`, 'success')
      setJustUnlocked(cityId)
      setTimeout(() => setJustUnlocked(null), 2000)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-stone-950 relative overflow-hidden">
      <div className="px-6 py-3 border-b border-stone-800 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold text-amber-200 uppercase tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
          Europakarte — 1945
        </h2>
        <div className="flex items-center gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Eigene Präsenz
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-stone-600 inline-block" /> Verfügbare Stadt
          </span>
        </div>
      </div>

      <div className="flex-1 relative">
        <ComposableMap
          projection="geoAzimuthalEqualArea"
          projectionConfig={{
            rotate: [-10, -52, 0],
            scale: 900,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup center={[10, 52]} zoom={1} minZoom={0.8} maxZoom={4}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies
                  .filter(geo => EUROPEAN_COUNTRIES.includes(geo.properties.name))
                  .map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: { fill: '#292524', stroke: '#57534e', strokeWidth: 0.5, outline: 'none' },
                        hover: { fill: '#3c3836', stroke: '#78716c', strokeWidth: 0.5, outline: 'none' },
                        pressed: { fill: '#3c3836', outline: 'none' },
                      }}
                    />
                  ))
              }
            </Geographies>

            {CITIES.map(city => {
              const isUnlocked = unlockedCities.includes(city.id)
              const hasPresence = citiesWithPresence.has(city.id)
              const isHovered = hoveredCity === city.id
              const canAfford = capital >= city.unlockCost

              return (
                <Marker key={city.id} coordinates={city.coordinates}>
                  <g
                    onMouseEnter={() => setHoveredCity(city.id)}
                    onMouseLeave={() => setHoveredCity(null)}
                    onClick={() => handleCityClick(city.id)}
                    style={{ cursor: isUnlocked ? 'default' : 'pointer' }}
                  >
                    <circle
                      r={hasPresence ? 8 : 5}
                      fill={hasPresence ? '#f59e0b' : isUnlocked ? '#78716c' : '#44403c'}
                      stroke={isHovered ? '#fbbf24' : hasPresence ? '#fcd34d' : '#57534e'}
                      strokeWidth={isHovered ? 2 : 1}
                    />
                    {hasPresence && (
                      <circle r={12} fill="none" stroke="#f59e0b" strokeWidth={1} opacity={0.4} />
                    )}
                    {justUnlocked === city.id && (
                      <>
                        <circle r={8} fill="none" stroke="#fbbf24" strokeWidth={2.5}>
                          <animate attributeName="r" from="8" to="28" dur="1.4s" begin="0s" fill="freeze" />
                          <animate attributeName="opacity" from="1" to="0" dur="1.4s" begin="0s" fill="freeze" />
                        </circle>
                        <circle r={8} fill="none" stroke="#f59e0b" strokeWidth={1.5}>
                          <animate attributeName="r" from="8" to="20" dur="1.4s" begin="0.25s" fill="freeze" />
                          <animate attributeName="opacity" from="0.7" to="0" dur="1.4s" begin="0.25s" fill="freeze" />
                        </circle>
                      </>
                    )}
                    <text
                      textAnchor="middle"
                      y={-14}
                      style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: '9px',
                        fill: isHovered ? '#fcd34d' : hasPresence ? '#fbbf24' : '#a8a29e',
                        pointerEvents: 'none',
                        fontWeight: hasPresence ? 'bold' : 'normal',
                      }}
                    >
                      {city.name}
                    </text>
                  </g>
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {hoveredCity && (() => {
          const city = CITIES.find(c => c.id === hoveredCity)
          if (!city) return null
          return (
            <div className="absolute bottom-6 left-6 z-10 bg-stone-900 border border-amber-700 p-4 w-64 shadow-xl">
              <p className="text-amber-200 font-bold text-base mb-0.5" style={{ fontFamily: 'Georgia, serif' }}>
                {city.name}
              </p>
              <p className="text-stone-500 text-xs mb-3">{city.country} · {(city.population1945 / 1000).toFixed(0)}K Einwohner (1945)</p>
              {citiesWithPresence.has(city.id) && (
                <p className="text-green-400 text-xs mb-2 font-semibold">✓ Deine Firmen sind hier aktiv</p>
              )}
              <div className="space-y-1.5">
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Branchenstärken</p>
                {Object.entries(city.branchStrengths).map(([branch, bonus]) => (
                  <div key={branch} className="flex justify-between text-xs">
                    <span className="text-stone-400">{BRANCH_LABELS[branch as keyof typeof BRANCH_LABELS]}</span>
                    <span className={Number(bonus) >= 1.3 ? 'text-amber-400 font-bold' : 'text-stone-300'}>
                      ×{Number(bonus).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
              {!unlockedCities.includes(city.id) && (
                <div className="mt-3 border-t border-stone-700 pt-2">
                  <p className="text-stone-500 text-xs mb-2">
                    Erschließungskosten: {(city.unlockCost / 1000).toFixed(0)}K ℛℳ
                  </p>
                  <button
                    onClick={() => handleCityClick(city.id)}
                    className={`w-full text-xs py-1.5 border transition-colors ${
                      capital >= city.unlockCost
                        ? 'border-amber-700 text-amber-400 hover:bg-amber-900/30'
                        : 'border-stone-700 text-stone-600 cursor-not-allowed'
                    }`}
                  >
                    {capital >= city.unlockCost ? 'Erschließen' : 'Zu teuer'}
                  </button>
                </div>
              )}
            </div>
          )
        })()}

<div className="absolute bottom-6 right-6 text-xs text-stone-700 italic">
          Scroll zum Zoomen · Ziehen zum Verschieben · Klick auf Stadt erschließt sie
        </div>
      </div>
    </div>
  )
}
