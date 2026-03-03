import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShapeTools } from '../../renderer/components/layout/tools/ShapeTools.tsx';

describe('ShapeTools', () => {
  it('renders shape buttons', () => {
    render(<ShapeTools onAddElement={vi.fn()} />);
    expect(screen.getByText('Rectangle')).toBeInTheDocument();
    expect(screen.getByText('Square')).toBeInTheDocument();
    expect(screen.getByText('Circle')).toBeInTheDocument();
    expect(screen.getByText('Ellipse')).toBeInTheDocument();
    expect(screen.getByText('Line')).toBeInTheDocument();
  });

  it('renders divider buttons', () => {
    render(<ShapeTools onAddElement={vi.fn()} />);
    expect(screen.getByText('Horizontal')).toBeInTheDocument();
    expect(screen.getByText('Vertical')).toBeInTheDocument();
  });

  it('calls onAddElement with rect shape on click', () => {
    const onAddElement = vi.fn();
    render(<ShapeTools onAddElement={onAddElement} />);
    fireEvent.click(screen.getByText('Rectangle'));
    expect(onAddElement).toHaveBeenCalledTimes(1);
    const arg = onAddElement.mock.calls[0][0];
    expect(arg.type).toBe('shape');
    expect(arg.props.shapeType).toBe('rect');
  });

  it('calls onAddElement with circle shape on click', () => {
    const onAddElement = vi.fn();
    render(<ShapeTools onAddElement={onAddElement} />);
    fireEvent.click(screen.getByText('Circle'));
    const arg = onAddElement.mock.calls[0][0];
    expect(arg.props.shapeType).toBe('circle');
    expect(arg.width).toBe(80);
    expect(arg.height).toBe(80);
  });

  it('calls onAddElement with ellipse shape on click', () => {
    const onAddElement = vi.fn();
    render(<ShapeTools onAddElement={onAddElement} />);
    fireEvent.click(screen.getByText('Ellipse'));
    const arg = onAddElement.mock.calls[0][0];
    expect(arg.props.shapeType).toBe('ellipse');
    expect(arg.width).toBe(120);
    expect(arg.height).toBe(60);
  });

  it('calls onAddElement with line shape on click', () => {
    const onAddElement = vi.fn();
    render(<ShapeTools onAddElement={onAddElement} />);
    fireEvent.click(screen.getByText('Line'));
    const arg = onAddElement.mock.calls[0][0];
    expect(arg.props.shapeType).toBe('line');
  });

  it('calls onAddElement with horizontal divider', () => {
    const onAddElement = vi.fn();
    render(<ShapeTools onAddElement={onAddElement} />);
    fireEvent.click(screen.getByText('Horizontal'));
    const arg = onAddElement.mock.calls[0][0];
    expect(arg.type).toBe('divider');
    expect(arg.props.orientation).toBe('horizontal');
  });

  it('calls onAddElement with vertical divider', () => {
    const onAddElement = vi.fn();
    render(<ShapeTools onAddElement={onAddElement} />);
    fireEvent.click(screen.getByText('Vertical'));
    const arg = onAddElement.mock.calls[0][0];
    expect(arg.type).toBe('divider');
    expect(arg.props.orientation).toBe('vertical');
  });
});
