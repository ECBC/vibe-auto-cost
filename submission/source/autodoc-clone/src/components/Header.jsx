// Header (BLOCKER #3 fix) — uses a semantic <header> element
import { IconPlus, IconGarage, IconComparison, IconUser } from './Icons.jsx';

export default function Header() {
  return (
    <header className="bg-header-bg text-header-text">
      <div className="max-w-[1280px] mx-auto px-5 h-[68px] flex items-center justify-between">
        {/* Left: PLUS chip */}
        <a href="#" className="flex items-center gap-2 text-[12px] hover:opacity-80">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm text-promo-orange">
            <IconPlus className="w-4 h-4" />
          </span>
          <span className="font-bold tracking-wide">PLUS</span>
          <span className="text-header-text/60 ml-1">Pruebe la cuenta premium</span>
        </a>
        {/* Center: logo */}
        <a href="#" className="flex items-center" aria-label="AUTODOC">
          <img src="/logo-light.svg" alt="AUTODOC" className="h-9" />
        </a>
        {/* Right: garage / comparison / login */}
        <div className="flex items-center gap-6 text-[12px]">
          <a className="flex items-center gap-2 hover:opacity-80" href="#">
            <span className="relative">
              <IconGarage className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 bg-header-text text-header-bg text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">0</span>
            </span>
            <span className="text-left leading-tight">
              <span className="block">Mi taller</span>
              <span className="block text-header-text/60">Añadir vehículo</span>
            </span>
          </a>
          <a className="flex items-center gap-2 hover:opacity-80" href="#" aria-label="Comparación">
            <IconComparison className="w-6 h-6" />
          </a>
          <a className="flex items-center gap-2 hover:opacity-80" href="#">
            <IconUser className="w-6 h-6" />
            <span className="text-left leading-tight">
              <span className="block">Mi AUTODOC</span>
              <span className="block">Iniciar sesión</span>
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
