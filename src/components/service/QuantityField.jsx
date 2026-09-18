import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const sanitizeQuantity = (value) => {
  const next = String(value).replace(',', '.');
  if (next === '' || /^\d*\.?\d*$/.test(next)) return next;
  return null;
};

const QuantityField = ({ value, onChange, className = '', touch = false }) => {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const placePanel = () => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const width = Math.min(360, Math.max(rect.width, touch ? 320 : 280));
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const estimatedHeight = touch ? 220 : 180;
    const below = rect.bottom + 8;
    const top = below + estimatedHeight > window.innerHeight - 8
      ? Math.max(8, rect.top - estimatedHeight - 8)
      : below;
    setPanelStyle({ top, left, width });
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    placePanel();
    const onReflow = () => placePanel();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, touch]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      const target = event.target;
      if (inputRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const handleChange = (event) => {
    const next = sanitizeQuantity(event.target.value);
    if (next !== null) onChange(next);
  };

  const choosePreset = (number) => {
    onChange(String(number));
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={value}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onChange={handleChange}
        placeholder="Qty"
        aria-label="Quantity"
        aria-expanded={open}
        className={className}
      />
      {open && panelStyle
        ? createPortal(
          <div
            ref={panelRef}
            className="rounded-2xl border border-stone-200 bg-white p-3 shadow-xl dark:border-stone-600 dark:bg-stone-900"
            style={{ position: 'fixed', zIndex: 2147483646, ...panelStyle }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Quantity</p>
            <div className="grid grid-cols-5 gap-2">
              {PRESETS.map((number) => {
                const selected = Number(value) === number && String(value).indexOf('.') === -1;
                return (
                  <button
                    key={number}
                    type="button"
                    onClick={() => choosePreset(number)}
                    className={`rounded-xl font-semibold ${
                      touch ? 'min-h-14 text-lg' : 'min-h-11 text-base'
                    } ${
                      selected
                        ? 'bg-emerald-600 text-white'
                        : 'border border-stone-300 bg-stone-50 text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100'
                    }`}
                  >
                    {number}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-stone-500">Or type any amount, including decimals.</p>
          </div>,
          document.body
        )
        : null}
    </>
  );
};

export default QuantityField;
