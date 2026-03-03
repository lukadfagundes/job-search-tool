import { Path } from 'react-konva';
import type { LayoutElement, IconProps } from '../../../../shared/layout-types.ts';

interface CanvasIconProps {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export function CanvasIcon({ element, isSelected, onSelect, onDragEnd }: CanvasIconProps) {
  const props = element.props as IconProps;

  // Scale the SVG path (designed for 24x24) to fit element dimensions
  const scaleX = element.width / 24;
  const scaleY = element.height / 24;

  return (
    <Path
      id={element.id}
      x={element.x}
      y={element.y}
      data={props.path}
      fill={props.fill}
      scaleX={scaleX}
      scaleY={scaleY}
      rotation={element.rotation}
      draggable={!element.locked}
      visible={element.visible}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={() => onSelect(element.id, false)}
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      stroke={isSelected ? '#3B82F6' : undefined}
      strokeWidth={isSelected ? 1 : 0}
    />
  );
}
