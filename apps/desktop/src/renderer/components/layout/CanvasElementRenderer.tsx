import type { LayoutElement } from '../../../shared/layout-types.ts';
import { CanvasText } from './elements/CanvasText.tsx';
import { CanvasShape } from './elements/CanvasShape.tsx';
import { CanvasImage } from './elements/CanvasImage.tsx';
import { CanvasDivider } from './elements/CanvasDivider.tsx';
import { CanvasIcon } from './elements/CanvasIcon.tsx';

interface CanvasElementRendererProps {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDblClick: (id: string) => void;
}

export function CanvasElementRenderer({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onDblClick,
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
        />
      );
    case 'shape':
      return (
        <CanvasShape
          element={element}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      );
    case 'image':
      return (
        <CanvasImage
          element={element}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      );
    case 'divider':
      return (
        <CanvasDivider
          element={element}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      );
    case 'icon':
      return (
        <CanvasIcon
          element={element}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
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
        />
      );
    default:
      return null;
  }
}
