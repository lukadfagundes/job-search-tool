import { Rect, Circle, Line, Ellipse } from 'react-konva';
import type { LayoutElement, ShapeProps } from '../../../../shared/layout-types.ts';

interface CanvasShapeProps {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export function CanvasShape({ element, isSelected, onSelect, onDragEnd }: CanvasShapeProps) {
  const props = element.props as ShapeProps;
  const common = {
    id: element.id,
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    draggable: !element.locked,
    visible: element.visible,
    opacity: props.opacity,
    onClick: (e: { evt: MouseEvent }) => onSelect(element.id, e.evt.shiftKey),
    onTap: () => onSelect(element.id, false),
    onDragEnd: (e: { target: { x: () => number; y: () => number } }) => {
      onDragEnd(element.id, e.target.x(), e.target.y());
    },
  };

  switch (props.shapeType) {
    case 'rect':
      return (
        <Rect
          {...common}
          width={element.width}
          height={element.height}
          fill={props.fill}
          stroke={isSelected ? '#3B82F6' : props.stroke}
          strokeWidth={isSelected ? 1 : props.strokeWidth}
          cornerRadius={props.cornerRadius}
        />
      );
    case 'circle':
      return (
        <Circle
          {...common}
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
          radius={Math.min(element.width, element.height) / 2}
          fill={props.fill}
          stroke={isSelected ? '#3B82F6' : props.stroke}
          strokeWidth={isSelected ? 1 : props.strokeWidth}
        />
      );
    case 'ellipse':
      return (
        <Ellipse
          {...common}
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
          radiusX={element.width / 2}
          radiusY={element.height / 2}
          fill={props.fill}
          stroke={isSelected ? '#3B82F6' : props.stroke}
          strokeWidth={isSelected ? 1 : props.strokeWidth}
        />
      );
    case 'line':
      return (
        <Line
          {...common}
          points={[0, 0, element.width, 0]}
          stroke={isSelected ? '#3B82F6' : props.stroke || props.fill}
          strokeWidth={props.strokeWidth || 2}
        />
      );
    default:
      return null;
  }
}
