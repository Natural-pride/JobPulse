import DatePicker from 'react-datepicker';
import { zhCN } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

export default function DateTimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const parsed: Date | null = value && isValid(parseISO(value)) ? parseISO(value) : null;

  function handleChange(d: Date | null) {
    if (!d) {
      onChange('');
      return;
    }
    onChange(format(d, "yyyy-MM-dd'T'HH:mm:ss"));
  }

  return (
    <DatePicker
      selected={parsed}
      onChange={handleChange}
      showTimeSelect
      timeIntervals={10}
      timeCaption="时间"
      dateFormat="yyyy-MM-dd HH:mm"
      locale={zhCN}
      placeholderText="点击选择日期时间"
      isClearable
      className="w-full border border-slate-300 rounded px-3 py-1.5 focus:border-brand-500 focus:outline-none"
      wrapperClassName="w-full"
    />
  );
}
