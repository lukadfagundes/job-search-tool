import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Circle } from 'react-konva';
import { CanvasImage } from '../../renderer/components/layout/elements/CanvasImage.tsx';
import type { LayoutElement, ImageProps } from '../../shared/layout-types.ts';

function makeImageElement(overrides: Partial<ImageProps> = {}): LayoutElement {
  return {
    id: 'img-1',
    type: 'image',
    x: 10,
    y: 20,
    width: 100,
    height: 80,
    rotation: 0,
    zIndex: 1,
    locked: false,
    visible: true,
    props: {
      src: 'data:image/png;base64,abc123',
      opacity: 1,
      cornerRadius: 0,
      clipCircle: false,
      ...overrides,
    } as ImageProps,
  };
}

const defaultHandlers = {
  onSelect: vi.fn(),
  onDragEnd: vi.fn(),
};

describe('CanvasImage', () => {
  it('renders placeholder circle when image has not loaded', () => {
    // Image starts as null (not loaded yet), so placeholder renders
    render(<CanvasImage element={makeImageElement()} isSelected={false} {...defaultHandlers} />);
    const mockCircle = vi.mocked(Circle);
    expect(mockCircle).toHaveBeenCalled();
    const lastCall = mockCircle.mock.calls[mockCircle.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    expect(lastCall.id).toBe('img-1');
    expect(lastCall.fill).toBe('#D1D5DB');
  });

  it('renders placeholder with selected stroke', () => {
    render(<CanvasImage element={makeImageElement()} isSelected={true} {...defaultHandlers} />);
    const mockCircle = vi.mocked(Circle);
    const lastCall = mockCircle.mock.calls[mockCircle.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    expect(lastCall.stroke).toBe('#3B82F6');
    expect(lastCall.strokeWidth).toBe(2);
  });

  it('renders placeholder with unselected stroke', () => {
    render(<CanvasImage element={makeImageElement()} isSelected={false} {...defaultHandlers} />);
    const mockCircle = vi.mocked(Circle);
    const lastCall = mockCircle.mock.calls[mockCircle.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    expect(lastCall.stroke).toBe('#9CA3AF');
    expect(lastCall.strokeWidth).toBe(1);
  });

  it('renders placeholder as not draggable when locked', () => {
    const el = makeImageElement();
    el.locked = true;
    render(<CanvasImage element={el} isSelected={false} {...defaultHandlers} />);
    const mockCircle = vi.mocked(Circle);
    const lastCall = mockCircle.mock.calls[mockCircle.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    expect(lastCall.draggable).toBe(false);
  });

  it('placeholder onClick calls onSelect with shiftKey', () => {
    const onSelect = vi.fn();
    render(
      <CanvasImage
        element={makeImageElement()}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
      />
    );
    const mockCircle = vi.mocked(Circle);
    const lastCall = mockCircle.mock.calls[mockCircle.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onClick = lastCall.onClick as (e: { evt: { shiftKey: boolean } }) => void;
    onClick({ evt: { shiftKey: true } });
    expect(onSelect).toHaveBeenCalledWith('img-1', true);
  });

  it('placeholder onTap calls onSelect', () => {
    const onSelect = vi.fn();
    render(
      <CanvasImage
        element={makeImageElement()}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
      />
    );
    const mockCircle = vi.mocked(Circle);
    const lastCall = mockCircle.mock.calls[mockCircle.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onTap = lastCall.onTap as () => void;
    onTap();
    expect(onSelect).toHaveBeenCalledWith('img-1', false);
  });

  it('placeholder onDragEnd adjusts coordinates by half width/height', () => {
    const onDragEnd = vi.fn();
    render(
      <CanvasImage
        element={makeImageElement()}
        isSelected={false}
        onSelect={vi.fn()}
        onDragEnd={onDragEnd}
      />
    );
    const mockCircle = vi.mocked(Circle);
    const lastCall = mockCircle.mock.calls[mockCircle.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const dragHandler = lastCall.onDragEnd as (e: {
      target: { x: () => number; y: () => number };
    }) => void;
    dragHandler({ target: { x: () => 150, y: () => 140 } });
    // x = 150 - 100/2 = 100, y = 140 - 80/2 = 100
    expect(onDragEnd).toHaveBeenCalledWith('img-1', 100, 100);
  });

  it('renders nothing when src is empty (useEffect returns early)', () => {
    render(
      <CanvasImage
        element={makeImageElement({ src: '' })}
        isSelected={false}
        {...defaultHandlers}
      />
    );
    // With empty src, useEffect returns early and image stays null → placeholder renders
    const mockCircle = vi.mocked(Circle);
    expect(mockCircle).toHaveBeenCalled();
  });

  it('positions placeholder at center of element', () => {
    render(<CanvasImage element={makeImageElement()} isSelected={false} {...defaultHandlers} />);
    const mockCircle = vi.mocked(Circle);
    const lastCall = mockCircle.mock.calls[mockCircle.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    // x = 10 + 100/2 = 60, y = 20 + 80/2 = 60
    expect(lastCall.x).toBe(60);
    expect(lastCall.y).toBe(60);
    // radius = min(100, 80) / 2 = 40
    expect(lastCall.radius).toBe(40);
  });
});
