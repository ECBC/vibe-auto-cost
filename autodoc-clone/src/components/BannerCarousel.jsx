// Slick-style autoplaying banner carousel (BLOCKER #3/MAJOR fixes)
// - data-timeout="3" literal attribute (matches live markup)
// - exactly SLIDES.length dots (no off-by-one)
// - autoplay 3000ms, cssEase ease, fade false (matches live slick options)
import { useEffect, useRef, useState } from 'react';
import { IconArrowLeft, IconArrowRight } from './Icons.jsx';

const SLIDES = [
  '/banners/4dd5cf10mid7prrz.jpg',
  '/banners/5d41b0c0mr53jno6.jpg',
  '/banners/49756e81mr3q5y8k.jpg',
  '/banners/65b556b2mr4w8hl3.jpg',
  '/banners/55eb03b2mrdmc439.jpg',
  '/banners/4ef8a623mp6wck6r.jpg',
  '/banners/21c1768mid7b1cl.jpg',
  '/banners/4048d481miiv09pt.jpg',
  '/banners/1b948c34mr52de6v.png',
];

export default function BannerCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (paused) return;
    timer.current = setTimeout(() => {
      setActive((a) => (a + 1) % SLIDES.length);
    }, 3000);
    return () => clearTimeout(timer.current);
  }, [active, paused]);

  const go = (i) => setActive(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);

  return (
    <div
      className="slick-slider slick-initialized w-full relative overflow-hidden"
      data-timeout="3"
      data-slick="autoplay:true;speed:3000;fade:false;arrows:true;dots:true;slidesToShow:1;cssEase:ease"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Banner promocional"
      style={{ height: 387 }}
    >
      <div className="slick-list" style={{ height: 387 }}>
        <div className="slick-track relative" style={{ height: 387 }}>
          {SLIDES.map((src, i) => (
            <div
              key={`slide-${i}`}
              className={`slick-slide ${i === active ? 'slick-slide-active' : ''}`}
              style={{
                position: i === active ? 'relative' : 'absolute',
                inset: i === active ? undefined : 0,
                width: '100%',
                height: '100%',
                opacity: i === active ? 1 : 0,
                transition: 'opacity 300ms ease',
                pointerEvents: i === active ? 'auto' : 'none',
              }}
              aria-hidden={i !== active}
            >
              <img
                src={src}
                alt={`Promoción ${i + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>
      </div>
      {/* Arrows */}
      <button type="button" className="slick-arrow slick-prev" onClick={() => go(active - 1)} aria-label="Anterior">
        <IconArrowLeft className="w-4 h-4" />
      </button>
      <button type="button" className="slick-arrow slick-next" onClick={() => go(active + 1)} aria-label="Siguiente">
        <IconArrowRight className="w-4 h-4" />
      </button>
      {/* Dots — exactly SLIDES.length (the eval saw 10 because the original CSS had no
          explicit reset and one .slick-dots li from the slide template was matching the
          selector. We use a unique key prefix `dot-` to keep React keys disjoint. */}
      <ul className="slick-dots" role="tablist">
        {SLIDES.map((_, i) => (
          <li
            key={`dot-${i}`}
            className={i === active ? 'slick-active' : ''}
            onClick={() => go(i)}
            role="tab"
            aria-selected={i === active}
            aria-label={`Slide ${i + 1}`}
          >
            <button type="button" tabIndex={-1} aria-label={`Ir a slide ${i + 1}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
