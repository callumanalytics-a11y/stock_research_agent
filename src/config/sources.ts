import type { PublicationSource } from '../types/models.ts';

export const SOURCES: PublicationSource[] = [
  {
    id: 'ft-markets',
    name: 'Financial Times',
    url: 'https://www.ft.com/markets',
    credibilityWeight: 1,
    selectors: ['h1', 'h2', 'h3', 'a[title]', '[data-trackable="heading-link"]'],
  },
  {
    id: 'investors-chronicle',
    name: "Investors' Chronicle",
    url: 'https://www.investorschronicle.co.uk/',
    credibilityWeight: 0.96,
    selectors: ['h1', 'h2', 'h3', 'article a', '.teaser__heading', '.o-teaser__heading'],
  },
  {
    id: 'moneyweek',
    name: 'MoneyWeek',
    url: 'https://moneyweek.com/investments',
    credibilityWeight: 0.91,
    selectors: ['h1', 'h2', 'h3', 'article a', '.listingResult a', '.article-name'],
  },
  {
    id: 'cityam-markets',
    name: 'City AM',
    url: 'https://www.cityam.com/news/markets/',
    credibilityWeight: 0.82,
    selectors: ['h1', 'h2', 'h3', 'article a', '.jeg_post_title a'],
  },
  {
    id: 'morningstar-uk',
    name: 'Morningstar UK',
    url: 'https://www.morningstar.co.uk/uk/',
    credibilityWeight: 0.9,
    selectors: ['h1', 'h2', 'h3', 'article a', 'a[data-track-id]', '.mdc-card a'],
  },
  {
    id: 'shares-magazine',
    name: 'Shares Magazine',
    url: 'https://www.sharesmagazine.co.uk/',
    credibilityWeight: 0.84,
    selectors: ['h1', 'h2', 'h3', 'article a', '.article-title a', '.teaser a'],
  },
  {
    id: 'the-banker',
    name: 'The Banker',
    url: 'https://www.thebanker.com/',
    credibilityWeight: 0.92,
    selectors: ['h1', 'h2', 'h3', 'article a', '.headline a', '.story-card a'],
  },
  {
    id: 'reuters-markets',
    name: 'Reuters Markets',
    url: 'https://www.reuters.com/markets/',
    credibilityWeight: 0.98,
    selectors: ['h1', 'h2', 'h3', 'a[data-testid="Heading"]', 'article a'],
  },
  {
    id: 'bloomberg-uk',
    name: 'Bloomberg UK',
    url: 'https://www.bloomberg.com/uk',
    credibilityWeight: 0.95,
    selectors: ['h1', 'h2', 'h3', 'article a', 'a[data-testid="headline"]', '.headline__3Pz6O'],
  },
  {
    id: 'yahoo-finance-uk',
    name: 'Yahoo Finance UK',
    url: 'https://uk.finance.yahoo.com/',
    credibilityWeight: 0.78,
    selectors: ['h1', 'h2', 'h3', 'article a', 'a[data-test-locator]', 'section a'],
  },
];
