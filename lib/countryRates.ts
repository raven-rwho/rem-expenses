// Country-specific meal allowance rates (Verpflegungspauschale)
// Based on Bundesfinanzministerium guidelines for 2026

export interface CountryRate {
  country: string;
  fullDay: number; // 24 hours (volle Tage)
  partialDay: number; // Arrival/departure days (An- und Abreisetage)
  group?: string; // Optional group for organizing in dropdowns
}

// Placeholder data - to be populated with actual rates from xlsx
export const countryRates: CountryRate[] = [
  { country: 'Deutschland', fullDay: 40, partialDay: 20 },
  { country: 'Bulgarien', fullDay: 22, partialDay: 15 },
  { country: 'Schweiz', fullDay: 64, partialDay: 43 },
  { country: 'Griechenland', fullDay: 36, partialDay: 24, group: 'Griechenland' },
  { country: 'Athen', fullDay: 40, partialDay: 27, group: 'Griechenland' },
  { country: 'Polen', fullDay: 34, partialDay: 23, group: 'Polen' },
  { country: 'Warschau', fullDay: 40, partialDay: 27, group: 'Polen' },
  { country: 'Portugal', fullDay: 32, partialDay: 20 },
  { country: 'Rumänien', fullDay: 24, partialDay: 18, group: 'Rumänien' },
  { country: 'Bukarest', fullDay: 32, partialDay: 21, group: 'Rumänien' },
  { country: 'Serbien', fullDay: 27, partialDay: 18 },
  { country: 'Slowakei', fullDay: 33, partialDay: 22 },
  { country: 'Ungarn', fullDay: 32, partialDay: 20 },
];

export function getCountryRate(country: string): CountryRate | undefined {
  return countryRates.find(
    (rate) => rate.country.toLowerCase() === country.toLowerCase()
  );
}

export function getCountryNames(): string[] {
  return countryRates.map((rate) => rate.country);
}

export interface GroupedCountries {
  ungrouped: string[];
  groups: { label: string; countries: string[] }[];
}

export function getGroupedCountries(): GroupedCountries {
  const ungrouped: string[] = [];
  const groupMap = new Map<string, string[]>();

  for (const rate of countryRates) {
    if (rate.group) {
      const existing = groupMap.get(rate.group) || [];
      existing.push(rate.country);
      groupMap.set(rate.group, existing);
    } else {
      ungrouped.push(rate.country);
    }
  }

  const groups = Array.from(groupMap.entries()).map(([label, countries]) => ({
    label,
    countries,
  }));

  return { ungrouped, groups };
}
