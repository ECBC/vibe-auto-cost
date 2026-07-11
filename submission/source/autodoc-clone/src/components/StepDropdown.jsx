// Numbered step with a click-to-open listbox dropdown
import { useEffect, useRef, useState } from 'react';
import { IconChevronDown } from './Icons.jsx';

export default function StepDropdown({ index, label, value, options, disabled, onSelect }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(-1);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const placeholderColor = disabled ? '#9C9C9C' : '#132530';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 h-12 px-4 border ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-cta-blue'} transition-colors`}
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: disabled ? '#C4D0D8' : open ? '#0068D7' : '#C4D0D8',
          borderRadius: '2px',
          opacity: disabled ? 0.6 : 1,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className="inline-flex items-center justify-center flex-shrink-0 text-[12px] font-semibold"
          style={{
            width: 22, height: 22, borderRadius: '50%',
            backgroundColor: disabled ? '#D6D9DC' : '#0068D7',
            color: disabled ? '#9C9C9C' : '#FFFFFF',
          }}
        >
          {index}
        </span>
        <span
          className="flex-1 text-left text-[14px]"
          style={{ color: value ? '#132530' : placeholderColor, fontWeight: value ? 500 : 400 }}
        >
          {value || label}
        </span>
        <IconChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: disabled ? '#9C9C9C' : '#132530' }} />
      </button>
      {open && !disabled && options && options.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 bg-white z-30 max-h-[260px] overflow-y-auto"
          style={{
            borderRadius: '4px',
            boxShadow: 'rgba(19, 37, 48, 0.12) 0px 2px 4px 0px, rgba(19, 37, 48, 0.21) 0px 0px 12px 0px',
          }}
        >
          {options.map((opt, i) => (
            <li
              key={opt.id}
              role="option"
              aria-selected={value === opt.name}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(-1)}
              onClick={() => { onSelect(opt.name); setOpen(false); }}
              className="px-4 py-2.5 text-[14px] cursor-pointer"
              style={{
                backgroundColor: hovered === i ? '#F0F4F8' : '#FFFFFF',
                color: '#132530',
              }}
            >
              {opt.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
