import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextTools } from '../../renderer/components/layout/tools/TextTools.tsx';
import type { LayoutElement, TextProps } from '../../shared/layout-types.ts';

const defaultProps = {
  onAddElement: vi.fn(),
  selectedElement: null,
  onUpdateElement: vi.fn(),
};

function makeTextElement(): LayoutElement {
  return {
    id: 'el-1',
    type: 'text',
    x: 0,
    y: 0,
    width: 200,
    height: 24,
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
      fill: '#000000',
      align: 'left' as const,
      lineHeight: 1.2,
      letterSpacing: 0,
    } as TextProps,
  };
}

describe('TextTools', () => {
  it('renders text preset buttons', () => {
    render(<TextTools {...defaultProps} />);
    expect(screen.getByText('heading')).toBeInTheDocument();
    expect(screen.getByText('subheading')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
    expect(screen.getByText('label')).toBeInTheDocument();
  });

  it('calls onAddElement when heading preset clicked', () => {
    const onAddElement = vi.fn();
    render(<TextTools {...defaultProps} onAddElement={onAddElement} />);
    fireEvent.click(screen.getByText('heading'));
    expect(onAddElement).toHaveBeenCalledTimes(1);
    const arg = onAddElement.mock.calls[0][0];
    expect(arg.type).toBe('text');
    expect(arg.props.text).toBe('Heading');
    expect(arg.props.fontStyle).toBe('bold');
  });

  it('calls onAddElement when body preset clicked', () => {
    const onAddElement = vi.fn();
    render(<TextTools {...defaultProps} onAddElement={onAddElement} />);
    fireEvent.click(screen.getByText('body'));
    const arg = onAddElement.mock.calls[0][0];
    expect(arg.props.text).toContain('Body text');
    expect(arg.height).toBe(60);
  });

  it('shows text properties when a text element is selected', () => {
    const el = makeTextElement();
    render(<TextTools {...defaultProps} selectedElement={el} />);
    expect(screen.getByText('Text Properties')).toBeInTheDocument();
    expect(screen.getByText('Font')).toBeInTheDocument();
  });

  it('does not show text properties for non-text selection', () => {
    const el: LayoutElement = {
      id: 'el-1',
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
        shapeType: 'rect',
        fill: '#000',
        stroke: '#000',
        strokeWidth: 0,
        opacity: 1,
        cornerRadius: 0,
      },
    };
    render(<TextTools {...defaultProps} selectedElement={el} />);
    expect(screen.queryByText('Text Properties')).not.toBeInTheDocument();
  });

  it('calls onUpdateElement when font family changes', () => {
    const onUpdateElement = vi.fn();
    render(
      <TextTools
        {...defaultProps}
        selectedElement={makeTextElement()}
        onUpdateElement={onUpdateElement}
      />
    );
    const fontSelect = screen.getByDisplayValue('Helvetica');
    fireEvent.change(fontSelect, { target: { value: 'Arial' } });
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ fontFamily: 'Arial' }),
      })
    );
  });

  it('calls onUpdateElement when alignment button clicked', () => {
    const onUpdateElement = vi.fn();
    render(
      <TextTools
        {...defaultProps}
        selectedElement={makeTextElement()}
        onUpdateElement={onUpdateElement}
      />
    );
    fireEvent.click(screen.getByText('Center'));
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ align: 'center' }),
      })
    );
  });

  it('toggles bold style', () => {
    const onUpdateElement = vi.fn();
    render(
      <TextTools
        {...defaultProps}
        selectedElement={makeTextElement()}
        onUpdateElement={onUpdateElement}
      />
    );
    fireEvent.click(screen.getByText('B'));
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ fontStyle: 'bold' }),
      })
    );
  });

  it('toggles italic style', () => {
    const onUpdateElement = vi.fn();
    render(
      <TextTools
        {...defaultProps}
        selectedElement={makeTextElement()}
        onUpdateElement={onUpdateElement}
      />
    );
    fireEvent.click(screen.getByText('I'));
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ fontStyle: 'italic' }),
      })
    );
  });

  it('toggles underline decoration', () => {
    const onUpdateElement = vi.fn();
    render(
      <TextTools
        {...defaultProps}
        selectedElement={makeTextElement()}
        onUpdateElement={onUpdateElement}
      />
    );
    fireEvent.click(screen.getByText('U'));
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ textDecoration: 'underline' }),
      })
    );
  });

  it('removes underline when already underlined', () => {
    const onUpdateElement = vi.fn();
    const el: LayoutElement = {
      ...makeTextElement(),
      props: {
        ...(makeTextElement().props as TextProps),
        textDecoration: 'underline',
      } as TextProps,
    };
    render(<TextTools {...defaultProps} selectedElement={el} onUpdateElement={onUpdateElement} />);
    fireEvent.click(screen.getByText('U'));
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ textDecoration: 'none' }),
      })
    );
  });

  it('adds italic to already bold text', () => {
    const onUpdateElement = vi.fn();
    const el: LayoutElement = {
      ...makeTextElement(),
      props: { ...(makeTextElement().props as TextProps), fontStyle: 'bold' } as TextProps,
    };
    render(<TextTools {...defaultProps} selectedElement={el} onUpdateElement={onUpdateElement} />);
    fireEvent.click(screen.getByText('I'));
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ fontStyle: 'bold italic' }),
      })
    );
  });

  it('removes bold from bold italic text', () => {
    const onUpdateElement = vi.fn();
    const el: LayoutElement = {
      ...makeTextElement(),
      props: { ...(makeTextElement().props as TextProps), fontStyle: 'bold italic' } as TextProps,
    };
    render(<TextTools {...defaultProps} selectedElement={el} onUpdateElement={onUpdateElement} />);
    fireEvent.click(screen.getByText('B'));
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ fontStyle: 'italic' }),
      })
    );
  });

  it('removes italic from bold italic text', () => {
    const onUpdateElement = vi.fn();
    const el: LayoutElement = {
      ...makeTextElement(),
      props: { ...(makeTextElement().props as TextProps), fontStyle: 'bold italic' } as TextProps,
    };
    render(<TextTools {...defaultProps} selectedElement={el} onUpdateElement={onUpdateElement} />);
    fireEvent.click(screen.getByText('I'));
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ fontStyle: 'bold' }),
      })
    );
  });

  it('removes bold from bold text', () => {
    const onUpdateElement = vi.fn();
    const el: LayoutElement = {
      ...makeTextElement(),
      props: { ...(makeTextElement().props as TextProps), fontStyle: 'bold' } as TextProps,
    };
    render(<TextTools {...defaultProps} selectedElement={el} onUpdateElement={onUpdateElement} />);
    fireEvent.click(screen.getByText('B'));
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ fontStyle: 'normal' }),
      })
    );
  });

  it('removes italic from italic text', () => {
    const onUpdateElement = vi.fn();
    const el: LayoutElement = {
      ...makeTextElement(),
      props: { ...(makeTextElement().props as TextProps), fontStyle: 'italic' } as TextProps,
    };
    render(<TextTools {...defaultProps} selectedElement={el} onUpdateElement={onUpdateElement} />);
    fireEvent.click(screen.getByText('I'));
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ fontStyle: 'normal' }),
      })
    );
  });

  it('calls onAddElement when subheading preset clicked', () => {
    const onAddElement = vi.fn();
    render(<TextTools {...defaultProps} onAddElement={onAddElement} />);
    fireEvent.click(screen.getByText('subheading'));
    const arg = onAddElement.mock.calls[0][0];
    expect(arg.props.text).toBe('Subheading');
    expect(arg.props.fontStyle).toBe('bold');
  });

  it('calls onAddElement when label preset clicked', () => {
    const onAddElement = vi.fn();
    render(<TextTools {...defaultProps} onAddElement={onAddElement} />);
    fireEvent.click(screen.getByText('label'));
    const arg = onAddElement.mock.calls[0][0];
    expect(arg.props.text).toBe('SECTION LABEL');
    expect(arg.props.letterSpacing).toBe(2);
  });

  it('changes font size via range slider', () => {
    const onUpdateElement = vi.fn();
    render(
      <TextTools
        {...defaultProps}
        selectedElement={makeTextElement()}
        onUpdateElement={onUpdateElement}
      />
    );
    const sizeSlider = screen
      .getByText(/Size:/)
      .closest('div')
      ?.querySelector('input[type="range"]');
    expect(sizeSlider).toBeTruthy();
    fireEvent.change(sizeSlider!, { target: { value: '24' } });
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ fontSize: 24 }),
      })
    );
  });

  it('changes line height via range slider', () => {
    const onUpdateElement = vi.fn();
    render(
      <TextTools
        {...defaultProps}
        selectedElement={makeTextElement()}
        onUpdateElement={onUpdateElement}
      />
    );
    const lhSlider = screen
      .getByText(/Line Height:/)
      .closest('div')
      ?.querySelector('input[type="range"]');
    expect(lhSlider).toBeTruthy();
    fireEvent.change(lhSlider!, { target: { value: '2.0' } });
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ lineHeight: 2 }),
      })
    );
  });

  it('changes letter spacing via range slider', () => {
    const onUpdateElement = vi.fn();
    render(
      <TextTools
        {...defaultProps}
        selectedElement={makeTextElement()}
        onUpdateElement={onUpdateElement}
      />
    );
    const lsSlider = screen
      .getByText(/Letter Spacing:/)
      .closest('div')
      ?.querySelector('input[type="range"]');
    expect(lsSlider).toBeTruthy();
    fireEvent.change(lsSlider!, { target: { value: '3' } });
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ letterSpacing: 3 }),
      })
    );
  });

  it('changes text color via color input', () => {
    const onUpdateElement = vi.fn();
    render(
      <TextTools
        {...defaultProps}
        selectedElement={makeTextElement()}
        onUpdateElement={onUpdateElement}
      />
    );
    const colorInput = screen
      .getByText('Color')
      .closest('div')
      ?.querySelector('input[type="color"]');
    expect(colorInput).toBeTruthy();
    fireEvent.change(colorInput!, { target: { value: '#ff0000' } });
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ fill: '#ff0000' }),
      })
    );
  });

  it('selects right alignment', () => {
    const onUpdateElement = vi.fn();
    render(
      <TextTools
        {...defaultProps}
        selectedElement={makeTextElement()}
        onUpdateElement={onUpdateElement}
      />
    );
    fireEvent.click(screen.getByText('Right'));
    expect(onUpdateElement).toHaveBeenCalledWith(
      'el-1',
      expect.objectContaining({
        props: expect.objectContaining({ align: 'right' }),
      })
    );
  });
});
