import type { WatchlistAsset } from '../types/models.ts';

export const WATCHLIST: WatchlistAsset[] = [
  {
    symbol: 'AAPL',
    type: 'stock',
    label: 'Apple',
    aliases: ['apple', 'apple inc', 'iphone maker'],
  },
  {
    symbol: 'MSFT',
    type: 'stock',
    label: 'Microsoft',
    aliases: ['microsoft', 'microsoft corp'],
  },
  {
    symbol: 'NVDA',
    type: 'stock',
    label: 'Nvidia',
    aliases: ['nvidia', 'chip designer nvidia'],
  },
  {
    symbol: 'AMZN',
    type: 'stock',
    label: 'Amazon',
    aliases: ['amazon', 'amazon.com'],
  },
  {
    symbol: 'GOOGL',
    type: 'stock',
    label: 'Alphabet',
    aliases: ['alphabet', 'google'],
  },
  {
    symbol: 'META',
    type: 'stock',
    label: 'Meta',
    aliases: ['meta', 'facebook parent meta'],
  },
  {
    symbol: 'TSLA',
    type: 'stock',
    label: 'Tesla',
    aliases: ['tesla', 'ev maker tesla'],
  },
  {
    symbol: 'SPY',
    type: 'index_fund',
    label: 'SPDR S&P 500 ETF',
    aliases: ['s&p 500', 'sp500', 'spy', 'us large caps'],
  },
  {
    symbol: 'QQQ',
    type: 'index_fund',
    label: 'Invesco QQQ',
    aliases: ['nasdaq 100', 'qqq', 'big tech index'],
  },
  {
    symbol: 'DIA',
    type: 'index_fund',
    label: 'SPDR Dow Jones ETF',
    aliases: ['dow jones', 'dow', 'dia'],
  },
  {
    symbol: 'VUSA',
    type: 'index_fund',
    label: 'Vanguard S&P 500 UCITS ETF',
    aliases: ['vusa', 'uk s&p 500 etf'],
  },
  {
    symbol: 'VUKE',
    type: 'index_fund',
    label: 'Vanguard FTSE 100 UCITS ETF',
    aliases: ['ftse 100', 'ftse', 'vuke', 'uk blue chips'],
  },
];
