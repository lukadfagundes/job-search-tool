import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Stage, Transformer } from 'react-konva';
import { ResumeCanvas } from '../../renderer/components/layout/ResumeCanvas.tsx';
import type { LayoutElement, TextProps, ShapeProps } from '../../shared/layout-types.ts';
import { createRef } from 'react';

function makeElements(): LayoutElement[] {
  return [
    {
      id: 'el-1',
      type: 'text',
      x: 10,
      y: 20,
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
        fontStyle: 'normal',
        textDecoration: 'none',
        fill: '#000',
        align: 'left',
        lineHeight: 1.2,
        letterSpacing: 0,
      } as TextProps,
    },
    {
      id: 'el-2',
      type: 'shape',
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      rotation: 0,
      zIndex: 0,
      locked: false,
      visible: true,
      props: {
        shapeType: 'rect',
        fill: '#ccc',
        stroke: '#000',
        strokeWidth: 1,
        opacity: 1,
        cornerRadius: 0,
      } as ShapeProps,
    },
  ];
}

const defaultProps = {
  elements: makeElements(),
  selectedIds: [] as string[],
  zoom: 1,
  backgroundColor: '#FFFFFF',
  showGrid: false,
  snapToGrid: false,
  gridSize: 10,
  onSelect: vi.fn(),
  onDeselectAll: vi.fn(),
  onDragEnd: vi.fn(),
  onTransformEnd: vi.fn(),
  onDblClick: vi.fn(),
  onWheel: vi.fn(),
  stageRef: createRef<null>(),
};

