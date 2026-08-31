import { useMemo } from 'react';
import { getCities } from '../lib/cityData';

export interface CityValue {
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
  const cities = useMemo(() => getCities(), []);
  const cityEntry = useMemo(
    () => cities.find((c) => c.name === value.city) ?? null,
    [cities, value.city]
  );

  return (
    <div className={`grid grid-cols-2 gap-2 ${className ?? ''}`}>
      <select
        value={value.city}
        onChange={(e) => onChange({ city: e.target.value, district: '' })}
        disabled={disabled}
        className="w-full border border-slate-300 rounded px-3 py-1.5 disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">选择城市</option>
        {cities.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={value.district}
        onChange={(e) => onChange({ city: value.city, district: e.target.value })}
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
