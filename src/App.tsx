import { useGameStore } from './store/gameStore'
import MainMenu from './components/MainMenu'
import GameSetup from './components/GameSetup'
import GameScreen from './components/GameScreen'
import GameOver from './components/GameOver'
import Victory from './components/Victory'

export default function App() {
  const phase = useGameStore((s) => s.phase)

  if (phase === 'menu') return <MainMenu />
  if (phase === 'setup') return <GameSetup />
  if (phase === 'playing') return <GameScreen />
  if (phase === 'gameover') return <GameOver />
  if (phase === 'victory') return <Victory />

  return <MainMenu />
}
