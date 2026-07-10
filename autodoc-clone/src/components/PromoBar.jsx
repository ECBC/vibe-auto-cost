// Top: black mini-bar (SHOP / CLUB) + orange promo bar with countdown
export default function PromoBar() {
  return (
    <div className="w-full">
      {/* Mini bar: SHOP / CLUB */}
      <div className="bg-header-bg text-header-text text-[12px] h-[28px] flex items-center justify-center">
        <nav className="flex items-center gap-6">
          <a href="#" className="text-promo-orange font-semibold tracking-wide hover:opacity-80">SHOP</a>
          <a href="#" className="text-header-text/70 tracking-wide hover:opacity-80">CLUB</a>
        </nav>
      </div>
      {/* Orange promo bar */}
      <div className="bg-promo-orange text-white h-[40px] flex items-center justify-center px-4 text-[13px]">
        <div className="flex items-center gap-6 max-w-[1430px] w-full">
          <div className="flex-1 text-center font-medium">
            ¡Piezas fiables para todas tus escapadas veraniegas! Hasta un -34 % en comparación con el PVPR
          </div>
          <div className="flex items-center gap-2 text-[12px] whitespace-nowrap">
            <span className="opacity-80">LA OFERTA FINALIZA EN:</span>
            <span className="font-mono">11</span>
            <span>:</span>
            <span className="font-mono">12</span>
            <span>:</span>
            <span className="font-mono">17</span>
          </div>
        </div>
      </div>
    </div>
  );
}
