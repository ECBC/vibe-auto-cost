// Selector card (BLOCKER #2/#5/#6/#10 fix): license-plate mini-search + 3-step cascade
// + Buscar CTA. The Buscar CTA is ALWAYS bright blue #0068D7 (hover #0074F1),
// matching the live site — even when no selection is made. Height: 48px, radius: 1.86px.
import { useState } from 'react';
import { MAKES } from '../data/makes.js';
import { MODELS } from '../data/models.js';
import { ENGINES } from '../data/engines.js';
import { useSelection } from '../state/SelectionContext.jsx';
import StepDropdown from './StepDropdown.jsx';

export default function SelectorCard() {
  const { selection, setMake, setModel, setEngine, reset } = useSelection();
  const [plate, setPlate] = useState('');
  const [ctaHover, setCtaHover] = useState(false);

  const makeOptions = MAKES;
  const makeId = MAKES.find((m) => m.name === selection.make)?.id;
  const modelOptions = makeId ? MODELS[makeId] || [] : [];
  const modelId = makeId ? MODELS[makeId]?.find((m) => m.name === selection.model)?.id : null;
  const engineOptions = modelId ? ENGINES[modelId] || [] : [];

  const canSearch = !!(selection.make && selection.model && selection.engine);
  const canSearchPlate = plate.trim().length >= 4;

  // CTA color: always blue; hover variant is only a visual change (not a disabled state).
  const ctaBg = ctaHover ? '#0074F1' : '#0068D7';

  return (
    <div
      className="w-full max-w-[520px] p-6"
      style={{ backgroundColor: '#F9FAFB', borderRadius: '5px' }}
    >
      {/* License-plate mini-search */}
      <div className="mb-6">
        <div className="text-[14px] font-semibold text-body-text mb-2">Buscar modelo de coche por matrícula</div>
        <div className="flex items-stretch gap-0">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 48, height: 48, backgroundColor: '#003AAB', color: '#FFFFFF', borderRadius: '2px 0 0 2px' }}
            aria-label="España"
          >
            <span className="text-[14px] font-bold">E</span>
          </div>
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="1234-ABC"
            maxLength={12}
            aria-label="Matrícula"
            className="flex-1 outline-none text-[14px] text-body-text"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #C4D0D8',
              borderLeft: 'none',
              borderRadius: '0',
              height: 48,
              fontWeight: 500,
            }}
          />
          <button
            type="button"
            disabled={!canSearchPlate}
            onClick={() => canSearchPlate && alert(`Buscar por matrícula: ${plate}`)}
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            className="text-white font-semibold text-[13px] tracking-wide transition-colors"
            style={{
              fontFamily: 'Montserrat, Arial, sans-serif',
              backgroundColor: canSearchPlate ? ctaBg : '#9C9C9C',
              borderRadius: '0 1.86px 1.86px 0',
              padding: '0 24px',
              height: 48,
              cursor: canSearchPlate ? 'pointer' : 'not-allowed',
            }}
          >
            Buscar
          </button>
        </div>
      </div>

      {/* 3-step cascade */}
      <div className="mb-4">
        <div className="text-[14px] text-body-text mb-3 leading-snug">
          Seleccione su modelo de coche para buscar recambios de coches
        </div>
        <div className="space-y-2">
          <StepDropdown
            index={1}
            label="Elija una marca"
            value={selection.make}
            options={makeOptions}
            onSelect={setMake}
          />
          <StepDropdown
            index={2}
            label="Elija un modelo"
            value={selection.model}
            options={modelOptions}
            disabled={!selection.make}
            onSelect={setModel}
          />
          <StepDropdown
            index={3}
            label="Elija un tipo de motor"
            value={selection.engine}
            options={engineOptions}
            disabled={!selection.model}
            onSelect={setEngine}
          />
        </div>
      </div>

      {/* Bottom Buscar (ALWAYS bright blue; hover -> lighter blue) */}
      <button
        type="button"
        disabled={!canSearch}
        onClick={() => canSearch && alert(`Buscar: ${selection.make} / ${selection.model} / ${selection.engine}`)}
        onMouseEnter={() => setCtaHover(true)}
        onMouseLeave={() => setCtaHover(false)}
        className="w-full text-white font-semibold text-[13px] tracking-wide transition-colors"
        style={{
          fontFamily: 'Montserrat, Arial, sans-serif',
          backgroundColor: ctaBg,
          borderRadius: '1.86px',
          padding: '0 24px',
          height: 48,
          opacity: 1, // NEVER visually disabled at first paint
          cursor: canSearch ? 'pointer' : 'not-allowed',
        }}
      >
        Buscar
      </button>

      {/* Footer link */}
      <div className="mt-4 text-center">
        <a href="#" className="text-[12px] hover:underline" style={{ color: '#0068D7' }}>
          ¿SU COCHE NO SE ENCUENTRA PRESENTE EN EL CATALÓGO?
        </a>
      </div>

      {selection.make && (
        <button onClick={reset} className="mt-3 text-[12px] text-gray-muted hover:underline">
          Restablecer selección
        </button>
      )}
    </div>
  );
}
