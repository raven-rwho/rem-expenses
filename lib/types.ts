export interface TravelDetails {
  employeeName: string;
  startLocation: string;
  destination: string;
  departureDate: string; // Date in German format
  departureTime: string;
  returnDate: string; // Date in German format
  returnTime: string;
  destinationCountry: string;
  travelReason: string;
}

export interface LineItem {
  description: string;
  amount: number;
  currency?: string; // Currency code (e.g., 'EUR', 'USD', 'CHF')
  amountEUR?: number; // Converted amount in EUR
  exchangeRate?: number; // Exchange rate used for conversion
}

export interface MealAllowanceDay {
  date: string; // German format DD.MM.YYYY
  type: 'Abreisetag' | 'Voller Tag' | 'Rückreisetag' | 'An-/Abreisetag';
  baseAmount: number;
  breakfastDeduction: number;
  finalAmount: number;
}

export interface ExpenseItem {
  publicTransport: LineItem[];
  hotelWithBreakfast: LineItem[];
  hotelWithoutBreakfast: LineItem[];
  mealAllowance: number; // Calculated based on duration and country
  mealAllowanceBreakdown: MealAllowanceDay[]; // Day-by-day breakdown
  vehicleKilometers: LineItem[]; // Each item has description and km
  vehicleCosts: number; // Calculated: sum of all km * 0.30
  otherCosts: LineItem[];
}

export interface ExpenseSummary {
  publicTransportTotal: number;
  hotelWithBreakfastTotal: number;
  hotelWithoutBreakfastTotal: number;
  mealAllowance: number;
  vehicleCosts: number;
  otherCostsTotal: number;
}

export interface ExpenseReport {
  travelDetails: TravelDetails;
  expenses: ExpenseItem;
  summary: ExpenseSummary;
  total: number;
}
