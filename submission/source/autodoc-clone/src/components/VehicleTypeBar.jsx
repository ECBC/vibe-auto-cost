// Vehicle-type bar (BLOCKER #1 — the actual tab interface the user cares about)
// Shows: car-icon dropdown "Vehículo de turismo ▾" (left) + free-text search (middle) + cart summary (right)
// The 3 vehicle types (Vehículo de turismo / Camión / Motocicleta) are presented as a
// clickable dropdown. Selecting one navigates to the corresponding subdomain.
import { useEffect, useRef, useState } from 'react';
import { IconCar, IconSearch, IconCart, IconChevronDown } from './Icons.jsx';

const VEHICLE_TYPES = [
  { id: 'car', label: 'Vehículo de turismo', href: 'https://www.autodoc.es/repuestos' },
  { id: 'truck', label: 'Camión', href: 'https://camiones.autodoc.es/' },
  { id: 'moto', label: 'Motocicleta', href: 'https://moto.autodoc.es/' },
];

export default function VehicleTypeBar() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(VEHICLE_TYPES[0]);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const choose = (t) => { setType(t); setOpen(false); /* navigate to subdomain */ window.location.href = t.href; };

  return (
    <div className="bg-header-bg text-header-text border-t border-white/10" data-vehicle-type-bar="">
      <div className="max-w-[1280px] mx-auto px-5 h-[40px] flex items-center gap-6">
        {/* Vehicle-type dropdown (the user's "tab list") */}
        <div className="relative flex items-stretch" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 h-[28px] px-3 bg-white/5 border border-white/10 rounded hover:bg-white/10"
            aria-haspopup="menu"
            aria-expanded={open}
            type="button"
          >
            <IconCar className="w-4 h-4" />
            <span className="text-[13px]">{type.label}</span>
            <IconChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <ul role="menu" className="absolute top-full left-0 mt-1 bg-white text-body-text shadow-lg rounded min-w-[200px] z-50">
              {VEHICLE_TYPES.map((t) => (
                <li key={t.id} role="none">
                  <button
                    role="menuitem"
                    onClick={() => choose(t)}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-100 ${t.id === type.id ? 'font-semibold' : ''}`}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Free-text search */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex-1 max-w-[720px] flex items-center bg-white rounded h-[32px] px-3"
        >
          <input
            type="text"
            placeholder="Introduzca el número o el nombre de la pieza"
            className="flex-1 outline-none text-[13px] text-body-text placeholder:text-gray-muted bg-transparent"
          />
          <button type="submit" aria-label="Buscar" className="text-body-text hover:text-cta-blue">
            <IconSearch className="w-4 h-4" />
          </button>
        </form>
        {/* Cart summary */}
        <div className="ml-auto flex items-center gap-3">
          <IconCart className="w-6 h-6" />
          <div className="text-[12px] leading-tight">
            <div>Artículos <span className="ml-1">0,00 €</span></div>
            <div className="text-header-text/60">#26-9712</div>
          </div>
          <IconChevronDown className="w-3 h-3 text-header-text/60" />
        </div>
      </div>
    </div>
  );
}
