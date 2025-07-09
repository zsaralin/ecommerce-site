import { Currency } from '@/context/CurrencyContext'

export function getConvertedPrice(price: number, currency: Currency): number {
  const priceKey = price; // use cents as key

  // Hardcoded pricing table
  const hardcodedPrices: Record<number, Record<string, number>> = {
    2599: {
      USD: 2599,
      CAD: 3499,
      GBP: 1899,
      EUR: 2199,
      AUD: 3999,
      NZD: 4199,
      JPY: 3999,
      CHF: 2299,
      SEK: 24900,
    },
    2199: {
      USD: 2199,
      GBP: 1699,
      EUR: 1899,
      CAD: 2999,
      AUD: 3499,
      NZD: 3699,
      JPY: 3399,
      CHF: 1999,
      SEK: 21900,
    },
    3200: {
    USD: 3200,   // You can set USD and others or leave undefined/null if only CAD matters
    CAD: 4000,
    GBP: 2600,
    EUR: 2900,
    AUD: 4300,
    NZD: 4500,
    JPY: 4400,
    CHF: 2800,
    SEK: 30000,
  }
  }

  const hardcodedPrice = hardcodedPrices[priceKey]?.[currency.code];

  if (hardcodedPrice !== undefined) {
    return hardcodedPrice; // already in cents
  }

  // ✅ Correct dynamic conversion from cents to cents
  const dollars = price / 100;
  const converted = dollars * currency.rate;
  return Math.round(converted * 100); // back to cents
}
