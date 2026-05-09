import assert from 'node:assert/strict';
import test from 'node:test';
import { matchAssetsToHeadline } from '../src/lib/match.ts';
import type { WatchlistAsset } from '../src/types/models.ts';

test('matchAssetsToHeadline avoids substring ticker false positives', () => {
  const watchlist: WatchlistAsset[] = [
    {
      symbol: 'DIA',
      label: 'SPDR Dow Jones ETF',
      type: 'index_fund',
      aliases: ['dow jones', 'dow', 'dia'],
    },
  ];

  const matches = matchAssetsToHeadline('Advertising & Social Media Cookies', watchlist);
  assert.equal(matches.length, 0);
});