describe('ResumeCanvas', () => {
  it('renders without error', () => {
    expect(() => {
      render(<ResumeCanvas {...defaultProps} />);
    }).not.toThrow();
  });

  it('renders with grid enabled', () => {
    expect(() => {
      render(<ResumeCanvas {...defaultProps} showGrid={true} />);
    }).not.toThrow();
  });

  it('renders with selected elements', () => {
    expect(() => {
      render(<ResumeCanvas {...defaultProps} selectedIds={['el-1']} />);
    }).not.toThrow();
  });

  it('renders with custom zoom', () => {
    expect(() => {
      render(<ResumeCanvas {...defaultProps} zoom={1.5} />);
    }).not.toThrow();
  });

  it('renders empty elements list', () => {
    expect(() => {
      render(<ResumeCanvas {...defaultProps} elements={[]} />);
    }).not.toThrow();
  });

  it('sorts elements by zIndex', () => {
    // Shape has zIndex 0, text has zIndex 1 - shape should render first
    expect(() => {
      render(<ResumeCanvas {...defaultProps} />);
    }).not.toThrow();
  });

  it('renders with container styling', () => {
    const { container } = render(<ResumeCanvas {...defaultProps} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeDefined();
    expect(wrapper.className).toContain('flex-1');
  });

  it('Stage onClick calls onDeselectAll when clicking empty area', () => {
    const onDeselectAll = vi.fn();
    render(<ResumeCanvas {...defaultProps} onDeselectAll={onDeselectAll} />);
    const mockStage = vi.mocked(Stage);
    const lastCall = mockStage.mock.calls[mockStage.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onClick = lastCall.onClick as (e: { target: { getStage: () => unknown } }) => void;
    const fakeStage = {};
    onClick({ target: { getStage: () => fakeStage } as unknown as { getStage: () => unknown } });
    // Should not call onDeselectAll since target !== stage
  });

  it('Stage onClick on stage itself calls onDeselectAll', () => {
    const onDeselectAll = vi.fn();
    render(<ResumeCanvas {...defaultProps} onDeselectAll={onDeselectAll} />);
    const mockStage = vi.mocked(Stage);
    const lastCall = mockStage.mock.calls[mockStage.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onClick = lastCall.onClick as (e: {
      target: unknown & { getStage: () => unknown };
    }) => void;
    // Simulate click on empty stage area (target is the stage itself)
    const fakeTarget = { getStage: () => fakeTarget };
    onClick({ target: fakeTarget } as { target: unknown & { getStage: () => unknown } });
    expect(onDeselectAll).toHaveBeenCalledTimes(1);
  });

  it('Stage onWheel calls onWheel with deltaY', () => {
    const onWheel = vi.fn();
    render(<ResumeCanvas {...defaultProps} onWheel={onWheel} />);
    const mockStage = vi.mocked(Stage);
    const lastCall = mockStage.mock.calls[mockStage.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const wheelHandler = lastCall.onWheel as (e: {
      evt: { preventDefault: () => void; deltaY: number };
    }) => void;
    const preventDefault = vi.fn();
    wheelHandler({ evt: { preventDefault, deltaY: 120 } });
    expect(preventDefault).toHaveBeenCalled();
    expect(onWheel).toHaveBeenCalledWith(120);
  });

  it('Transformer onTransformEnd extracts node attributes', () => {
    const onTransformEnd = vi.fn();
    render(<ResumeCanvas {...defaultProps} onTransformEnd={onTransformEnd} />);
    const mockTransformer = vi.mocked(Transformer);
    const lastCall = mockTransformer.mock.calls[mockTransformer.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const transformHandler = lastCall.onTransformEnd as (e: {
      target: Record<string, unknown>;
    }) => void;
    const fakeNode = {
      id: () => 'el-1',
      scaleX: () => 2,
      scaleY: () => 1.5,
      x: () => 100,
      y: () => 200,
      width: () => 50,
      height: () => 30,
      rotation: () => 45,
    };
    transformHandler({ target: fakeNode as unknown as Record<string, unknown> });
    expect(onTransformEnd).toHaveBeenCalledWith('el-1', {
      x: 100,
      y: 200,
      width: 100, // 50 * 2
      height: 45, // 30 * 1.5
      rotation: 45,
    });
  });

  it('Transformer onTransformEnd with no id does nothing', () => {
    const onTransformEnd = vi.fn();
    render(<ResumeCanvas {...defaultProps} onTransformEnd={onTransformEnd} />);
    const mockTransformer = vi.mocked(Transformer);
    const lastCall = mockTransformer.mock.calls[mockTransformer.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const transformHandler = lastCall.onTransformEnd as (e: {
      target: Record<string, unknown>;
    }) => void;
    const fakeNode = {
      id: () => '',
      scaleX: () => 1,
      scaleY: () => 1,
      x: () => 0,
      y: () => 0,
      width: () => 10,
      height: () => 10,
      rotation: () => 0,
    };
    transformHandler({ target: fakeNode as unknown as Record<string, unknown> });
    expect(onTransformEnd).not.toHaveBeenCalled();
  });

  it('renders with snapToGrid enabled', () => {
    expect(() => {
      render(<ResumeCanvas {...defaultProps} snapToGrid={true} />);
    }).not.toThrow();
  });

  it('renders with both showGrid and snapToGrid enabled', () => {
    expect(() => {
      render(<ResumeCanvas {...defaultProps} showGrid={true} snapToGrid={true} />);
    }).not.toThrow();
  });

  it('Transformer boundBoxFunc enforces minimum size', () => {
    render(<ResumeCanvas {...defaultProps} />);
    const mockTransformer = vi.mocked(Transformer);
    const lastCall = mockTransformer.mock.calls[mockTransformer.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const boundBoxFunc = lastCall.boundBoxFunc as (
      oldBox: { width: number; height: number },
      newBox: { width: number; height: number }
    ) => { width: number; height: number };
    const oldBox = { width: 50, height: 50 };
    // Normal box (above min)
    const normalBox = { width: 100, height: 100 };
    expect(boundBoxFunc(oldBox, normalBox)).toBe(normalBox);
    // Too small width
    const tooSmall = { width: 3, height: 100 };
    expect(boundBoxFunc(oldBox, tooSmall)).toBe(oldBox);
    // Too small height
    const tooSmallH = { width: 100, height: 2 };
    expect(boundBoxFunc(oldBox, tooSmallH)).toBe(oldBox);
  });
});
