import { getCountryRate } from './countryRates';
import { MealAllowanceDay } from './types';

// Vehicle cost rate per kilometer
export const VEHICLE_COST_PER_KM = 0.30;

// Breakfast deduction from meal allowance
export const BREAKFAST_DEDUCTION = 5.60;

/**
 * Calculate vehicle costs based on kilometers driven
 */
export function calculateVehicleCosts(kilometers: number): number {
  return kilometers * VEHICLE_COST_PER_KM;
}

/**
 * Calculate the number of hours between two dates
 */
export function calculateDurationHours(
  departureDate: string,
  departureTime: string,
  returnDate: string,
  returnTime: string
): number {
  // Parse German date format (DD.MM.YYYY)
  const [depDay, depMonth, depYear] = departureDate.split('.').map(Number);
  const [depHour, depMinute] = departureTime.split(':').map(Number);

  const [retDay, retMonth, retYear] = returnDate.split('.').map(Number);
  const [retHour, retMinute] = returnTime.split(':').map(Number);

  const departure = new Date(depYear, depMonth - 1, depDay, depHour, depMinute);
  const returnDateTime = new Date(retYear, retMonth - 1, retDay, retHour, retMinute);

  const diffMs = returnDateTime.getTime() - departure.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours;
}

/**
 * Calculate meal allowance based on travel duration and destination country
 */
export function calculateMealAllowance(
  departureDate: string,
  departureTime: string,
  returnDate: string,
  returnTime: string,
  country: string,
  hasBreakfastIncluded: boolean = false
): number {
  const durationHours = calculateDurationHours(
    departureDate,
    departureTime,
    returnDate,
    returnTime
  );

  const countryRate = getCountryRate(country);

  if (!countryRate) {
    // Fallback to Germany rates if country not found
    return calculateDomesticMealAllowance(durationHours, hasBreakfastIncluded);
  }

  // Calculate full days (24-hour periods)
  const fullDays = Math.floor(durationHours / 24);
  const remainingHours = durationHours % 24;

  let totalAllowance = fullDays * countryRate.fullDay;

  // Add partial day allowance for arrival/departure
  // Arrival day counts if > 8 hours
  // Departure day counts if > 8 hours
  if (remainingHours >= 8) {
    totalAllowance += countryRate.partialDay;
  }

  // Additional partial day for departure (if trip spans multiple calendar days)
  if (fullDays > 0) {
    totalAllowance += countryRate.partialDay; // Departure day
  }

  // Deduct breakfast if included in hotel
  if (hasBreakfastIncluded) {
    const breakfastDays = fullDays + (remainingHours >= 8 ? 1 : 0);
    totalAllowance -= breakfastDays * BREAKFAST_DEDUCTION;
  }

  return Math.max(0, totalAllowance);
}

/**
 * Calculate domestic (Germany) meal allowance
 */
function calculateDomesticMealAllowance(
  durationHours: number,
  hasBreakfastIncluded: boolean
): number {
  const DOMESTIC_FULL_DAY = 40;
  const DOMESTIC_PARTIAL_DAY = 20;

  const fullDays = Math.floor(durationHours / 24);
  const remainingHours = durationHours % 24;

  let totalAllowance = fullDays * DOMESTIC_FULL_DAY;

  if (remainingHours >= 8) {
    totalAllowance += DOMESTIC_PARTIAL_DAY;
  }

  if (fullDays > 0) {
    totalAllowance += DOMESTIC_PARTIAL_DAY; // Departure day
  }

  if (hasBreakfastIncluded) {
    const breakfastDays = fullDays + (remainingHours >= 8 ? 1 : 0);
    totalAllowance -= breakfastDays * BREAKFAST_DEDUCTION;
  }

  return Math.max(0, totalAllowance);
}

/**
 * Calculate meal allowance breakdown day by day
 */
export function calculateMealAllowanceBreakdown(
  departureDate: string,
  departureTime: string,
  returnDate: string,
  returnTime: string,
  country: string,
  hasBreakfastIncluded: boolean = false
): MealAllowanceDay[] {
  const breakdown: MealAllowanceDay[] = [];

  // Parse dates
  const [depDay, depMonth, depYear] = departureDate.split('.').map(Number);
  const [depHour, depMinute] = departureTime.split(':').map(Number);
  const [retDay, retMonth, retYear] = returnDate.split('.').map(Number);
  const [retHour, retMinute] = returnTime.split(':').map(Number);

  const departure = new Date(depYear, depMonth - 1, depDay, depHour, depMinute);
  const returnDateTime = new Date(retYear, retMonth - 1, retDay, retHour, retMinute);

  const countryRate = getCountryRate(country);
  const fullDayRate = countryRate?.fullDay || 40;
  const partialDayRate = countryRate?.partialDay || 20;

  // Calculate total duration
  const durationHours = (returnDateTime.getTime() - departure.getTime()) / (1000 * 60 * 60);

  // If same day trip
  if (depDay === retDay && depMonth === retMonth && depYear === retYear) {
    if (durationHours >= 8) {
      const baseAmount = partialDayRate;
      const breakfastDeduction = hasBreakfastIncluded ? BREAKFAST_DEDUCTION : 0;
      breakdown.push({
        date: departureDate,
        type: 'An-/Abreisetag',
        baseAmount,
        breakfastDeduction,
        finalAmount: Math.max(0, baseAmount - breakfastDeduction),
      });
    }
    return breakdown;
  }

  // Departure day
  const departureHoursOnDay = 24 - depHour - depMinute / 60;
  if (departureHoursOnDay >= 8) {
    const baseAmount = partialDayRate;
    const breakfastDeduction = hasBreakfastIncluded ? BREAKFAST_DEDUCTION : 0;
    breakdown.push({
      date: departureDate,
      type: 'Abreisetag',
      baseAmount,
      breakfastDeduction,
      finalAmount: Math.max(0, baseAmount - breakfastDeduction),
    });
  }

  // Full days in between
  let currentDate = new Date(departure);
  currentDate.setDate(currentDate.getDate() + 1);
  currentDate.setHours(0, 0, 0, 0);

  const returnDateOnly = new Date(returnDateTime);
  returnDateOnly.setHours(0, 0, 0, 0);

  while (currentDate < returnDateOnly) {
    const baseAmount = fullDayRate;
    const breakfastDeduction = hasBreakfastIncluded ? BREAKFAST_DEDUCTION : 0;
    const dateStr = `${String(currentDate.getDate()).padStart(2, '0')}.${String(currentDate.getMonth() + 1).padStart(2, '0')}.${currentDate.getFullYear()}`;

    breakdown.push({
      date: dateStr,
      type: 'Voller Tag',
      baseAmount,
      breakfastDeduction,
      finalAmount: Math.max(0, baseAmount - breakfastDeduction),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Return day (if different from departure day)
  const returnHoursOnDay = retHour + retMinute / 60;
  if (returnHoursOnDay >= 8 && !(retDay === depDay && retMonth === depMonth && retYear === depYear)) {
    const baseAmount = partialDayRate;
    const breakfastDeduction = hasBreakfastIncluded ? BREAKFAST_DEDUCTION : 0;
    breakdown.push({
      date: returnDate,
      type: 'Rückreisetag',
      baseAmount,
      breakfastDeduction,
      finalAmount: Math.max(0, baseAmount - breakfastDeduction),
    });
  }

  return breakdown;
}
