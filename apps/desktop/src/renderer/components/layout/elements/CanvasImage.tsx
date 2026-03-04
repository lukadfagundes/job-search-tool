import { Image as KonvaImage, Group, Circle as KonvaCircle } from 'react-konva';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { LayoutElement, ImageProps } from '../../../../shared/layout-types.ts';
import type { DragBoundFunc } from '../CanvasElementRenderer.tsx';

interface CanvasImageProps {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  dragBoundFunc?: DragBoundFunc;
}

export function CanvasImage({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  dragBoundFunc,
}: CanvasImageProps) {
  const props = element.props as ImageProps;
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // For center-positioned placeholder circle: snap top-left corner, convert back to center
  const centerDragBound: DragBoundFunc | undefined = useMemo(() => {
    if (!dragBoundFunc) return undefined;
    const halfW = element.width / 2;
    const halfH = element.height / 2;
    return (pos: { x: number; y: number }) => {
      const snapped = dragBoundFunc({ x: pos.x - halfW, y: pos.y - halfH });
      return { x: snapped.x + halfW, y: snapped.y + halfH };
    };
  }, [dragBoundFunc, element.width, element.height]);

  useEffect(() => {
    if (!props.src) return;
    const img = new window.Image();
    img.src = props.src;
    img.onload = () => {
      imgRef.current = img;
      setImage(img);
    };
    return () => {
      img.onload = null;
    };
  }, [props.src]);

  if (!image) {
    // Placeholder
    return (
      <KonvaCircle
        id={element.id}
        x={element.x + element.width / 2}
        y={element.y + element.height / 2}
        radius={Math.min(element.width, element.height) / 2}
        fill="#D1D5DB"
        stroke={isSelected ? '#3B82F6' : '#9CA3AF'}
        strokeWidth={isSelected ? 2 : 1}
        draggable={!element.locked}
        visible={element.visible}
        dragBoundFunc={centerDragBound}
        onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
        onTap={() => onSelect(element.id, false)}
        onDragEnd={(e) =>
          onDragEnd(element.id, e.target.x() - element.width / 2, e.target.y() - element.height / 2)
        }
      />
    );
  }

  if (props.clipCircle) {
    const radius = Math.min(element.width, element.height) / 2;
    return (
      <Group
        x={element.x}
        y={element.y}
        draggable={!element.locked}
        visible={element.visible}
        dragBoundFunc={dragBoundFunc}
        onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
        onTap={() => onSelect(element.id, false)}
        onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
        clipFunc={(ctx) => {
          ctx.arc(element.width / 2, element.height / 2, radius, 0, Math.PI * 2, false);
        }}
      >
        <KonvaImage
          id={element.id}
          image={image}
          width={element.width}
          height={element.height}
          opacity={props.opacity}
        />
      </Group>
    );
  }

  return (
    <KonvaImage
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      image={image}
      opacity={props.opacity}
      cornerRadius={props.cornerRadius}
      draggable={!element.locked}
      visible={element.visible}
      dragBoundFunc={dragBoundFunc}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={() => onSelect(element.id, false)}
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      stroke={isSelected ? '#3B82F6' : undefined}
      strokeWidth={isSelected ? 1 : 0}
    />
  );
}
