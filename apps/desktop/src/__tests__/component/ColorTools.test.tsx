import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorTools } from '../../renderer/components/layout/tools/ColorTools.tsx';
import type {
  LayoutElement,
  TextProps,
  ShapeProps,
  DividerProps,
} from '../../shared/layout-types.ts';
import { RESUME_COLORS } from '../../shared/layout-types.ts';

function makeTextElement(): LayoutElement {
  return {
    id: 'el-1',
    type: 'text',
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    rotation: 0,
    zIndex: 1,
    locked: false,
    visible: true,
    props: {
      text: 'Hello',
      fontFamily: 'Helvetica',
      fontSize: 12,
      fontStyle: 'normal' as const,
      textDecoration: 'none' as const,
      fill: '#FF0000',
      align: 'left' as const,
      lineHeight: 1.2,
      letterSpacing: 0,
    } as TextProps,
  };
}

function makeShapeElement(): LayoutElement {
  return {
    id: 'el-2',
    type: 'shape',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    zIndex: 1,
    locked: false,
    visible: true,
    props: {
      shapeType: 'rect' as const,
      fill: '#00FF00',
      stroke: '#0000FF',
      strokeWidth: 2,
      opacity: 0.8,
      cornerRadius: 0,
    } as ShapeProps,
  };
}

