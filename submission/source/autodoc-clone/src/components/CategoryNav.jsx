// Dark category sub-nav (BLOCKER #1 fix) — 9 items, exact order from live eval snapshot.
// Live order: Vehículo de turismo, Neumáticos, Llantas, Herramientas, Limpieza y Cuidado,
//             Accesorios para coches, Aceite de motor, Filtros, Frenos
import { IconCar, IconTyres, IconRims, IconTools, IconMisc, IconOil, IconFilters, IconBrakes } from './Icons.jsx';

const ICON_FOR = {
  car: IconCar, tyres: IconTyres, rims: IconRims,
  tools: IconTools, misc: IconMisc, oil: IconOil, filters: IconFilters, brakes: IconBrakes,
};

const SUBNAV = [
  { text: 'Vehículo de turismo',     iconKey: 'car',     href: 'https://www.autodoc.es/repuestos' },
  { text: 'Neumáticos',              iconKey: 'tyres',   href: 'https://www.autodoc.es/neumaticos' },
  { text: 'Llantas',                 iconKey: 'rims',    href: 'https://www.autodoc.es/llantas' },
  { text: 'Herramientas',            iconKey: 'tools',   href: 'https://www.autodoc.es/herramientas' },
  { text: 'Limpieza y Cuidado',      iconKey: 'misc',    href: 'https://www.autodoc.es/limpieza-y-cuidado' },
  { text: 'Accesorios para coches',  iconKey: 'misc',    href: 'https://www.autodoc.es/accesorios-coche' },
  { text: 'Aceite de motor',         iconKey: 'oil',     href: 'https://www.autodoc.es/aceite-de-motor' },
  { text: 'Filtros',                 iconKey: 'filters', href: 'https://www.autodoc.es/repuestos/filtros' },
  { text: 'Frenos',                  iconKey: 'brakes',  href: 'https://www.autodoc.es/repuestos/frenos' },
];

export default function CategoryNav() {
  return (
    <nav className="bg-header-bg text-header-text border-t border-white/10" data-category-subnav="" aria-label="Categorías de productos">
      <div className="max-w-[1280px] mx-auto px-5">
        <ul className="header-nav flex items-stretch justify-between gap-1 py-1.5">
          {SUBNAV.map((item) => {
            const Icon = ICON_FOR[item.iconKey] || IconMisc;
            return (
              <li key={item.text} className="flex-1 min-w-0">
                <a
                  href={item.href}
                  className="flex items-center gap-1.5 px-2 h-9 rounded hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--color-header-text)', fontSize: '13px' }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                  <span className="truncate">{item.text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
