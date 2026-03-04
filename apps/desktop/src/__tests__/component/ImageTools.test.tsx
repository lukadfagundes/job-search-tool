import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageTools } from '../../renderer/components/layout/tools/ImageTools.tsx';
import { RESUME_ICONS } from '../../shared/layout-types.ts';

describe('ImageTools', () => {
  it('renders Upload Image button', () => {
    render(<ImageTools onAddElement={vi.fn()} onPickImage={vi.fn()} />);
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('calls onPickImage when Upload Image clicked', () => {
    const onPickImage = vi.fn();
    render(<ImageTools onAddElement={vi.fn()} onPickImage={onPickImage} />);
    fireEvent.click(screen.getByText('Upload Image'));
    expect(onPickImage).toHaveBeenCalledTimes(1);
  });

  it('renders all icon buttons', () => {
    render(<ImageTools onAddElement={vi.fn()} onPickImage={vi.fn()} />);
    for (const icon of RESUME_ICONS) {
      expect(screen.getByTitle(icon.name)).toBeInTheDocument();
    }
  });

  it('calls onAddElement with icon type when icon clicked', () => {
    const onAddElement = vi.fn();
    render(<ImageTools onAddElement={onAddElement} onPickImage={vi.fn()} />);
    fireEvent.click(screen.getByTitle('phone'));
    expect(onAddElement).toHaveBeenCalledTimes(1);
    const arg = onAddElement.mock.calls[0][0];
    expect(arg.type).toBe('icon');
    expect(arg.props.name).toBe('phone');
    expect(arg.props.path).toBe(RESUME_ICONS[0].path);
  });

  it('icon elements have default size 24x24', () => {
    const onAddElement = vi.fn();
    render(<ImageTools onAddElement={onAddElement} onPickImage={vi.fn()} />);
    fireEvent.click(screen.getByTitle('email'));
    const arg = onAddElement.mock.calls[0][0];
    expect(arg.width).toBe(24);
    expect(arg.height).toBe(24);
  });
});
