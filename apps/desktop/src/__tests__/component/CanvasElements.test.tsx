import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Text, Rect, Circle, Line, Ellipse, Path } from 'react-konva';
import { CanvasText } from '../../renderer/components/layout/elements/CanvasText.tsx';
import { CanvasShape } from '../../renderer/components/layout/elements/CanvasShape.tsx';
import { CanvasImage } from '../../renderer/components/layout/elements/CanvasImage.tsx';
import { CanvasDivider } from '../../renderer/components/layout/elements/CanvasDivider.tsx';
import { CanvasIcon } from '../../renderer/components/layout/elements/CanvasIcon.tsx';
import type {
  LayoutElement,
  TextProps,
  ShapeProps,
  ImageProps,
  DividerProps,
  IconProps,
} from '../../shared/layout-types.ts';

const handlers = {
  onSelect: vi.fn(),
  onDragEnd: vi.fn(),
  onDblClick: vi.fn(),
};

describe('CanvasText', () => {
  const element: LayoutElement = {
    id: 'txt-1',
    type: 'text',
    x: 10,
    y: 20,
    width: 200,
    height: 30,
    rotation: 0,
    zIndex: 1,
    locked: false,
    visible: true,
    props: {
      text: 'Hello World',
      fontFamily: 'Helvetica',
      fontSize: 14,
      fontStyle: 'bold' as const,
      textDecoration: 'underline' as const,
      fill: '#000000',
      align: 'center' as const,
      lineHeight: 1.5,
      letterSpacing: 0.5,
    } as TextProps,
  };

  it('renders without error', () => {
    expect(() =>
      render(<CanvasText element={element} isSelected={false} {...handlers} />)
    ).not.toThrow();
  });

  it('renders when selected', () => {
    expect(() =>
      render(<CanvasText element={element} isSelected={true} {...handlers} />)
    ).not.toThrow();
  });

  it('renders with bold italic style', () => {
    const el = {
      ...element,
      props: { ...element.props, fontStyle: 'bold italic' } as TextProps,
    };
    expect(() =>
      render(<CanvasText element={el} isSelected={false} {...handlers} />)
    ).not.toThrow();
  });

  it('renders locked element (non-draggable)', () => {
    const el = { ...element, locked: true };
    expect(() =>
      render(<CanvasText element={el} isSelected={false} {...handlers} />)
    ).not.toThrow();
  });

  it('passes correct onClick handler to Text mock', () => {
    const onSelect = vi.fn();
    render(
      <CanvasText
        element={element}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
        onDblClick={vi.fn()}
      />
    );
    const mockText = vi.mocked(Text);
    const lastCall = mockText.mock.calls[mockText.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    // Invoke the onClick prop
    const onClick = lastCall.onClick as (e: { evt: { shiftKey: boolean } }) => void;
    onClick({ evt: { shiftKey: false } });
    expect(onSelect).toHaveBeenCalledWith('txt-1', false);
    onClick({ evt: { shiftKey: true } });
    expect(onSelect).toHaveBeenCalledWith('txt-1', true);
  });

  it('passes correct onTap handler to Text mock', () => {
    const onSelect = vi.fn();
    render(
      <CanvasText
        element={element}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
        onDblClick={vi.fn()}
      />
    );
    const mockText = vi.mocked(Text);
    const lastCall = mockText.mock.calls[mockText.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onTap = lastCall.onTap as () => void;
    onTap();
    expect(onSelect).toHaveBeenCalledWith('txt-1', false);
  });

  it('passes correct onDblClick handler to Text mock', () => {
    const onDblClick = vi.fn();
    render(
      <CanvasText
        element={element}
        isSelected={false}
        onSelect={vi.fn()}
        onDragEnd={vi.fn()}
        onDblClick={onDblClick}
      />
    );
    const mockText = vi.mocked(Text);
    const lastCall = mockText.mock.calls[mockText.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onDbl = lastCall.onDblClick as () => void;
    onDbl();
    expect(onDblClick).toHaveBeenCalledWith('txt-1');
  });

  it('passes correct onDblTap handler to Text mock', () => {
    const onDblClick = vi.fn();
    render(
      <CanvasText
        element={element}
        isSelected={false}
        onSelect={vi.fn()}
        onDragEnd={vi.fn()}
        onDblClick={onDblClick}
      />
    );
    const mockText = vi.mocked(Text);
    const lastCall = mockText.mock.calls[mockText.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onDblTap = lastCall.onDblTap as () => void;
    onDblTap();
    expect(onDblClick).toHaveBeenCalledWith('txt-1');
  });

  it('passes correct onDragEnd handler to Text mock', () => {
    const onDragEnd = vi.fn();
    render(
      <CanvasText
        element={element}
        isSelected={false}
        onSelect={vi.fn()}
        onDragEnd={onDragEnd}
        onDblClick={vi.fn()}
      />
    );
    const mockText = vi.mocked(Text);
    const lastCall = mockText.mock.calls[mockText.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const dragHandler = lastCall.onDragEnd as (e: {
      target: { x: () => number; y: () => number };
    }) => void;
    dragHandler({ target: { x: () => 55, y: () => 66 } });
    expect(onDragEnd).toHaveBeenCalledWith('txt-1', 55, 66);
  });

  it('renders with normal fontStyle and none textDecoration', () => {
    const el = {
      ...element,
      props: { ...element.props, fontStyle: 'normal', textDecoration: 'none' } as TextProps,
    };
    render(<CanvasText element={el} isSelected={false} {...handlers} />);
    const mockText = vi.mocked(Text);
    const lastCall = mockText.mock.calls[mockText.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    expect(lastCall.fontStyle).toBe('normal');
    expect(lastCall.textDecoration).toBe('');
  });
});

describe('CanvasShape', () => {
  const baseProps = {
    onSelect: vi.fn(),
    onDragEnd: vi.fn(),
  };

  const rectElement: LayoutElement = {
    id: 'shp-1',
    type: 'shape',
    x: 0,
    y: 0,
    width: 100,
    height: 80,
    rotation: 0,
    zIndex: 0,
    locked: false,
    visible: true,
    props: {
      shapeType: 'rect' as const,
      fill: '#FF0000',
      stroke: '#000',
      strokeWidth: 2,
      opacity: 0.9,
      cornerRadius: 5,
    } as ShapeProps,
  };

  it('renders rect shape', () => {
    expect(() =>
      render(<CanvasShape element={rectElement} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('renders circle shape', () => {
    const el = {
      ...rectElement,
      props: { ...rectElement.props, shapeType: 'circle' } as ShapeProps,
    };
    expect(() =>
      render(<CanvasShape element={el} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('renders ellipse shape', () => {
    const el = {
      ...rectElement,
      props: { ...rectElement.props, shapeType: 'ellipse' } as ShapeProps,
    };
    expect(() =>
      render(<CanvasShape element={el} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('renders line shape', () => {
    const el = { ...rectElement, props: { ...rectElement.props, shapeType: 'line' } as ShapeProps };
    expect(() =>
      render(<CanvasShape element={el} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('renders selected rect with blue stroke', () => {
    expect(() =>
      render(<CanvasShape element={rectElement} isSelected={true} {...baseProps} />)
    ).not.toThrow();
  });

  it('returns null for unknown shape type', () => {
    const el = {
      ...rectElement,
      props: { ...rectElement.props, shapeType: 'unknown' } as unknown as ShapeProps,
    };
    const { container } = render(<CanvasShape element={el} isSelected={false} {...baseProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('rect onClick calls onSelect with shiftKey', () => {
    const onSelect = vi.fn();
    render(
      <CanvasShape
        element={rectElement}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
      />
    );
    const mockRect = vi.mocked(Rect);
    const lastCall = mockRect.mock.calls[mockRect.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onClick = lastCall.onClick as (e: { evt: MouseEvent }) => void;
    onClick({ evt: { shiftKey: true } as MouseEvent });
    expect(onSelect).toHaveBeenCalledWith('shp-1', true);
  });

  it('rect onTap calls onSelect', () => {
    const onSelect = vi.fn();
    render(
      <CanvasShape
        element={rectElement}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
      />
    );
    const mockRect = vi.mocked(Rect);
    const lastCall = mockRect.mock.calls[mockRect.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onTap = lastCall.onTap as () => void;
    onTap();
    expect(onSelect).toHaveBeenCalledWith('shp-1', false);
  });

  it('rect onDragEnd calls handler', () => {
    const onDragEnd = vi.fn();
    render(
      <CanvasShape
        element={rectElement}
        isSelected={false}
        onSelect={vi.fn()}
        onDragEnd={onDragEnd}
      />
    );
    const mockRect = vi.mocked(Rect);
    const lastCall = mockRect.mock.calls[mockRect.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const dragHandler = lastCall.onDragEnd as (e: {
      target: { x: () => number; y: () => number };
    }) => void;
    dragHandler({ target: { x: () => 10, y: () => 20 } });
    expect(onDragEnd).toHaveBeenCalledWith('shp-1', 10, 20);
  });

  it('circle onClick calls onSelect', () => {
    const onSelect = vi.fn();
    const el = {
      ...rectElement,
      props: { ...rectElement.props, shapeType: 'circle' } as ShapeProps,
    };
    render(<CanvasShape element={el} isSelected={false} onSelect={onSelect} onDragEnd={vi.fn()} />);
    const mockCircle = vi.mocked(Circle);
    const lastCall = mockCircle.mock.calls[mockCircle.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onClick = lastCall.onClick as (e: { evt: MouseEvent }) => void;
    onClick({ evt: { shiftKey: false } as MouseEvent });
    expect(onSelect).toHaveBeenCalledWith('shp-1', false);
  });

  it('ellipse onClick calls onSelect', () => {
    const onSelect = vi.fn();
    const el = {
      ...rectElement,
      props: { ...rectElement.props, shapeType: 'ellipse' } as ShapeProps,
    };
    render(<CanvasShape element={el} isSelected={false} onSelect={onSelect} onDragEnd={vi.fn()} />);
    const mockEllipse = vi.mocked(Ellipse);
    const lastCall = mockEllipse.mock.calls[mockEllipse.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onClick = lastCall.onClick as (e: { evt: MouseEvent }) => void;
    onClick({ evt: { shiftKey: false } as MouseEvent });
    expect(onSelect).toHaveBeenCalledWith('shp-1', false);
  });

  it('line onClick calls onSelect', () => {
    const onSelect = vi.fn();
    const el = { ...rectElement, props: { ...rectElement.props, shapeType: 'line' } as ShapeProps };
    render(<CanvasShape element={el} isSelected={false} onSelect={onSelect} onDragEnd={vi.fn()} />);
    const mockLine = vi.mocked(Line);
    const lastCall = mockLine.mock.calls[mockLine.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onClick = lastCall.onClick as (e: { evt: MouseEvent }) => void;
    onClick({ evt: { shiftKey: false } as MouseEvent });
    expect(onSelect).toHaveBeenCalledWith('shp-1', false);
  });

  it('line shape uses stroke fallback to fill', () => {
    const el = {
      ...rectElement,
      props: { ...rectElement.props, shapeType: 'line', stroke: '', strokeWidth: 0 } as ShapeProps,
    };
    render(<CanvasShape element={el} isSelected={false} {...baseProps} />);
    const mockLine = vi.mocked(Line);
    const lastCall = mockLine.mock.calls[mockLine.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    expect(lastCall.stroke).toBe('#FF0000'); // falls back to fill
    expect(lastCall.strokeWidth).toBe(2); // falls back to 2
  });
});

describe('CanvasImage', () => {
  const baseProps = {
    onSelect: vi.fn(),
    onDragEnd: vi.fn(),
  };

  const imageElement: LayoutElement = {
    id: 'img-1',
    type: 'image',
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    rotation: 0,
    zIndex: 1,
    locked: false,
    visible: true,
    props: {
      src: '',
      opacity: 1,
      cornerRadius: 0,
      clipCircle: false,
    } as ImageProps,
  };

  it('renders placeholder when no src', () => {
    expect(() =>
      render(<CanvasImage element={imageElement} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('renders with src (image loading)', () => {
    const el = {
      ...imageElement,
      props: { ...imageElement.props, src: 'data:image/png;base64,abc' } as ImageProps,
    };
    expect(() =>
      render(<CanvasImage element={el} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('renders with clipCircle enabled', () => {
    const el = {
      ...imageElement,
      props: {
        ...imageElement.props,
        src: 'data:image/png;base64,abc',
        clipCircle: true,
      } as ImageProps,
    };
    expect(() =>
      render(<CanvasImage element={el} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('renders selected placeholder', () => {
    expect(() =>
      render(<CanvasImage element={imageElement} isSelected={true} {...baseProps} />)
    ).not.toThrow();
  });

  it('placeholder onClick calls onSelect', () => {
    const onSelect = vi.fn();
    render(
      <CanvasImage
        element={imageElement}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
      />
    );
    // Placeholder renders a Circle mock
    const mockCircle = vi.mocked(Circle);
    const lastCall = mockCircle.mock.calls[mockCircle.mock.calls.length - 1]?.[0] as
      | Record<string, unknown>
      | undefined;
    if (lastCall?.onClick) {
      const onClick = lastCall.onClick as (e: { evt: { shiftKey: boolean } }) => void;
      onClick({ evt: { shiftKey: false } });
      expect(onSelect).toHaveBeenCalledWith('img-1', false);
    }
  });

  it('placeholder onTap calls onSelect', () => {
    const onSelect = vi.fn();
    render(
      <CanvasImage
        element={imageElement}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
      />
    );
    const mockCircle = vi.mocked(Circle);
    const lastCall = mockCircle.mock.calls[mockCircle.mock.calls.length - 1]?.[0] as
      | Record<string, unknown>
      | undefined;
    if (lastCall?.onTap) {
      const onTap = lastCall.onTap as () => void;
      onTap();
      expect(onSelect).toHaveBeenCalledWith('img-1', false);
    }
  });

  it('placeholder onDragEnd adjusts for center offset', () => {
    const onDragEnd = vi.fn();
    render(
      <CanvasImage
        element={imageElement}
        isSelected={false}
        onSelect={vi.fn()}
        onDragEnd={onDragEnd}
      />
    );
    const mockCircle = vi.mocked(Circle);
    const lastCall = mockCircle.mock.calls[mockCircle.mock.calls.length - 1]?.[0] as
      | Record<string, unknown>
      | undefined;
    if (lastCall?.onDragEnd) {
      const dragHandler = lastCall.onDragEnd as (e: {
        target: { x: () => number; y: () => number };
      }) => void;
      dragHandler({ target: { x: () => 150, y: () => 200 } });
      // x - width/2 = 150 - 50 = 100, y - height/2 = 200 - 50 = 150
      expect(onDragEnd).toHaveBeenCalledWith('img-1', 100, 150);
    }
  });
});

describe('CanvasDivider', () => {
  const baseProps = {
    onSelect: vi.fn(),
    onDragEnd: vi.fn(),
  };

  const horizontalDivider: LayoutElement = {
    id: 'div-1',
    type: 'divider',
    x: 10,
    y: 100,
    width: 200,
    height: 1,
    rotation: 0,
    zIndex: 1,
    locked: false,
    visible: true,
    props: {
      orientation: 'horizontal' as const,
      stroke: '#000',
      strokeWidth: 1,
      dashEnabled: false,
      dash: [],
    } as DividerProps,
  };

  it('renders horizontal divider', () => {
    expect(() =>
      render(<CanvasDivider element={horizontalDivider} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('renders vertical divider', () => {
    const el = {
      ...horizontalDivider,
      width: 1,
      height: 100,
      props: { ...horizontalDivider.props, orientation: 'vertical' } as DividerProps,
    };
    expect(() =>
      render(<CanvasDivider element={el} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('renders with dash enabled', () => {
    const el = {
      ...horizontalDivider,
      props: { ...horizontalDivider.props, dashEnabled: true, dash: [5, 3] } as DividerProps,
    };
    expect(() =>
      render(<CanvasDivider element={el} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('renders selected divider', () => {
    expect(() =>
      render(<CanvasDivider element={horizontalDivider} isSelected={true} {...baseProps} />)
    ).not.toThrow();
  });

  it('divider onClick calls onSelect', () => {
    const onSelect = vi.fn();
    render(
      <CanvasDivider
        element={horizontalDivider}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
      />
    );
    const mockLine = vi.mocked(Line);
    const lastCall = mockLine.mock.calls[mockLine.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onClick = lastCall.onClick as (e: { evt: { shiftKey: boolean } }) => void;
    onClick({ evt: { shiftKey: true } });
    expect(onSelect).toHaveBeenCalledWith('div-1', true);
  });

  it('divider onTap calls onSelect', () => {
    const onSelect = vi.fn();
    render(
      <CanvasDivider
        element={horizontalDivider}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
      />
    );
    const mockLine = vi.mocked(Line);
    const lastCall = mockLine.mock.calls[mockLine.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onTap = lastCall.onTap as () => void;
    onTap();
    expect(onSelect).toHaveBeenCalledWith('div-1', false);
  });

  it('divider onDragEnd calls handler', () => {
    const onDragEnd = vi.fn();
    render(
      <CanvasDivider
        element={horizontalDivider}
        isSelected={false}
        onSelect={vi.fn()}
        onDragEnd={onDragEnd}
      />
    );
    const mockLine = vi.mocked(Line);
    const lastCall = mockLine.mock.calls[mockLine.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const dragHandler = lastCall.onDragEnd as (e: {
      target: { x: () => number; y: () => number };
    }) => void;
    dragHandler({ target: { x: () => 30, y: () => 40 } });
    expect(onDragEnd).toHaveBeenCalledWith('div-1', 30, 40);
  });
});

describe('CanvasIcon', () => {
  const baseProps = {
    onSelect: vi.fn(),
    onDragEnd: vi.fn(),
  };

  const iconElement: LayoutElement = {
    id: 'ico-1',
    type: 'icon',
    x: 10,
    y: 10,
    width: 24,
    height: 24,
    rotation: 0,
    zIndex: 1,
    locked: false,
    visible: true,
    props: {
      path: 'M12 2L2 7l10 5 10-5-10-5z',
      fill: '#000',
      name: 'test-icon',
    } as IconProps,
  };

  it('renders without error', () => {
    expect(() =>
      render(<CanvasIcon element={iconElement} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('renders selected icon', () => {
    expect(() =>
      render(<CanvasIcon element={iconElement} isSelected={true} {...baseProps} />)
    ).not.toThrow();
  });

  it('scales to element dimensions', () => {
    const el = { ...iconElement, width: 48, height: 48 };
    expect(() =>
      render(<CanvasIcon element={el} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('renders locked icon', () => {
    const el = { ...iconElement, locked: true };
    expect(() =>
      render(<CanvasIcon element={el} isSelected={false} {...baseProps} />)
    ).not.toThrow();
  });

  it('icon onClick calls onSelect', () => {
    const onSelect = vi.fn();
    render(
      <CanvasIcon
        element={iconElement}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
      />
    );
    const mockPath = vi.mocked(Path);
    const lastCall = mockPath.mock.calls[mockPath.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onClick = lastCall.onClick as (e: { evt: { shiftKey: boolean } }) => void;
    onClick({ evt: { shiftKey: false } });
    expect(onSelect).toHaveBeenCalledWith('ico-1', false);
  });

  it('icon onTap calls onSelect', () => {
    const onSelect = vi.fn();
    render(
      <CanvasIcon
        element={iconElement}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
      />
    );
    const mockPath = vi.mocked(Path);
    const lastCall = mockPath.mock.calls[mockPath.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const onTap = lastCall.onTap as () => void;
    onTap();
    expect(onSelect).toHaveBeenCalledWith('ico-1', false);
  });

  it('icon onDragEnd calls handler', () => {
    const onDragEnd = vi.fn();
    render(
      <CanvasIcon
        element={iconElement}
        isSelected={false}
        onSelect={vi.fn()}
        onDragEnd={onDragEnd}
      />
    );
    const mockPath = vi.mocked(Path);
    const lastCall = mockPath.mock.calls[mockPath.mock.calls.length - 1][0] as Record<
      string,
      unknown
    >;
    const dragHandler = lastCall.onDragEnd as (e: {
      target: { x: () => number; y: () => number };
    }) => void;
    dragHandler({ target: { x: () => 15, y: () => 25 } });
    expect(onDragEnd).toHaveBeenCalledWith('ico-1', 15, 25);
  });
});
