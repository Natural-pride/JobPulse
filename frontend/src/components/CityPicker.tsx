import { useMemo } from 'react';
import { findProvinceForCity, getCitiesInProvince, getProvinces } from '../lib/cityData';

export interface CityValue {
  province: string;
  city: string;
  district: string;
}

export default function CityPicker({
  value,
  onChange,
  className,
  disabled,
}: {
  value: CityValue;
  onChange: (next: CityValue) => void;
  className?: string;
  disabled?: boolean;
}) {
  const provinces = useMemo(() => getProvinces(), []);
  const citiesInProvince = useMemo(
    () => (value.province ? getCitiesInProvince(value.province) : []),
    [value.province]
  );
  const cityEntry = useMemo(
    () => citiesInProvince.find((c) => c.name === value.city) ?? null,
    [citiesInProvince, value.city]
  );

  return (
    <div className={`grid grid-cols-3 gap-2 ${className ?? ''}`}>
      <select
        value={value.province}
        onChange={(e) => onChange({ province: e.target.value, city: '', district: '' })}
        disabled={disabled}
        className="w-full border border-slate-300 rounded px-3 py-1.5 disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">省/直辖市</option>
        {provinces.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select
        value={value.city}
        onChange={(e) => onChange({ province: value.province, city: e.target.value, district: '' })}
        disabled={disabled || !value.province}
        className="w-full border border-slate-300 rounded px-3 py-1.5 disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">{value.province ? '选择城市' : '请先选省'}</option>
        {citiesInProvince.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={value.district}
        onChange={(e) =>
          onChange({ province: value.province, city: value.city, district: e.target.value })
        }
        disabled={disabled || !cityEntry}
        className="w-full border border-slate-300 rounded px-3 py-1.5 disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">{cityEntry ? '选择区/县' : '请先选城市'}</option>
        {cityEntry?.districts.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}

// Re-export for callers that need it.
export { findProvinceForCity };
