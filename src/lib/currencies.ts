export type CurrencyItem = {
  label: string
  code: string
  rate: number
  symbol: string
}

export type Currency = {
  label: string
  code: string
  rate: number
  symbol: string
}

export const currencies: Currency[] = [
  { label: 'Canada | CAD$', code: 'CAD', rate: 1.35, symbol: '$' },
    { label: 'USA | USD$', code: 'USD', rate: 1, symbol: '$' },
  { label: 'UK | GBP£', code: 'GBP', rate: 0.78, symbol: '£' },
  { label: 'Europe | EUR€', code: 'EUR', rate: 0.91, symbol: '€' },
  { label: 'Australia | AUD$', code: 'AUD', rate: 1.5, symbol: '$' },
  { label: 'New Zealand | NZD$', code: 'NZD', rate: 1.6, symbol: '$' },
  { label: 'Japan | JPY¥', code: 'JPY', rate: 110, symbol: '¥' },
  { label: 'Switzerland | CHF₣', code: 'CHF', rate: 0.89, symbol: '₣' },
  { label: 'Sweden | SEKkr', code: 'SEK', rate: 10.7, symbol: 'kr' },
]
