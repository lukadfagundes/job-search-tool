import { Line } from 'react-konva';
import type { LayoutElement, DividerProps } from '../../../../shared/layout-types.ts';

interface CanvasDividerProps {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export function CanvasDivider({ element, isSelected, onSelect, onDragEnd }: CanvasDividerProps) {
  const props = element.props as DividerProps;
  const isHorizontal = props.orientation === 'horizontal';

  const points = isHorizontal ? [0, 0, element.width, 0] : [0, 0, 0, element.height];

  return (
    <Line
      id={element.id}
      x={element.x}
      y={element.y}
      points={points}
      stroke={isSelected ? '#3B82F6' : props.stroke}
      strokeWidth={props.strokeWidth}
      dash={props.dashEnabled ? props.dash : undefined}
      draggable={!element.locked}
      visible={element.visible}
      hitStrokeWidth={10}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={() => onSelect(element.id, false)}
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
    />
  );
}
