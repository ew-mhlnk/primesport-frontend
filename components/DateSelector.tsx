'use client';

// components/DateSelector.tsx
interface Props {
  selectedDate: string;
  onChange: (date: string) => void;
}

function getMskDates() {
  const dates = [];
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  for (let i = -1; i <= 3; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    dates.push({
      value: `${yyyy}-${mm}-${dd}`,
      day:   i === -1 ? 'Вчера' : i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : d.toLocaleDateString('ru', { weekday: 'short' }),
      date:  `${dd}.${mm}`,
      isToday: i === 0,
    });
  }
  return dates;
}

export default function DateSelector({ selectedDate, onChange }: Props) {
  const dates = getMskDates();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {dates.map(d => (
        <button
          key={d.value}
          onClick={() => onChange(d.value)}
          className={[
            'flex items-center gap-2 px-4 py-2.5 rounded-2xl border shrink-0',
            'transition-all duration-200 select-none',
            selectedDate === d.value
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-[#111] border-[#1e1e1e] text-[#555] hover:border-[#333] hover:text-white',
          ].join(' ')}
        >
          {selectedDate === d.value && (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="8.5"  cy="15" r="1" fill="currentColor"/>
              <circle cx="12"   cy="15" r="1" fill="currentColor"/>
              <circle cx="15.5" cy="15" r="1" fill="currentColor"/>
            </svg>
          )}
          <div className="flex flex-col items-start leading-none gap-0.5">
            <span className="text-[11px] font-medium opacity-70">{d.day}</span>
            <span className="text-[15px] font-bold tabular-nums">{d.date}</span>
          </div>
        </button>
      ))}
    </div>
  );
}