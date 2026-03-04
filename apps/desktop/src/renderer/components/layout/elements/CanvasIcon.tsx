import { Image as KonvaImage, Rect } from 'react-konva';
import { useState, useEffect, useRef } from 'react';
import type { LayoutElement, IconProps } from '../../../../shared/layout-types.ts';

interface CanvasIconProps {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

function buildSvgDataUrl(props: IconProps, size: number): string {
  const viewBox = props.viewBox || '0 0 24 24';
  const isFilled = props.filled ?? false;
  const color = props.fill || '#000000';

  const svgAttrs = isFilled
    ? `fill="${color}" stroke="none"`
    : `fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}" ${svgAttrs}><path d="${props.path}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function CanvasIcon({ element, isSelected, onSelect, onDragEnd }: CanvasIconProps) {
  const props = element.props as IconProps;
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const prevKey = useRef('');

  // Render size — use higher resolution for crisp icons
  const renderSize = Math.max(element.width, element.height) * 4;

  useEffect(() => {
    const key = `${props.path}|${props.fill}|${props.filled}|${props.viewBox}|${renderSize}`;
    if (key === prevKey.current) return;
    prevKey.current = key;

    const dataUrl = buildSvgDataUrl(props, renderSize);
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = dataUrl;
    return () => {
      img.onload = null;
    };
  }, [props.path, props.fill, props.filled, props.viewBox, renderSize, props]);

  if (!image) {
    // Placeholder rect while loading
    return (
      <Rect
        id={element.id}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        fill="transparent"
        stroke="#D1D5DB"
        strokeWidth={0.5}
        rotation={element.rotation}
        draggable={!element.locked}
        visible={element.visible}
        onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
        onTap={() => onSelect(element.id, false)}
        onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      />
    );
  }

  return (
    <KonvaImage
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      image={image}
      rotation={element.rotation}
      draggable={!element.locked}
      visible={element.visible}
      stroke={isSelected ? '#3B82F6' : undefined}
      strokeWidth={isSelected ? 1 : 0}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={() => onSelect(element.id, false)}
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
    />
  );
}
