import areaData from 'china-area-data';

export interface CityEntry {
  province: string;
  name: string;
  districts: string[];
}

// Province IDs that map directly to a city (municipalities). For these we use
// the province name as the city name and fold all of its sub-entries into one
// district list.
const MUNICIPALITY_IDS = new Set(['110000', '120000', '310000', '500000']);

let citiesCache: CityEntry[] | null = null;
let provincesCache: string[] | null = null;

/**
 * Returns the list of province names, sorted by zh-CN locale.
 */
export function getProvinces(): string[] {
  if (provincesCache) return provincesCache;
  const data = areaData as Record<string, Record<string, string>>;
  const provinces = data['86'];
  if (!provinces) return [];
  provincesCache = Object.values(provinces).sort((a, b) =>
    a.localeCompare(b, 'zh-CN')
  );
  return provincesCache;
}

/**
 * Returns the cities that belong to the given province, sorted by zh-CN locale.
 */
export function getCitiesInProvince(province: string): CityEntry[] {
  return getCities().filter((c) => c.province === province);
}

/**
 * Flattens the nested china-area-data structure into a flat list of
 * `(province, city, districts[])` entries suitable for a 3-level picker.
 *
 * Filters out the placeholder '市辖区' entry that the dataset uses to group
 * real districts; municipalities get their province name as the city name.
 */
export function getCities(): CityEntry[] {
  if (citiesCache) return citiesCache;
  const data = areaData as Record<string, Record<string, string>>;
  const provinces = data['86'];
  if (!provinces) return [];

  const cities: CityEntry[] = [];

  for (const [provinceId, provinceName] of Object.entries(provinces)) {
    const citiesInProv = data[provinceId];
    if (!citiesInProv) continue;

    if (MUNICIPALITY_IDS.has(provinceId)) {
      // Municipality: collapse every sub-entry (e.g. 市辖区, 县) into one list.
      const districts: string[] = [];
      for (const cityId of Object.keys(citiesInProv)) {
        const subs = data[cityId];
        if (subs) districts.push(...Object.values(subs));
      }
      const unique = [...new Set(districts)].filter((d) => d !== '市辖区');
      if (unique.length > 0) {
        cities.push({ province: provinceName, name: provinceName, districts: unique });
      }
    } else {
      // Regular province: each child is one city.
      for (const [cityId, cityName] of Object.entries(citiesInProv)) {
        const subs = data[cityId];
        if (!subs) continue;
        const districts = Object.values(subs).filter((d) => d !== '市辖区');
        if (districts.length === 0) continue;
        cities.push({ province: provinceName, name: cityName, districts });
      }
    }
  }

  cities.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  citiesCache = cities;
  return cities;
}

/**
 * Look up the province that contains the given city name. Returns null if
 * the city isn't in the dataset — useful for backward-compat parsing of
 * existing city strings.
 */
export function findProvinceForCity(cityName: string): string | null {
  return getCities().find((c) => c.name === cityName)?.province ?? null;
}
