import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertiesPanel } from '../../renderer/components/layout/PropertiesPanel.tsx';
import type { LayoutElement, TextProps } from '../../shared/layout-types.ts';

function makeElement(overrides?: Partial<LayoutElement>): LayoutElement {
  return {
    id: 'el-1',
    type: 'text',
    x: 50,
    y: 100,
    width: 200,
    height: 40,
    rotation: 45,
    zIndex: 1,
    locked: false,
    visible: true,
    props: {
      text: 'Hello',
      fontFamily: 'Helvetica',
      fontSize: 12,
      fontStyle: 'normal' as const,
      textDecoration: 'none' as const,
      fill: '#000',
      align: 'left' as const,
      lineHeight: 1.2,
      letterSpacing: 0,
    } as TextProps,
    ...overrides,
  };
}

const defaultHandlers = {
  onUpdateElement: vi.fn(),
  onDeleteElement: vi.fn(),
  onDuplicateElement: vi.fn(),
  onBringToFront: vi.fn(),
  onSendToBack: vi.fn(),
};

describe('PropertiesPanel', () => {
  it('shows placeholder when no element selected', () => {
    render(<PropertiesPanel selectedElement={null} {...defaultHandlers} />);
    expect(screen.getByText(/Select an element/)).toBeInTheDocument();
  });

  it('shows element type in header', () => {
    render(<PropertiesPanel selectedElement={makeElement()} {...defaultHandlers} />);
    expect(screen.getByText('Text Properties')).toBeInTheDocument();
  });

  it('displays element position', () => {
    const el = makeElement({ x: 50, y: 100 });
    render(<PropertiesPanel selectedElement={el} {...defaultHandlers} />);
    const xInput = screen.getByText('X').closest('div')?.querySelector('input');
    expect(xInput).toHaveValue(50);
  });

  it('displays element size', () => {
    const el = makeElement({ width: 200, height: 40 });
    render(<PropertiesPanel selectedElement={el} {...defaultHandlers} />);
    const wLabel = screen.getByText('W');
    const input = wLabel.closest('div')?.querySelector('input');
    expect(input).toHaveValue(200);
  });

  it('displays rotation slider and text input', () => {
    const el = makeElement({ rotation: 45 });
    render(<PropertiesPanel selectedElement={el} {...defaultHandlers} />);
    expect(screen.getByText('Rotation')).toBeInTheDocument();
    const slider = screen
      .getByText('Rotation')
      .closest('div')
      ?.querySelector('input[type="range"]');
    expect(slider).toHaveValue('45');
    // Text input should show the rotation value
    const textInput = screen
      .getByText('Rotation')
      .closest('div')
      ?.querySelector('input[type="text"]');
    expect(textInput).toHaveValue('45');
  });

  it('calls onUpdateElement when X changes', () => {
    const onUpdateElement = vi.fn();
    const el = makeElement();
    render(
      <PropertiesPanel
        selectedElement={el}
        {...defaultHandlers}
        onUpdateElement={onUpdateElement}
      />
    );
    const xInput = screen.getByText('X').closest('div')?.querySelector('input');
    fireEvent.change(xInput!, { target: { value: '75' } });
    expect(onUpdateElement).toHaveBeenCalledWith('el-1', { x: 75 });
  });

  it('enforces minimum width of 5', () => {
    const onUpdateElement = vi.fn();
    const el = makeElement();
    render(
      <PropertiesPanel
        selectedElement={el}
        {...defaultHandlers}
        onUpdateElement={onUpdateElement}
      />
    );
    const wInput = screen.getByText('W').closest('div')?.querySelector('input');
    fireEvent.change(wInput!, { target: { value: '2' } });
    expect(onUpdateElement).toHaveBeenCalledWith('el-1', { width: 5 });
  });

  it('calls onDeleteElement when Delete clicked', () => {
    const onDeleteElement = vi.fn();
    render(
      <PropertiesPanel
        selectedElement={makeElement()}
        {...defaultHandlers}
        onDeleteElement={onDeleteElement}
      />
    );
    fireEvent.click(screen.getByText('Delete'));
    expect(onDeleteElement).toHaveBeenCalledWith('el-1');
  });

  it('calls onDuplicateElement when Duplicate clicked', () => {
    const onDuplicateElement = vi.fn();
    render(
      <PropertiesPanel
        selectedElement={makeElement()}
        {...defaultHandlers}
        onDuplicateElement={onDuplicateElement}
      />
    );
    fireEvent.click(screen.getByText('Duplicate'));
    expect(onDuplicateElement).toHaveBeenCalledWith('el-1');
  });

  it('calls onBringToFront when Bring Front clicked', () => {
    const onBringToFront = vi.fn();
    render(
      <PropertiesPanel
        selectedElement={makeElement()}
        {...defaultHandlers}
        onBringToFront={onBringToFront}
      />
    );
    fireEvent.click(screen.getByText('Bring Front'));
    expect(onBringToFront).toHaveBeenCalledWith('el-1');
  });

  it('calls onSendToBack when Send Back clicked', () => {
    const onSendToBack = vi.fn();
    render(
      <PropertiesPanel
        selectedElement={makeElement()}
        {...defaultHandlers}
        onSendToBack={onSendToBack}
      />
    );
    fireEvent.click(screen.getByText('Send Back'));
    expect(onSendToBack).toHaveBeenCalledWith('el-1');
  });

  it('shows Locked checkbox reflecting element state', () => {
    const el = makeElement({ locked: true });
    render(<PropertiesPanel selectedElement={el} {...defaultHandlers} />);
    const checkbox = screen.getByLabelText('Locked') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('calls onUpdateElement when Locked toggled', () => {
    const onUpdateElement = vi.fn();
    const el = makeElement({ locked: false });
    render(
      <PropertiesPanel
        selectedElement={el}
        {...defaultHandlers}
        onUpdateElement={onUpdateElement}
      />
    );
    fireEvent.click(screen.getByLabelText('Locked'));
    expect(onUpdateElement).toHaveBeenCalledWith('el-1', { locked: true });
  });

  it('shows Visible checkbox reflecting element state', () => {
    const el = makeElement({ visible: true });
    render(<PropertiesPanel selectedElement={el} {...defaultHandlers} />);
    const checkbox = screen.getByLabelText('Visible') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('calls onUpdateElement when Y changes', () => {
    const onUpdateElement = vi.fn();
    const el = makeElement();
    render(
      <PropertiesPanel
        selectedElement={el}
        {...defaultHandlers}
        onUpdateElement={onUpdateElement}
      />
    );
    const yInput = screen.getByText('Y').closest('div')?.querySelector('input');
    fireEvent.change(yInput!, { target: { value: '200' } });
    expect(onUpdateElement).toHaveBeenCalledWith('el-1', { y: 200 });
  });

  it('calls onUpdateElement when H changes with min enforcement', () => {
    const onUpdateElement = vi.fn();
    const el = makeElement();
    render(
      <PropertiesPanel
        selectedElement={el}
        {...defaultHandlers}
        onUpdateElement={onUpdateElement}
      />
    );
    const hInput = screen.getByText('H').closest('div')?.querySelector('input');
    fireEvent.change(hInput!, { target: { value: '3' } });
    expect(onUpdateElement).toHaveBeenCalledWith('el-1', { height: 5 });
  });

  it('calls onUpdateElement when rotation slider changes', () => {
    const onUpdateElement = vi.fn();
    const el = makeElement();
    render(
      <PropertiesPanel
        selectedElement={el}
        {...defaultHandlers}
        onUpdateElement={onUpdateElement}
      />
    );
    const rotSlider = screen
      .getByText('Rotation')
      .closest('div')
      ?.querySelector('input[type="range"]');
    fireEvent.change(rotSlider!, { target: { value: '90' } });
    expect(onUpdateElement).toHaveBeenCalledWith('el-1', { rotation: 90 });
  });

  it('calls onUpdateElement when rotation text input is changed and blurred', () => {
    const onUpdateElement = vi.fn();
    const el = makeElement({ rotation: 45 });
    render(
      <PropertiesPanel
        selectedElement={el}
        {...defaultHandlers}
        onUpdateElement={onUpdateElement}
      />
    );
    const textInput = screen
      .getByText('Rotation')
      .closest('div')
      ?.querySelector('input[type="text"]');
    expect(textInput).toBeTruthy();
    fireEvent.change(textInput!, { target: { value: '120' } });
    fireEvent.blur(textInput!);
    expect(onUpdateElement).toHaveBeenCalledWith('el-1', { rotation: 120 });
  });

  it('clamps rotation text input to -180..180', () => {
    const onUpdateElement = vi.fn();
    const el = makeElement({ rotation: 0 });
    render(
      <PropertiesPanel
        selectedElement={el}
        {...defaultHandlers}
        onUpdateElement={onUpdateElement}
      />
    );
    const textInput = screen
      .getByText('Rotation')
      .closest('div')
      ?.querySelector('input[type="text"]');
    fireEvent.change(textInput!, { target: { value: '999' } });
    fireEvent.blur(textInput!);
    expect(onUpdateElement).toHaveBeenCalledWith('el-1', { rotation: 180 });
  });

  it('reverts rotation text input on invalid input', () => {
    const onUpdateElement = vi.fn();
    const el = makeElement({ rotation: 45 });
    render(
      <PropertiesPanel
        selectedElement={el}
        {...defaultHandlers}
        onUpdateElement={onUpdateElement}
      />
    );
    const textInput = screen
      .getByText('Rotation')
      .closest('div')
      ?.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(textInput, { target: { value: 'abc' } });
    fireEvent.blur(textInput);
    expect(onUpdateElement).not.toHaveBeenCalled();
    expect(textInput.value).toBe('45');
  });

  it('calls onUpdateElement when Visible toggled', () => {
    const onUpdateElement = vi.fn();
    const el = makeElement({ visible: true });
    render(
      <PropertiesPanel
        selectedElement={el}
        {...defaultHandlers}
        onUpdateElement={onUpdateElement}
      />
    );
    fireEvent.click(screen.getByLabelText('Visible'));
    expect(onUpdateElement).toHaveBeenCalledWith('el-1', { visible: false });
  });

  it('supports drag-to-adjust on position labels', () => {
    const onUpdateElement = vi.fn();
    const el = makeElement({ x: 100 });
    render(
      <PropertiesPanel
        selectedElement={el}
        {...defaultHandlers}
        onUpdateElement={onUpdateElement}
      />
    );
    const xLabel = screen.getByText('X');
    // Simulate drag: mousedown on the label, then mousemove
    fireEvent.mouseDown(xLabel, { clientX: 0, button: 0 });
    // Drag right by 20px -> +10 (step/2 per pixel)
    fireEvent(window, new MouseEvent('mousemove', { clientX: 20, bubbles: true }));
    expect(onUpdateElement).toHaveBeenCalledWith('el-1', { x: 110 });
    fireEvent(window, new MouseEvent('mouseup', { bubbles: true }));
  });
});
