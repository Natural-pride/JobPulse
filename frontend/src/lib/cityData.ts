import areaData from 'china-area-data';

export interface CityEntry {
  name: string;
  districts: string[];
}

// Province IDs that map directly to a city (municipalities). For these we use
// the province name as the city name and fold all of its sub-entries into one
// district list.
const MUNICIPALITY_IDS = new Set(['110000', '120000', '310000', '500000']);

let cache: CityEntry[] | null = null;

/**
 * Flattens the nested china-area-data structure into a flat list of
 * `(city, districts[])` pairs suitable for a 2-level city picker.
 *
 * Filters out the placeholder '市辖区' entry that the dataset uses to group
 * real districts; municipalities get their province name as the city name.
 */
export function getCities(): CityEntry[] {
  if (cache) return cache;
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
        cities.push({ name: provinceName, districts: unique });
      }
    } else {
      // Regular province: each child is one city.
      for (const [cityId, cityName] of Object.entries(citiesInProv)) {
        const subs = data[cityId];
        if (!subs) continue;
        const districts = Object.values(subs).filter((d) => d !== '市辖区');
        if (districts.length === 0) continue;
        cities.push({ name: cityName, districts });
      }
    }
  }

  cities.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  cache = cities;
  return cities;
}
