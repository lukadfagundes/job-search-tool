import { Group, Text, Rect } from 'react-konva';
import type { LayoutElement, TextProps } from '../../../../shared/layout-types.ts';

const DEFAULT_PAD_H = 20;
const DEFAULT_PAD_V = 10;

interface CanvasTextProps {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDblClick: (id: string) => void;
}

export function CanvasText({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onDblClick,
}: CanvasTextProps) {
  const props = element.props as TextProps;
  const [padH, padV] = props.padding ?? [DEFAULT_PAD_H, DEFAULT_PAD_V];

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      draggable={!element.locked}
      visible={element.visible}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={() => onSelect(element.id, false)}
      onDblClick={() => onDblClick(element.id)}
      onDblTap={() => onDblClick(element.id)}
      onDragEnd={(e) => {
        onDragEnd(element.id, e.target.x(), e.target.y());
      }}
    >
      {/* Invisible hit area matching the full element bounds */}
      <Rect
        width={element.width}
        height={element.height}
        fill="transparent"
        stroke={isSelected ? '#3B82F6' : undefined}
        strokeWidth={isSelected ? 0.5 : 0}
      />
      {/* Text rendered with padding offset */}
      <Text
        x={padH}
        y={padV}
        width={Math.max(1, element.width - padH * 2)}
        height={Math.max(1, element.height - padV * 2)}
        text={props.text}
        fontFamily={props.fontFamily}
        fontSize={props.fontSize}
        fontStyle={props.fontStyle === 'bold italic' ? 'bold italic' : props.fontStyle}
        textDecoration={props.textDecoration === 'underline' ? 'underline' : ''}
        fill={props.fill}
        align={props.align}
        lineHeight={props.lineHeight}
        letterSpacing={props.letterSpacing}
        listening={false}
      />
    </Group>
  );
}
