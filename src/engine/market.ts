import type { Branch } from '../data/cities'

export type MarketPrices = Partial<Record<Branch, number>>

const BASE_MULTIPLIER: Record<Branch, number> = {
  handel: 1.0,
  produktion: 1.0,
  gastro: 1.0,
  transport: 1.0,
  bau: 1.0,
}

export function initMarketPrices(): MarketPrices {
  return { ...BASE_MULTIPLIER }
}

export function updateMarketPrices(
  current: MarketPrices,
  branchEffect: Partial<Record<Branch, number>> = {}
): MarketPrices {
  const next = { ...current }
  const branches: Branch[] = ['handel', 'produktion', 'gastro', 'transport', 'bau']

  for (const branch of branches) {
    const base = next[branch] ?? 1.0
    // Natürliche Schwankung: ±3%
    const drift = (Math.random() - 0.5) * 0.06
    // Ereigniseffekt
    const eventEffect = branchEffect[branch] ?? 0
    // Rückkehr zur Mitte (mean reversion)
    const reversion = (1.0 - base) * 0.15

    next[branch] = Math.max(0.5, Math.min(1.8, base + drift + eventEffect + reversion))
  }

  return next
}

export function applyMarketToRevenue(baseRevenue: number, branch: Branch, prices: MarketPrices): number {
  return baseRevenue * (prices[branch] ?? 1.0)
}
