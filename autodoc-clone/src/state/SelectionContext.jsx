import { createContext, useContext, useState, useCallback } from 'react';

const SelectionContext = createContext(null);

export function SelectionProvider({ children }) {
  const [selection, setSelection] = useState({ make: null, model: null, engine: null });
  const setMake = useCallback((m) => setSelection({ make: m, model: null, engine: null }), []);
  const setModel = useCallback((m) => setSelection((s) => ({ ...s, model: m, engine: null })), []);
  const setEngine = useCallback((e) => setSelection((s) => ({ ...s, engine: e })), []);
  const reset = useCallback(() => setSelection({ make: null, model: null, engine: null }), []);
  return (
    <SelectionContext.Provider value={{ selection, setMake, setModel, setEngine, reset }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be used within SelectionProvider');
  return ctx;
}
