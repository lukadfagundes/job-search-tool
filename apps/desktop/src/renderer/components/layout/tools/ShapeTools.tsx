import type { LayoutElement, ShapeProps, DividerProps } from '../../../../shared/layout-types.ts';
import { RESUME_COLORS, CANVAS_WIDTH } from '../../../../shared/layout-types.ts';

interface ShapeToolsProps {
  onAddElement: (element: Omit<LayoutElement, 'id' | 'zIndex'>) => void;
}

const shapes: { label: string; type: ShapeProps['shapeType']; width: number; height: number }[] = [
  { label: 'Rectangle', type: 'rect', width: 120, height: 80 },
  { label: 'Square', type: 'rect', width: 80, height: 80 },
  { label: 'Circle', type: 'circle', width: 80, height: 80 },
  { label: 'Ellipse', type: 'ellipse', width: 120, height: 60 },
  { label: 'Line', type: 'line', width: 120, height: 0 },
];

export function ShapeTools({ onAddElement }: ShapeToolsProps) {
  const addShape = (shape: (typeof shapes)[number]) => {
    onAddElement({
      type: 'shape',
      x: CANVAS_WIDTH / 2 - shape.width / 2,
      y: 200,
      width: shape.width,
      height: shape.height || 2,
      rotation: 0,
      locked: false,
      visible: true,
      props: {
        shapeType: shape.type,
        fill: shape.type === 'line' ? 'transparent' : RESUME_COLORS.navy,
        stroke: RESUME_COLORS.navy,
        strokeWidth: shape.type === 'line' ? 2 : 0,
        opacity: 1,
        cornerRadius: 0,
      } as ShapeProps,
    });
  };

  const addDivider = (orientation: 'horizontal' | 'vertical') => {
    onAddElement({
      type: 'divider',
      x: orientation === 'horizontal' ? CANVAS_WIDTH / 2 - 100 : CANVAS_WIDTH / 2,
      y: 200,
      width: orientation === 'horizontal' ? 200 : 1,
      height: orientation === 'horizontal' ? 1 : 100,
      rotation: 0,
      locked: false,
      visible: true,
      props: {
        orientation,
        stroke: RESUME_COLORS.navy,
        strokeWidth: 1,
        dashEnabled: false,
        dash: [],
      } as DividerProps,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Shapes
        </p>
        <div className="grid grid-cols-2 gap-2">
          {shapes.map((shape) => (
            <button
              key={shape.label}
              onClick={() => addShape(shape)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                {shape.type === 'rect' && (
                  <div
                    className="bg-blue-500"
                    style={{
                      width: shape.width === shape.height ? 20 : 28,
                      height: shape.width === shape.height ? 20 : 16,
                      borderRadius: 2,
                    }}
                  />
                )}
                {shape.type === 'circle' && <div className="w-5 h-5 bg-blue-500 rounded-full" />}
                {shape.type === 'ellipse' && <div className="w-7 h-4 bg-blue-500 rounded-full" />}
                {shape.type === 'line' && <div className="w-7 h-0.5 bg-blue-500" />}
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-400">{shape.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Dividers
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => addDivider('horizontal')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-0.5 bg-gray-500" />
            <span className="text-[10px] text-gray-600 dark:text-gray-400">Horizontal</span>
          </button>
          <button
            onClick={() => addDivider('vertical')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-0.5 h-6 bg-gray-500" />
            <span className="text-[10px] text-gray-600 dark:text-gray-400">Vertical</span>
          </button>
        </div>
      </div>
    </div>
  );
}
