import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateTools } from '../../renderer/components/layout/tools/TemplateTools.tsx';
import type { TemplateDefinition } from '../../shared/layout-types.ts';

const templates: TemplateDefinition[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Two-column with navy header',
    thumbnail: 'linear-gradient(#000, #fff)',
    createLayout: vi.fn(),
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional single-column',
    thumbnail: 'linear-gradient(#111, #eee)',
    createLayout: vi.fn(),
  },
];

describe('TemplateTools', () => {
  it('renders template heading', () => {
    render(<TemplateTools templates={templates} onApplyTemplate={vi.fn()} />);
    expect(screen.getByText('Resume Templates')).toBeInTheDocument();
  });

  it('renders all template names', () => {
    render(<TemplateTools templates={templates} onApplyTemplate={vi.fn()} />);
    expect(screen.getByText('Modern')).toBeInTheDocument();
    expect(screen.getByText('Classic')).toBeInTheDocument();
  });

  it('renders template descriptions', () => {
    render(<TemplateTools templates={templates} onApplyTemplate={vi.fn()} />);
    expect(screen.getByText('Two-column with navy header')).toBeInTheDocument();
    expect(screen.getByText('Traditional single-column')).toBeInTheDocument();
  });

  it('calls onApplyTemplate when template clicked', () => {
    const onApplyTemplate = vi.fn();
    render(<TemplateTools templates={templates} onApplyTemplate={onApplyTemplate} />);
    fireEvent.click(screen.getByText('Modern'));
    expect(onApplyTemplate).toHaveBeenCalledWith(templates[0]);
  });

  it('calls onApplyTemplate with correct template', () => {
    const onApplyTemplate = vi.fn();
    render(<TemplateTools templates={templates} onApplyTemplate={onApplyTemplate} />);
    fireEvent.click(screen.getByText('Classic'));
    expect(onApplyTemplate).toHaveBeenCalledWith(templates[1]);
  });

  it('renders empty list without error', () => {
    expect(() => {
      render(<TemplateTools templates={[]} onApplyTemplate={vi.fn()} />);
    }).not.toThrow();
    expect(screen.getByText('Resume Templates')).toBeInTheDocument();
  });
});
