import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasState } from '../../renderer/hooks/useCanvasState.ts';

describe('useCanvasState', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useCanvasState());
    expect(result.current.zoom).toBe(1);
    expect(result.current.panX).toBe(0);
    expect(result.current.panY).toBe(0);
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.showGrid).toBe(true);
    expect(result.current.snapToGrid).toBe(false);
    expect(result.current.gridSize).toBe(10);
  });

  it('zoomIn increases zoom by 0.1', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => result.current.zoomIn());
    expect(result.current.zoom).toBeCloseTo(1.1);
  });

  it('zoomOut decreases zoom by 0.1', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => result.current.zoomOut());
    expect(result.current.zoom).toBeCloseTo(0.9);
  });

  it('zoom does not exceed max (3)', () => {
    const { result } = renderHook(() => useCanvasState());
    for (let i = 0; i < 30; i++) {
      act(() => result.current.zoomIn());
    }
    expect(result.current.zoom).toBe(3);
  });

  it('zoom does not go below min (0.25)', () => {
    const { result } = renderHook(() => useCanvasState());
    for (let i = 0; i < 20; i++) {
      act(() => result.current.zoomOut());
    }
    expect(result.current.zoom).toBeCloseTo(0.25);
  });

  it('resetZoom sets zoom to 1 and pan to 0', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => result.current.zoomIn());
    act(() => result.current.setPanX(100));
    act(() => result.current.setPanY(200));
    act(() => result.current.resetZoom());
    expect(result.current.zoom).toBe(1);
    expect(result.current.panX).toBe(0);
    expect(result.current.panY).toBe(0);
  });

  it('handleWheel zooms in on negative deltaY', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => result.current.handleWheel(-100));
    expect(result.current.zoom).toBeCloseTo(1.1);
  });

  it('handleWheel zooms out on positive deltaY', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => result.current.handleWheel(100));
    expect(result.current.zoom).toBeCloseTo(0.9);
  });

  it('selectElement sets single selection without shift', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => result.current.selectElement('el-1', false));
    expect(result.current.selectedIds).toEqual(['el-1']);
  });

  it('selectElement adds to selection with shift', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => result.current.selectElement('el-1', false));
    act(() => result.current.selectElement('el-2', true));
    expect(result.current.selectedIds).toEqual(['el-1', 'el-2']);
  });

  it('selectElement removes from selection with shift if already selected', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => result.current.selectElement('el-1', false));
    act(() => result.current.selectElement('el-2', true));
    act(() => result.current.selectElement('el-1', true));
    expect(result.current.selectedIds).toEqual(['el-2']);
  });

  it('selectElement replaces selection without shift', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => result.current.selectElement('el-1', false));
    act(() => result.current.selectElement('el-2', false));
    expect(result.current.selectedIds).toEqual(['el-2']);
  });

  it('deselectAll clears selection', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => result.current.selectElement('el-1', false));
    act(() => result.current.deselectAll());
    expect(result.current.selectedIds).toEqual([]);
  });

  it('toggleGrid toggles showGrid', () => {
    const { result } = renderHook(() => useCanvasState());
    expect(result.current.showGrid).toBe(true);
    act(() => result.current.toggleGrid());
    expect(result.current.showGrid).toBe(false);
    act(() => result.current.toggleGrid());
    expect(result.current.showGrid).toBe(true);
  });

  it('toggleSnap toggles snapToGrid', () => {
    const { result } = renderHook(() => useCanvasState());
    expect(result.current.snapToGrid).toBe(false);
    act(() => result.current.toggleSnap());
    expect(result.current.snapToGrid).toBe(true);
    act(() => result.current.toggleSnap());
    expect(result.current.snapToGrid).toBe(false);
  });

  it('setGridSize updates gridSize', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => result.current.setGridSize(20));
    expect(result.current.gridSize).toBe(20);
  });
});
