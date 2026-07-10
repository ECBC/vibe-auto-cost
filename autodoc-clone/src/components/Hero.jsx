// Hero (BLOCKER #4 fix): explicit column widths to match live DOM (card 520 + 15 gap + banner 735 = 1270 wrap)
import SelectorCard from './SelectorCard.jsx';
import BannerCarousel from './BannerCarousel.jsx';

export default function Hero() {
  return (
    <section className="bg-card-bg" style={{ backgroundColor: 'var(--color-card-bg)' }}>
      <div className="max-w-[1280px] mx-auto px-5 py-6">
        {/* Live measured: card 520px, gap 15px, banner 735px. Total 1270 → centered in 1280 wrap. */}
        <div
          className="grid items-stretch"
          style={{ gridTemplateColumns: '520px 15px 735px' }}
        >
          <div className="flex">
            <SelectorCard />
          </div>
          <div aria-hidden="true" />
          <div className="flex">
            <BannerCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}
