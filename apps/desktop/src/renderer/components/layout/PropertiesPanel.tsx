import { useRef, useCallback, useEffect, useState } from 'react';
import type { LayoutElement } from '../../../shared/layout-types.ts';

/* ─── DragInput ────────────────────────────────────────────────
   A numeric input that also supports click-hold-drag to scrub
   the value left/right. Dragging left decreases, right increases.
   ───────────────────────────────────────────────────────────── */

interface DragInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  label: string;
  className?: string;
}

function DragInput({ value, onChange, min, step = 1, label, className }: DragInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragging = useRef(false);
  const pending = useRef(false);
  const startX = useRef(0);
  const startVal = useRef(0);
  const DRAG_THRESHOLD = 3;

  // Label drag — starts immediately (no threshold needed)
  const handleLabelMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startVal.current = value;
      document.body.style.cursor = 'ew-resize';
    },
    [value]
  );

  // Input drag — uses threshold so click-to-focus still works
  const handleInputMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      pending.current = true;
      startX.current = e.clientX;
      startVal.current = value;
    },
    [value]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (pending.current && !dragging.current) {
        if (Math.abs(e.clientX - startX.current) >= DRAG_THRESHOLD) {
          dragging.current = true;
          pending.current = false;
          document.body.style.cursor = 'ew-resize';
          inputRef.current?.blur();
        } else {
          return;
        }
      }
      if (!dragging.current) return;
      const dx = e.clientX - startX.current;
      const newVal = startVal.current + Math.round(dx / 2) * step;
      onChange(min !== undefined ? Math.max(min, newVal) : newVal);
    };

    const handleMouseUp = () => {
      pending.current = false;
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onChange, min, step]);

  return (
    <div>
      <label
        className="block text-[10px] text-gray-400 mb-0.5 cursor-ew-resize select-none"
        onMouseDown={handleLabelMouseDown}
      >
        {label}
      </label>
      <input
        ref={inputRef}
        type="number"
        value={Math.round(value)}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(min !== undefined ? Math.max(min, v) : v);
        }}
        onMouseDown={handleInputMouseDown}
        min={min}
        step={step}
        className={className + ' cursor-ew-resize'}
      />
    </div>
  );
}

/* ─── PropertiesPanel ──────────────────────────────────────── */

interface PropertiesPanelProps {
  selectedElement: LayoutElement | null;
  onUpdateElement: (id: string, updates: Partial<LayoutElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
}

export function PropertiesPanel({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onBringToFront,
  onSendToBack,
}: PropertiesPanelProps) {
  const [rotationText, setRotationText] = useState('');

  // Sync rotationText when element changes
  useEffect(() => {
    if (selectedElement) {
      setRotationText(String(Math.round(selectedElement.rotation)));
    }
  }, [selectedElement?.id, selectedElement?.rotation]);

  if (!selectedElement) {
    return (
      <div className="w-56 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center italic">
          Select an element to
          <br />
          view its properties
        </p>
      </div>
    );
  }

  const el = selectedElement;
  const inputClass =
    'w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white';

  return (
    <div className="w-56 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {el.type.charAt(0).toUpperCase() + el.type.slice(1)} Properties
        </p>
      </div>

      <div className="p-3 space-y-3">
        {/* Position */}
        <div>
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Position
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <DragInput
              label="X"
              value={el.x}
              onChange={(v) => onUpdateElement(el.id, { x: v })}
              className={inputClass}
            />
            <DragInput
              label="Y"
              value={el.y}
              onChange={(v) => onUpdateElement(el.id, { y: v })}
              className={inputClass}
            />
          </div>
        </div>

        {/* Size */}
        <div>
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Size
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <DragInput
              label="W"
              value={el.width}
              min={5}
              onChange={(v) => onUpdateElement(el.id, { width: v })}
              className={inputClass}
            />
            <DragInput
              label="H"
              value={el.height}
              min={5}
              onChange={(v) => onUpdateElement(el.id, { height: v })}
              className={inputClass}
            />
          </div>
        </div>

        {/* Rotation */}
        <div>
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Rotation
          </p>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={el.rotation}
              onChange={(e) => onUpdateElement(el.id, { rotation: Number(e.target.value) })}
              className="flex-1"
            />
            <div className="relative w-14">
              <input
                type="text"
                value={rotationText}
                onChange={(e) => setRotationText(e.target.value)}
                onBlur={() => {
                  const v = Number(rotationText);
                  if (!isNaN(v)) {
                    const clamped = Math.max(-180, Math.min(180, Math.round(v)));
                    onUpdateElement(el.id, { rotation: clamped });
                    setRotationText(String(clamped));
                  } else {
                    setRotationText(String(Math.round(el.rotation)));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                className="w-full px-1.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                °
              </span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={el.locked}
              onChange={(e) => onUpdateElement(el.id, { locked: e.target.checked })}
              className="rounded border-gray-300"
            />
            Locked
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={el.visible}
              onChange={(e) => onUpdateElement(el.id, { visible: e.target.checked })}
              className="rounded border-gray-300"
            />
            Visible
          </label>
        </div>

        {/* Layer controls */}
        <div>
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Layer
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onBringToFront(el.id)}
              className="px-2 py-1 text-[10px] font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Bring Front
            </button>
            <button
              onClick={() => onSendToBack(el.id)}
              className="px-2 py-1 text-[10px] font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Send Back
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1.5">
          <button
            onClick={() => onDuplicateElement(el.id)}
            className="w-full px-2 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Duplicate
          </button>
          <button
            onClick={() => onDeleteElement(el.id)}
            className="w-full px-2 py-1.5 text-xs font-medium rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
