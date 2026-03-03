import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayoutHistory } from '../../renderer/hooks/useLayoutHistory.ts';
import type { LayoutElement } from '../../shared/layout-types.ts';

function makeElement(id: string): LayoutElement {
  return {
    id,
    type: 'text',
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    rotation: 0,
    zIndex: 0,
    locked: false,
    visible: true,
    props: {
      text: id,
      fontFamily: 'Helvetica',
      fontSize: 12,
      fontStyle: 'normal' as const,
      textDecoration: 'none' as const,
      fill: '#000',
      align: 'left' as const,
      lineHeight: 1.2,
      letterSpacing: 0,
    },
  };
}

describe('useLayoutHistory', () => {
  it('initializes with provided elements', () => {
    const initial = [makeElement('a')];
    const { result } = renderHook(() => useLayoutHistory(initial));
    expect(result.current.elements).toEqual(initial);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('setElementsImmediate updates elements and creates history entry', () => {
    const initial = [makeElement('a')];
    const { result } = renderHook(() => useLayoutHistory(initial));
    const updated = [makeElement('a'), makeElement('b')];
    act(() => result.current.setElementsImmediate(updated));
    expect(result.current.elements).toEqual(updated);
    expect(result.current.canUndo).toBe(true);
  });

  it('undo restores previous state', () => {
    const initial = [makeElement('a')];
    const { result } = renderHook(() => useLayoutHistory(initial));
    const updated = [makeElement('b')];
    act(() => result.current.setElementsImmediate(updated));
    expect(result.current.elements).toEqual(updated);
    act(() => result.current.undo());
    expect(result.current.elements).toEqual(initial);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo restores undone state', () => {
    const initial = [makeElement('a')];
    const { result } = renderHook(() => useLayoutHistory(initial));
    const updated = [makeElement('b')];
    act(() => result.current.setElementsImmediate(updated));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.elements).toEqual(updated);
    expect(result.current.canRedo).toBe(false);
  });

  it('undo does nothing at beginning of history', () => {
    const initial = [makeElement('a')];
    const { result } = renderHook(() => useLayoutHistory(initial));
    act(() => result.current.undo());
    expect(result.current.elements).toEqual(initial);
  });

  it('redo does nothing at end of history', () => {
    const initial = [makeElement('a')];
    const { result } = renderHook(() => useLayoutHistory(initial));
    act(() => result.current.redo());
    expect(result.current.elements).toEqual(initial);
  });

  it('setElements updates elements immediately even before debounce fires', () => {
    const initial = [makeElement('a')];
    const { result } = renderHook(() => useLayoutHistory(initial));
    const updated = [makeElement('b')];
    act(() => result.current.setElements(updated));
    // Elements update immediately (visual change is instant)
    expect(result.current.elements).toEqual(updated);
  });

  it('resetHistory clears history and sets new elements', () => {
    const initial = [makeElement('a')];
    const { result } = renderHook(() => useLayoutHistory(initial));
    act(() => result.current.setElementsImmediate([makeElement('b')]));
    act(() => result.current.setElementsImmediate([makeElement('c')]));
    expect(result.current.canUndo).toBe(true);

    const newElements = [makeElement('d')];
    act(() => result.current.resetHistory(newElements));
    expect(result.current.elements).toEqual(newElements);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('new edits after undo clear redo stack', () => {
    const initial = [makeElement('a')];
    const { result } = renderHook(() => useLayoutHistory(initial));
    act(() => result.current.setElementsImmediate([makeElement('b')]));
    act(() => result.current.setElementsImmediate([makeElement('c')]));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.setElementsImmediate([makeElement('d')]));
    expect(result.current.canRedo).toBe(false);
  });

  it('setElements accepts updater function', () => {
    const initial = [makeElement('a')];
    const { result } = renderHook(() => useLayoutHistory(initial));
    act(() => {
      result.current.setElements((prev) => [...prev, makeElement('b')]);
    });
    expect(result.current.elements).toHaveLength(2);
    expect(result.current.elements[1].id).toBe('b');
  });
});
