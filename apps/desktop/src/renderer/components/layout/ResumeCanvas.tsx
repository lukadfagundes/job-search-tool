import { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { LayoutElement } from '../../../shared/layout-types.ts';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../shared/layout-types.ts';
import { CanvasElementRenderer } from './CanvasElementRenderer.tsx';
import { MoveHandle } from './elements/MoveHandle.tsx';

interface ResumeCanvasProps {
  elements: LayoutElement[];
  selectedIds: string[];
  zoom: number;
  backgroundColor: string;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDeselectAll: () => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (
    id: string,
    attrs: { x: number; y: number; width: number; height: number; rotation: number }
  ) => void;
  onDblClick: (id: string) => void;
  onWheel: (deltaY: number) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function ResumeCanvas({
  elements,
  selectedIds,
  zoom,
  backgroundColor,
  showGrid,
  snapToGrid,
  gridSize,
  onSelect,
  onDeselectAll,
  onDragEnd,
  onTransformEnd,
  onDblClick,
  onWheel,
  stageRef,
}: ResumeCanvasProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Update transformer when selection changes
  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;

    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((node): node is Konva.Node => node !== null && node !== undefined);

    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, stageRef]);

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Click on empty area
      if (e.target === e.target.getStage()) {
        onDeselectAll();
      }
    },
    [onDeselectAll]
  );

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const id = node.id();
      if (!id) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale and adjust width/height
      node.scaleX(1);
      node.scaleY(1);

      onTransformEnd(id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      });
    },
    [onTransformEnd]
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      onWheel(e.evt.deltaY);
    },
    [onWheel]
  );

  // Ctrl+click panning on the container
  const handleContainerMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      setIsPanning(true);
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
      };
    }
  }, []);

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      container.scrollLeft = panStart.current.scrollLeft - dx;
      container.scrollTop = panStart.current.scrollTop - dy;
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  // Snap coordinates to grid when grid snapping is enabled
  const snapDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      if (snapToGrid) {
        const snappedX = Math.round(x / gridSize) * gridSize;
        const snappedY = Math.round(y / gridSize) * gridSize;
        onDragEnd(id, snappedX, snappedY);
      } else {
        onDragEnd(id, x, y);
      }
    },
    [snapToGrid, gridSize, onDragEnd]
  );

  // Sort elements by zIndex
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  // Find single selected element for move handle
  const singleSelectedEl =
    selectedIds.length === 1 ? elements.find((e) => e.id === selectedIds[0]) : undefined;

  const stageWidth = CANVAS_WIDTH * zoom;
  const stageHeight = CANVAS_HEIGHT * zoom;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-700"
      style={{ cursor: isPanning ? 'grabbing' : undefined }}
      onMouseDown={handleContainerMouseDown}
    >
      <div
        className="flex items-start justify-center p-8"
        style={{ minWidth: stageWidth + 64, minHeight: stageHeight + 64 }}
      >
        <div
          className="relative flex-shrink-0"
          style={{
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            width: stageWidth,
            height: stageHeight,
          }}
        >
          <Stage
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={stageRef as any}
            width={stageWidth}
            height={stageHeight}
            scaleX={zoom}
            scaleY={zoom}
            onClick={handleStageClick}
            onWheel={handleWheel}
          >
            <Layer>
              {/* Page background */}
              <Rect
                x={0}
                y={0}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill={backgroundColor}
              />

              {/* Canvas elements */}
              {sortedElements.map((el) => (
                <CanvasElementRenderer
                  key={el.id}
                  element={el}
                  isSelected={selectedIds.includes(el.id)}
                  onSelect={onSelect}
                  onDragEnd={snapDragEnd}
                  onDblClick={onDblClick}
                />
              ))}

              {/* Grid overlay — rendered AFTER elements so lines are visible over colored shapes */}
              {showGrid &&
                Array.from({ length: Math.ceil(CANVAS_WIDTH / gridSize) }, (_, i) => (
                  <Rect
                    key={`gv-${i}`}
                    x={i * gridSize}
                    y={0}
                    width={0.5}
                    height={CANVAS_HEIGHT}
                    fill="rgba(0,0,0,0.08)"
                    listening={false}
                  />
                ))}
              {showGrid &&
                Array.from({ length: Math.ceil(CANVAS_HEIGHT / gridSize) }, (_, i) => (
                  <Rect
                    key={`gh-${i}`}
                    x={0}
                    y={i * gridSize}
                    width={CANVAS_WIDTH}
                    height={0.5}
                    fill="rgba(0,0,0,0.08)"
                    listening={false}
                  />
                ))}

              {/* Selection transformer */}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 5 || newBox.height < 5) return oldBox;
                  return newBox;
                }}
                onTransformEnd={handleTransformEnd}
                rotateEnabled={true}
                enabledAnchors={[
                  'top-left',
                  'top-center',
                  'top-right',
                  'middle-left',
                  'middle-right',
                  'bottom-left',
                  'bottom-center',
                  'bottom-right',
                ]}
                borderStroke="#3B82F6"
                borderStrokeWidth={1}
                anchorStroke="#3B82F6"
                anchorFill="#FFFFFF"
                anchorSize={8}
                anchorCornerRadius={2}
              />

              {/* Move handle for selected element */}
              {singleSelectedEl && !singleSelectedEl.locked && (
                <MoveHandle element={singleSelectedEl} onDragEnd={snapDragEnd} />
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
