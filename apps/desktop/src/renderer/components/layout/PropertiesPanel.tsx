import type { LayoutElement } from '../../../shared/layout-types.ts';

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
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">X</label>
              <input
                type="number"
                value={Math.round(el.x)}
                onChange={(e) => onUpdateElement(el.id, { x: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">Y</label>
              <input
                type="number"
                value={Math.round(el.y)}
                onChange={(e) => onUpdateElement(el.id, { y: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Size
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">W</label>
              <input
                type="number"
                value={Math.round(el.width)}
                onChange={(e) =>
                  onUpdateElement(el.id, { width: Math.max(5, Number(e.target.value)) })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">H</label>
              <input
                type="number"
                value={Math.round(el.height)}
                onChange={(e) =>
                  onUpdateElement(el.id, { height: Math.max(5, Number(e.target.value)) })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Rotation: {Math.round(el.rotation)}°
          </label>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={el.rotation}
            onChange={(e) => onUpdateElement(el.id, { rotation: Number(e.target.value) })}
            className="w-full"
          />
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
