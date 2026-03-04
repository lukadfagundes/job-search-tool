import type { LayoutElement } from '../../../shared/layout-types.ts';
import { CanvasText } from './elements/CanvasText.tsx';
import { CanvasShape } from './elements/CanvasShape.tsx';
import { CanvasImage } from './elements/CanvasImage.tsx';
import { CanvasDivider } from './elements/CanvasDivider.tsx';
import { CanvasIcon } from './elements/CanvasIcon.tsx';

export type DragBoundFunc = (pos: { x: number; y: number }) => { x: number; y: number };

interface CanvasElementRendererProps {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDblClick: (id: string) => void;
  dragBoundFunc?: DragBoundFunc;
}

export function CanvasElementRenderer({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onDblClick,
  dragBoundFunc,
}: CanvasElementRendererProps) {
  if (!element.visible) return null;

  switch (element.type) {
    case 'text':
      return (
        <CanvasText
          element={element}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          onDblClick={onDblClick}
          dragBoundFunc={dragBoundFunc}
        />
      );
    case 'shape':
      return (
        <CanvasShape
          element={element}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          dragBoundFunc={dragBoundFunc}
        />
      );
    case 'image':
      return (
        <CanvasImage
          element={element}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          dragBoundFunc={dragBoundFunc}
        />
      );
    case 'divider':
      return (
        <CanvasDivider
          element={element}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          dragBoundFunc={dragBoundFunc}
        />
      );
    case 'icon':
      return (
        <CanvasIcon
          element={element}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          dragBoundFunc={dragBoundFunc}
        />
      );
    case 'section':
      // Sections are rendered as groups of child elements; for now render as transparent rect
      return (
        <CanvasShape
          element={{
            ...element,
            type: 'shape',
            props: {
              shapeType: 'rect' as const,
              fill: 'transparent',
              stroke: isSelected ? '#3B82F6' : 'transparent',
              strokeWidth: isSelected ? 1 : 0,
              opacity: 1,
              cornerRadius: 0,
            },
          }}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          dragBoundFunc={dragBoundFunc}
        />
      );
    default:
      return null;
  }
}
