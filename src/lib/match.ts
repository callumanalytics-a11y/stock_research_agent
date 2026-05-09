import type { WatchlistAsset } from '../types/models.ts';
import { normalizeText } from './text.ts';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesCandidate(headline: string, candidate: string): boolean {
  const normalizedCandidate = normalizeText(candidate);
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(normalizedCandidate)}([^a-z0-9]|$)`, 'i');
  return pattern.test(headline);
}

export function matchAssetsToHeadline(headline: string, watchlist: WatchlistAsset[]): WatchlistAsset[] {
  const normalizedHeadline = normalizeText(headline);

  return watchlist.filter((asset) => {
    const candidates = [asset.symbol, asset.label, ...asset.aliases];
    return candidates.some((candidate) => matchesCandidate(normalizedHeadline, candidate));
  });
}