describe('ColorTools', () => {
  it('renders color palette', () => {
    render(<ColorTools selectedElement={null} onUpdateElement={vi.fn()} />);
    expect(screen.getByText('Color Palette')).toBeInTheDocument();
  });

  it('shows hint when no element selected', () => {
    render(<ColorTools selectedElement={null} onUpdateElement={vi.fn()} />);
    expect(screen.getByText(/Select an element/)).toBeInTheDocument();
  });

  it('shows Fill Color section when element selected', () => {
    render(<ColorTools selectedElement={makeTextElement()} onUpdateElement={vi.fn()} />);
    expect(screen.getByText('Fill Color')).toBeInTheDocument();
  });

  it('shows Border / Outline for shape elements', () => {
    render(<ColorTools selectedElement={makeShapeElement()} onUpdateElement={vi.fn()} />);
    expect(screen.getByText('Border / Outline')).toBeInTheDocument();
    expect(screen.getByText(/Controls the border color/)).toBeInTheDocument();
  });

  it('does not show Border / Outline for text elements', () => {
    render(<ColorTools selectedElement={makeTextElement()} onUpdateElement={vi.fn()} />);
    expect(screen.queryByText('Border / Outline')).not.toBeInTheDocument();
  });

  it('shows Opacity slider for shape elements', () => {
    render(<ColorTools selectedElement={makeShapeElement()} onUpdateElement={vi.fn()} />);
    expect(screen.getByText(/Opacity: 80%/)).toBeInTheDocument();
  });

  it('calls onUpdateElement when preset color clicked', () => {
    const onUpdateElement = vi.fn();
    render(<ColorTools selectedElement={makeTextElement()} onUpdateElement={onUpdateElement} />);
    // Click the first preset color (navy)
    const navyButton = screen.getByTitle(RESUME_COLORS.navy);
    fireEvent.click(navyButton);
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ fill: RESUME_COLORS.navy }),
      })
    );
  });

  it('preset color does nothing when no element selected', () => {
    const onUpdateElement = vi.fn();
    render(<ColorTools selectedElement={null} onUpdateElement={onUpdateElement} />);
    const navyButton = screen.getByTitle(RESUME_COLORS.navy);
    fireEvent.click(navyButton);
    expect(onUpdateElement).not.toHaveBeenCalled();
  });

  it('calls onUpdateElement when fill color input changes', () => {
    const onUpdateElement = vi.fn();
    const { container } = render(
      <ColorTools selectedElement={makeTextElement()} onUpdateElement={onUpdateElement} />
    );
    const fillInput = container.querySelector(
      'input[type="color"][value="#FF0000"]'
    ) as HTMLInputElement;
    expect(fillInput).toBeTruthy();
    fireEvent.change(fillInput, { target: { value: '#123456' } });
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ fill: '#123456' }),
      })
    );
  });

  it('calls onUpdateElement when stroke color changes for shape', () => {
    const onUpdateElement = vi.fn();
    const { container } = render(
      <ColorTools selectedElement={makeShapeElement()} onUpdateElement={onUpdateElement} />
    );
    const strokeInput = container.querySelector(
      'input[type="color"][value="#0000FF"]'
    ) as HTMLInputElement;
    expect(strokeInput).toBeTruthy();
    fireEvent.change(strokeInput, { target: { value: '#AABBCC' } });
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-2',
      expect.objectContaining({
        props: expect.objectContaining({ stroke: '#aabbcc' }),
      })
    );
  });

  it('calls onUpdateElement when opacity changes for shape', () => {
    const onUpdateElement = vi.fn();
    render(<ColorTools selectedElement={makeShapeElement()} onUpdateElement={onUpdateElement} />);
    const opacitySlider = screen
      .getByText(/Opacity:/)
      .closest('div')
      ?.querySelector('input[type="range"]');
    expect(opacitySlider).toBeTruthy();
    fireEvent.change(opacitySlider!, { target: { value: '0.5' } });
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-2',
      expect.objectContaining({
        props: expect.objectContaining({ opacity: 0.5 }),
      })
    );
  });

  it('does not show Opacity for text elements', () => {
    render(<ColorTools selectedElement={makeTextElement()} onUpdateElement={vi.fn()} />);
    expect(screen.queryByText(/Opacity:/)).not.toBeInTheDocument();
  });

  it('setStroke does nothing for text element', () => {
    const onUpdateElement = vi.fn();
    // Text elements don't have 'stroke' in props so setStroke early-returns
    render(<ColorTools selectedElement={makeTextElement()} onUpdateElement={onUpdateElement} />);
    // There should only be one color input (fill), no stroke
    expect(screen.queryByText('Border / Outline')).not.toBeInTheDocument();
  });

  it('shows stroke width slider for shape elements', () => {
    render(<ColorTools selectedElement={makeShapeElement()} onUpdateElement={vi.fn()} />);
    expect(screen.getByText(/Width: 2px/)).toBeInTheDocument();
  });

  it('calls onUpdateElement when stroke width changes', () => {
    const onUpdateElement = vi.fn();
    render(<ColorTools selectedElement={makeShapeElement()} onUpdateElement={onUpdateElement} />);
    const widthSlider = screen
      .getByText(/Width:/)
      .closest('div')
      ?.querySelector('input[type="range"]');
    expect(widthSlider).toBeTruthy();
    fireEvent.change(widthSlider!, { target: { value: '5' } });
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-2',
      expect.objectContaining({
        props: expect.objectContaining({ strokeWidth: 5 }),
      })
    );
  });

  it('getCurrentFill returns fill from icon element', () => {
    const iconEl: LayoutElement = {
      id: 'ico-1',
      type: 'icon',
      x: 0,
      y: 0,
      width: 24,
      height: 24,
      rotation: 0,
      zIndex: 1,
      locked: false,
      visible: true,
      props: { path: 'M0 0', fill: '#112233', name: 'test' },
    };
    const { container } = render(<ColorTools selectedElement={iconEl} onUpdateElement={vi.fn()} />);
    const fillInput = container.querySelector('input[type="color"]') as HTMLInputElement;
    expect(fillInput).toBeTruthy();
    expect(fillInput.value).toBe('#112233');
  });

  it('handles divider element (no fill, has stroke)', () => {
    const dividerEl: LayoutElement = {
      id: 'div-1',
      type: 'divider',
      x: 0,
      y: 0,
      width: 200,
      height: 1,
      rotation: 0,
      zIndex: 1,
      locked: false,
      visible: true,
      props: {
        orientation: 'horizontal',
        stroke: '#FF0000',
        strokeWidth: 2,
        dashEnabled: false,
        dash: [],
      } as DividerProps,
    };
    const { container } = render(
      <ColorTools selectedElement={dividerEl} onUpdateElement={vi.fn()} />
    );
    // Divider has no 'fill' property, so getCurrentFill falls back to #000000
    const fillInput = container.querySelector('input[type="color"]') as HTMLInputElement;
    expect(fillInput).toBeTruthy();
    expect(fillInput.value).toBe('#000000');
  });

  it('handles section element (no fill/stroke/opacity in ShapeProps sense)', () => {
    const sectionEl: LayoutElement = {
      id: 'sec-1',
      type: 'section',
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      rotation: 0,
      zIndex: 1,
      locked: false,
      visible: true,
      props: { label: 'Test', dataKey: 'test', backgroundColor: '#fff', padding: 10 },
    };
    render(<ColorTools selectedElement={sectionEl} onUpdateElement={vi.fn()} />);
    // Section has no 'fill' in its props so fallback applies
    expect(screen.getByText('Fill Color')).toBeInTheDocument();
  });
});
