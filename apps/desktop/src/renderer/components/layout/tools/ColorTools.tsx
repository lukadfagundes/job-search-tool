import type {
  LayoutElement,
  TextProps,
  ShapeProps,
  IconProps,
} from '../../../../shared/layout-types.ts';
import { RESUME_COLORS } from '../../../../shared/layout-types.ts';

interface ColorToolsProps {
  selectedElement: LayoutElement | null;
  onUpdateElement: (id: string, updates: Partial<LayoutElement>) => void;
}

const presetColors = [
  RESUME_COLORS.navy,
  RESUME_COLORS.darkText,
  RESUME_COLORS.mutedText,
  RESUME_COLORS.lightGray,
  RESUME_COLORS.white,
  RESUME_COLORS.accent,
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#6366F1',
  '#EC4899',
  '#8B5CF6',
  '#14B8A6',
  '#F97316',
  '#64748B',
  '#1E293B',
  '#0EA5E9',
  '#84CC16',
];

export function ColorTools({ selectedElement, onUpdateElement }: ColorToolsProps) {
  const getCurrentFill = (): string => {
    if (!selectedElement) return '#000000';
    const props = selectedElement.props;
    if ('fill' in props) return (props as TextProps | ShapeProps | IconProps).fill;
    return '#000000';
  };

  const getCurrentStroke = (): string => {
    if (!selectedElement) return '#000000';
    const props = selectedElement.props;
    if ('stroke' in props) return (props as ShapeProps).stroke;
    return '#000000';
  };

  const getCurrentOpacity = (): number => {
    if (!selectedElement) return 1;
    const props = selectedElement.props;
    if ('opacity' in props) return (props as ShapeProps).opacity;
    return 1;
  };

  const setFill = (color: string) => {
    if (!selectedElement) return;
    onUpdateElement(selectedElement.id, {
      props: { ...selectedElement.props, fill: color },
    });
  };

  const setStroke = (color: string) => {
    if (!selectedElement) return;
    if ('stroke' in selectedElement.props) {
      onUpdateElement(selectedElement.id, {
        props: { ...selectedElement.props, stroke: color },
      });
    }
  };

  const setOpacity = (opacity: number) => {
    if (!selectedElement) return;
    if ('opacity' in selectedElement.props) {
      onUpdateElement(selectedElement.id, {
        props: { ...selectedElement.props, opacity },
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Color Palette
        </p>
        <div className="grid grid-cols-6 gap-1.5">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => setFill(color)}
              className="w-8 h-8 rounded-md border-2 border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {selectedElement && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Fill Color
            </p>
            <input
              type="color"
              value={getCurrentFill()}
              onChange={(e) => setFill(e.target.value)}
              className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
          </div>

          {'stroke' in selectedElement.props && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Stroke Color
              </p>
              <input
                type="color"
                value={getCurrentStroke()}
                onChange={(e) => setStroke(e.target.value)}
                className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
          )}

          {'opacity' in selectedElement.props && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Opacity: {Math.round(getCurrentOpacity() * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={getCurrentOpacity()}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </>
      )}

      {!selectedElement && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          Select an element to edit its colors
        </p>
      )}
    </div>
  );
}
