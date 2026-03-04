import { useMemo } from 'react';
import { Group, Circle, Path } from 'react-konva';
import type { LayoutElement } from '../../../../shared/layout-types.ts';
import type { DragBoundFunc } from '../CanvasElementRenderer.tsx';

interface MoveHandleProps {
  element: LayoutElement;
  onDragEnd: (id: string, x: number, y: number) => void;
  dragBoundFunc?: DragBoundFunc;
}

const HANDLE_RADIUS = 10;
// A simple 4-arrow "move" icon path (12×12 centered at 0,0)
const MOVE_ICON_PATH =
  'M0,-5 L0,-3 M0,3 L0,5 M-5,0 L-3,0 M3,0 L5,0 M0,-5 L-2,-3 M0,-5 L2,-3 M0,5 L-2,3 M0,5 L2,3 M-5,0 L-3,-2 M-5,0 L-3,2 M5,0 L3,-2 M5,0 L3,2';

export function MoveHandle({ element, onDragEnd, dragBoundFunc }: MoveHandleProps) {
  // Position at top-center of element, offset above the bounding box
  const cx = element.x + element.width / 2;
  const cy = element.y - HANDLE_RADIUS - 4;

  // Snap the element's top-left corner, then convert back to handle position
  const handleDragBound: DragBoundFunc | undefined = useMemo(() => {
    if (!dragBoundFunc) return undefined;
    const halfW = element.width / 2;
    return (pos: { x: number; y: number }) => {
      // Convert handle pos to element top-left
      const elX = pos.x - halfW;
      const elY = pos.y + HANDLE_RADIUS + 4;
      // Snap element top-left
      const snapped = dragBoundFunc({ x: elX, y: elY });
      // Convert back to handle pos
      return { x: snapped.x + halfW, y: snapped.y - HANDLE_RADIUS - 4 };
    };
  }, [dragBoundFunc, element.width]);

  return (
    <Group
      x={cx}
      y={cy}
      draggable
      dragBoundFunc={handleDragBound}
      onDragMove={(e) => {
        // While dragging, move the element in real-time
        const node = e.target;
        const newElX = node.x() - element.width / 2;
        const newElY = node.y() + HANDLE_RADIUS + 4;
        onDragEnd(element.id, newElX, newElY);
        // Reset handle position (it will re-render to match element)
      }}
      onDragEnd={(e) => {
        const node = e.target;
        const newElX = node.x() - element.width / 2;
        const newElY = node.y() + HANDLE_RADIUS + 4;
        onDragEnd(element.id, newElX, newElY);
        // Reset to 0,0 since the group re-renders to the new element position
        node.x(cx);
        node.y(cy);
      }}
    >
      <Circle
        radius={HANDLE_RADIUS}
        fill="white"
        stroke="#3B82F6"
        strokeWidth={1.5}
        shadowColor="rgba(0,0,0,0.15)"
        shadowBlur={4}
        shadowOffsetY={1}
      />
      <Path data={MOVE_ICON_PATH} stroke="#3B82F6" strokeWidth={1.5} listening={false} />
    </Group>
  );
}
