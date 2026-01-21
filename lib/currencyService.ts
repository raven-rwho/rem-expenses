// Frankfurter API service for currency conversion
// https://www.frankfurter.app/docs/

const FRANKFURTER_API = 'https://api.frankfurter.app';

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Common currencies for expense reporting
export const SUPPORTED_CURRENCIES = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
];

/**
 * Fetch latest exchange rates from Frankfurter API
 * @param baseCurrency - Base currency code (default: EUR)
 * @returns Exchange rates
 */
export async function getExchangeRates(baseCurrency: string = 'EUR'): Promise<ExchangeRates> {
  try {
    const response = await fetch(`${FRANKFURTER_API}/latest?from=${baseCurrency}`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    throw error;
  }
}

/**
 * Convert amount from one currency to EUR
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code
 * @returns Converted amount in EUR
 */
export async function convertToEUR(amount: number, fromCurrency: string): Promise<number> {
  if (fromCurrency === 'EUR') {
    return amount;
  }

  try {
    const response = await fetch(
      `${FRANKFURTER_API}/latest?from=${fromCurrency}&to=EUR`
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data: ExchangeRates = await response.json();
    const rate = data.rates.EUR;

    if (!rate) {
      throw new Error(`No exchange rate found for ${fromCurrency} to EUR`);
    }

    return amount * rate;
  } catch (error) {
    console.error(`Failed to convert ${fromCurrency} to EUR:`, error);
    throw error;
  }
}

/**
 * Get exchange rate for a specific currency pair
 * @param from - Source currency
 * @param to - Target currency
 * @returns Exchange rate
 */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) {
    return 1;
  }

  try {
    const response = await fetch(`${FRANKFURTER_API}/latest?from=${from}&to=${to}`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data: ExchangeRates = await response.json();
    const rate = data.rates[to];

    if (!rate) {
      throw new Error(`No exchange rate found for ${from} to ${to}`);
    }

    return rate;
  } catch (error) {
    console.error(`Failed to get exchange rate from ${from} to ${to}:`, error);
    throw error;
  }
}

/**
 * Format currency with proper symbol
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;

  if (currencyCode === 'EUR') {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  return `${symbol} ${amount.toFixed(2)}`;
}
