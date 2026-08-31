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
      timeFormat="HH:mm"
      dateFormat="yyyy-MM-dd HH:mm"
      locale={zhCN}
      placeholderText="点击选择日期时间"
      isClearable
      className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-sm hover:border-neutral-400 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 transition"
      wrapperClassName="w-full"
    />
  );
}
