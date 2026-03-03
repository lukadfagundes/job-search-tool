import { useState, useCallback } from 'react';

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  selectedIds: string[];
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export function useCanvasState() {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(10);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  const handleWheel = useCallback((deltaY: number) => {
    setZoom((z) => {
      const newZoom = deltaY < 0 ? z + ZOOM_STEP : z - ZOOM_STEP;
      return Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);
    });
  }, []);

  const selectElement = useCallback((id: string, shiftKey: boolean) => {
    setSelectedIds((prev) => {
      if (shiftKey) {
        return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      }
      return [id];
    });
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid((g) => !g);
  }, []);

  const toggleSnap = useCallback(() => {
    setSnapToGrid((s) => !s);
  }, []);

  return {
    zoom,
    panX,
    panY,
    selectedIds,
    showGrid,
    snapToGrid,
    gridSize,
    setZoom,
    setPanX,
    setPanY,
    setSelectedIds,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    selectElement,
    deselectAll,
    toggleGrid,
    toggleSnap,
    setGridSize,
  };
}
