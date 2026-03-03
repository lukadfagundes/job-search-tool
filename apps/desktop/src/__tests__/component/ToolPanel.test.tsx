import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolPanel } from '../../renderer/components/layout/tools/ToolPanel.tsx';
import type { TemplateDefinition } from '../../shared/layout-types.ts';

const mockTemplates: TemplateDefinition[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Modern layout',
    thumbnail: 'linear-gradient(#000, #fff)',
    createLayout: vi.fn(),
  },
];

const defaultProps = {
  onAddElement: vi.fn(),
  onPickImage: vi.fn(),
  selectedElement: null,
  onUpdateElement: vi.fn(),
  templates: mockTemplates,
  onApplyTemplate: vi.fn(),
};

describe('ToolPanel', () => {
  it('renders all tab labels', () => {
    render(<ToolPanel {...defaultProps} />);
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Shapes')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('defaults to templates tab', () => {
    render(<ToolPanel {...defaultProps} />);
    expect(screen.getByText('Resume Templates')).toBeInTheDocument();
  });

  it('switches to text tab on click', () => {
    render(<ToolPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('Text'));
    expect(screen.getByText('Add Text')).toBeInTheDocument();
  });

  it('switches to shapes tab on click', () => {
    render(<ToolPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('Shapes'));
    expect(screen.getByText('Rectangle')).toBeInTheDocument();
  });

  it('switches to images tab on click', () => {
    render(<ToolPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('Images'));
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('switches to colors tab on click', () => {
    render(<ToolPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('Colors'));
    expect(screen.getByText('Color Palette')).toBeInTheDocument();
  });
});
