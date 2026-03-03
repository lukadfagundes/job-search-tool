import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CanvasElementRenderer } from '../../renderer/components/layout/CanvasElementRenderer.tsx';
import type {
  LayoutElement,
  TextProps,
  ShapeProps,
  DividerProps,
  IconProps,
  ImageProps,
} from '../../shared/layout-types.ts';

// react-konva is mocked in setup.ts, so components render as vi.fn() returning null/children

const handlers = {
  onSelect: vi.fn(),
  onDragEnd: vi.fn(),
  onDblClick: vi.fn(),
};

function makeElement(type: LayoutElement['type'], props: LayoutElement['props']): LayoutElement {
  return {
    id: 'el-1',
    type,
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    rotation: 0,
    zIndex: 1,
    locked: false,
    visible: true,
    props,
  };
}

describe('CanvasElementRenderer', () => {
  it('returns null for invisible elements', () => {
    const el = makeElement('text', {
      text: 'Hi',
      fontFamily: 'Helvetica',
      fontSize: 12,
      fontStyle: 'normal',
      textDecoration: 'none',
      fill: '#000',
      align: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
    } as TextProps);
    el.visible = false;
    const { container } = render(
      <CanvasElementRenderer element={el} isSelected={false} {...handlers} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders text element without error', () => {
    const el = makeElement('text', {
      text: 'Hello',
      fontFamily: 'Helvetica',
      fontSize: 12,
      fontStyle: 'normal',
      textDecoration: 'none',
      fill: '#000',
      align: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
    } as TextProps);
    expect(() => {
      render(<CanvasElementRenderer element={el} isSelected={false} {...handlers} />);
    }).not.toThrow();
  });

  it('renders shape element without error', () => {
    const el = makeElement('shape', {
      shapeType: 'rect',
      fill: '#000',
      stroke: '#000',
      strokeWidth: 0,
      opacity: 1,
      cornerRadius: 0,
    } as ShapeProps);
    expect(() => {
      render(<CanvasElementRenderer element={el} isSelected={false} {...handlers} />);
    }).not.toThrow();
  });

  it('renders image element without error', () => {
    const el = makeElement('image', {
      src: 'data:image/png;base64,abc',
      opacity: 1,
      cornerRadius: 0,
      clipCircle: false,
    } as ImageProps);
    expect(() => {
      render(<CanvasElementRenderer element={el} isSelected={false} {...handlers} />);
    }).not.toThrow();
  });

  it('renders divider element without error', () => {
    const el = makeElement('divider', {
      orientation: 'horizontal',
      stroke: '#000',
      strokeWidth: 1,
      dashEnabled: false,
      dash: [],
    } as DividerProps);
    expect(() => {
      render(<CanvasElementRenderer element={el} isSelected={false} {...handlers} />);
    }).not.toThrow();
  });

  it('renders icon element without error', () => {
    const el = makeElement('icon', {
      path: 'M0 0L10 10',
      fill: '#000',
      name: 'test',
    } as IconProps);
    expect(() => {
      render(<CanvasElementRenderer element={el} isSelected={false} {...handlers} />);
    }).not.toThrow();
  });

  it('renders section as shape without error', () => {
    const el = makeElement('section', {
      label: 'Section',
      dataKey: 'test',
      backgroundColor: '#fff',
      padding: 10,
    });
    expect(() => {
      render(<CanvasElementRenderer element={el} isSelected={true} {...handlers} />);
    }).not.toThrow();
  });

  it('returns null for unknown element type', () => {
    const el = makeElement('unknown' as LayoutElement['type'], {} as TextProps);
    el.type = 'unknown' as LayoutElement['type'];
    const { container } = render(
      <CanvasElementRenderer element={el} isSelected={false} {...handlers} />
    );
    expect(container.innerHTML).toBe('');
  });
});
