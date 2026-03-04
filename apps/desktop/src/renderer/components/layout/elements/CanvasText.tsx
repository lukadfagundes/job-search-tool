import { useRef, useState, useEffect } from 'react';
import { Group, Text, Rect } from 'react-konva';
import type Konva from 'konva';
import type { LayoutElement, TextProps } from '../../../../shared/layout-types.ts';
import type { DragBoundFunc } from '../CanvasElementRenderer.tsx';

export const DEFAULT_PAD_H = 4;
export const DEFAULT_PAD_V = 2;

interface CanvasTextProps {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDblClick: (id: string) => void;
  dragBoundFunc?: DragBoundFunc;
}

export function CanvasText({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onDblClick,
  dragBoundFunc,
}: CanvasTextProps) {
  const props = element.props as TextProps;
  const [padH, padV] = props.padding ?? [DEFAULT_PAD_H, DEFAULT_PAD_V];
  const autoFit = props.autoFit !== false; // default true

  const textRef = useRef<Konva.Text>(null);
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null);

  // Measure text after render when auto-fit is enabled
  useEffect(() => {
    if (!autoFit || !textRef.current) return;
    const node = textRef.current;
    const tw = node.getTextWidth();
    const th = node.height();
    setMeasured({ w: tw, h: th });
  }, [
    props.text,
    props.fontFamily,
    props.fontSize,
    props.fontStyle,
    props.lineHeight,
    props.letterSpacing,
    autoFit,
    element.width,
  ]);

  // Max inner width for text wrapping
  const maxInnerW = Math.max(1, element.width - padH * 2);

  // Calculate visual dimensions
  let visualWidth: number;
  let visualHeight: number;

  if (autoFit && measured) {
    visualWidth = Math.min(measured.w, maxInnerW) + padH * 2;
    visualHeight = measured.h + padV * 2;
  } else {
    visualWidth = element.width;
    visualHeight = element.height;
  }

  // Alignment offset — position the auto-sized box within element.width
  let offsetX = 0;
  if (autoFit && measured) {
    if (props.align === 'center') {
      offsetX = (element.width - visualWidth) / 2;
    } else if (props.align === 'right') {
      offsetX = element.width - visualWidth;
    }
  }

  return (
    <Group
      id={element.id}
      x={element.x + offsetX}
      y={element.y}
      width={visualWidth}
      height={visualHeight}
      rotation={element.rotation}
      draggable={!element.locked}
      visible={element.visible}
      dragBoundFunc={dragBoundFunc}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={() => onSelect(element.id, false)}
      onDblClick={() => onDblClick(element.id)}
      onDblTap={() => onDblClick(element.id)}
      onDragEnd={(e) => {
        // Adjust stored position to account for alignment offset
        onDragEnd(element.id, e.target.x() - offsetX, e.target.y());
      }}
    >
      {/* Hit area matching the auto-sized bounds */}
      <Rect
        width={visualWidth}
        height={visualHeight}
        fill="transparent"
        stroke={isSelected ? '#3B82F6' : undefined}
        strokeWidth={isSelected ? 0.5 : 0}
      />
      {/* Text rendered with padding offset; no height constraint in auto-fit mode */}
      <Text
        ref={textRef}
        x={padH}
        y={padV}
        width={maxInnerW}
        {...(!autoFit && { height: Math.max(1, element.height - padV * 2) })}
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
