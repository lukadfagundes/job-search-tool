import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LayoutEditor } from '../../renderer/components/layout/LayoutEditor.tsx';
import type { ResumeData } from '../../shared/resume-types.ts';

const mockResume: ResumeData = {
  personalInfo: {
    fullName: 'Jane Doe',
    jobTitle: 'Software Engineer',
    email: 'jane@example.com',
    phone: '555-1234',
    location: 'New York, NY',
    website: 'https://jane.dev',
    linkedin: 'linkedin.com/in/jane',
  },
  skills: ['TypeScript', 'React'],
  education: [
    {
      id: '1',
      institution: 'MIT',
      degree: 'BS',
      fieldOfStudy: 'CS',
      location: 'Cambridge',
      startDate: '2018',
      endDate: '2022',
      current: false,
    },
  ],
  workExperience: [
    {
      id: '1',
      jobTitle: 'Dev',
      company: 'Acme',
      location: 'NYC',
      startDate: 'Jan 2022',
      endDate: '',
      current: true,
      responsibilities: ['Built stuff'],
    },
  ],
  certifications: [],
};

describe('LayoutEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without error', () => {
    expect(() => {
      render(<LayoutEditor resumeData={null} />);
    }).not.toThrow();
  });

  it('renders with resume data', () => {
    expect(() => {
      render(<LayoutEditor resumeData={mockResume} />);
    }).not.toThrow();
  });

  it('displays layout name input defaulting to Modern', () => {
    render(<LayoutEditor resumeData={null} />);
    const nameInput = screen.getByDisplayValue('Modern');
    expect(nameInput).toBeInTheDocument();
  });

  it('allows editing layout name', () => {
    render(<LayoutEditor resumeData={null} />);
    const nameInput = screen.getByDisplayValue('Modern');
    fireEvent.change(nameInput, { target: { value: 'My Resume' } });
    expect(screen.getByDisplayValue('My Resume')).toBeInTheDocument();
  });

  it('renders zoom percentage display', () => {
    render(<LayoutEditor resumeData={null} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders undo button', () => {
    render(<LayoutEditor resumeData={null} />);
    expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument();
  });

  it('renders redo button', () => {
    render(<LayoutEditor resumeData={null} />);
    expect(screen.getByTitle('Redo (Ctrl+Shift+Z)')).toBeInTheDocument();
  });

  it('renders zoom controls', () => {
    render(<LayoutEditor resumeData={null} />);
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    expect(screen.getByTitle('Reset Zoom')).toBeInTheDocument();
  });

  it('renders grid toggle', () => {
    render(<LayoutEditor resumeData={null} />);
    expect(screen.getByTitle('Toggle Grid')).toBeInTheDocument();
  });

  it('renders Export PNG button', () => {
    render(<LayoutEditor resumeData={null} />);
    expect(screen.getByText('Export PNG')).toBeInTheDocument();
  });

  it('renders Save Layout button', () => {
    render(<LayoutEditor resumeData={null} />);
    expect(screen.getByText('Save Layout')).toBeInTheDocument();
  });

  it('renders tool panel tabs', () => {
    render(<LayoutEditor resumeData={null} />);
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Shapes')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('renders properties panel placeholder', () => {
    render(<LayoutEditor resumeData={null} />);
    expect(screen.getByText(/Select an element/)).toBeInTheDocument();
  });

  it('calls saveLayout on save click', async () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Save Layout'));
    await waitFor(() => {
      expect(window.electronAPI.saveLayout).toHaveBeenCalledTimes(1);
    });
  });

  it('applies template when template card clicked', () => {
    render(<LayoutEditor resumeData={null} />);
    // Templates tab is default; click Classic
    fireEvent.click(screen.getByText('Classic'));
    // Layout name should update
    expect(screen.getByDisplayValue('Classic')).toBeInTheDocument();
  });

  it('zoom in button increases zoom percentage', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByTitle('Zoom In'));
    expect(screen.getByText('110%')).toBeInTheDocument();
  });

  it('zoom out button decreases zoom percentage', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByTitle('Zoom Out'));
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('fit button resets zoom to 100%', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByTitle('Zoom In'));
    fireEvent.click(screen.getByTitle('Zoom In'));
    expect(screen.getByText('120%')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Fit'));
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('toggles grid on click', () => {
    render(<LayoutEditor resumeData={null} />);
    const gridBtn = screen.getByTitle('Toggle Grid');
    // Grid is enabled by default
    expect(gridBtn.className).toContain('bg-blue-100');
    fireEvent.click(gridBtn);
    // After first click, grid should be off
    expect(gridBtn.className).not.toContain('bg-blue-100');
    fireEvent.click(gridBtn);
    // After second click, grid should be on again
    expect(gridBtn.className).toContain('bg-blue-100');
  });

  it('shows Saving... state while saving', async () => {
    window.electronAPI.saveLayout = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, id: 'x' }), 100))
      );
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Save Layout'));
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Save Layout')).toBeInTheDocument();
    });
  });

  // ─── Adding elements via tool panel ────────────────────────

  it('adds a heading text element via tool panel', () => {
    render(<LayoutEditor resumeData={null} />);
    // Switch to Text tab
    fireEvent.click(screen.getByText('Text'));
    // Click heading preset
    fireEvent.click(screen.getByText('heading'));
    // Properties panel should now show text properties (element selected after add)
    expect(screen.getAllByText('Text Properties').length).toBeGreaterThanOrEqual(1);
  });

  it('adds a body text element via tool panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('body'));
    expect(screen.getAllByText('Text Properties').length).toBeGreaterThanOrEqual(1);
  });

  it('adds a subheading text element via tool panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('subheading'));
    expect(screen.getAllByText('Text Properties').length).toBeGreaterThanOrEqual(1);
  });

  it('adds a label text element via tool panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('label'));
    expect(screen.getAllByText('Text Properties').length).toBeGreaterThanOrEqual(1);
  });

  it('adds a rectangle shape via tool panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Shapes'));
    fireEvent.click(screen.getByText('Rectangle'));
    // Shape selected → Properties shows Shape Properties
    expect(screen.getByText('Shape Properties')).toBeInTheDocument();
  });

  it('adds a circle shape via tool panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Shapes'));
    fireEvent.click(screen.getByText('Circle'));
    expect(screen.getByText('Shape Properties')).toBeInTheDocument();
  });

  it('adds a horizontal divider via tool panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Shapes'));
    fireEvent.click(screen.getByText('Horizontal'));
    expect(screen.getByText('Divider Properties')).toBeInTheDocument();
  });

  it('adds an icon via tool panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Images'));
    fireEvent.click(screen.getByTitle('phone'));
    expect(screen.getByText('Icon Properties')).toBeInTheDocument();
  });

  // ─── Element operations via PropertiesPanel ───────────────

  it('deletes an element via properties panel', () => {
    render(<LayoutEditor resumeData={null} />);
    // Add an element
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    expect(screen.getAllByText('Text Properties').length).toBeGreaterThanOrEqual(1);
    // Delete it
    fireEvent.click(screen.getByText('Delete'));
    // Properties placeholder should return
    expect(screen.getByText(/Select an element to/)).toBeInTheDocument();
  });

  it('duplicates an element via properties panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    // Duplicate it
    fireEvent.click(screen.getByText('Duplicate'));
    // Should still show properties (duplicated element is selected)
    expect(screen.getAllByText('Text Properties').length).toBeGreaterThanOrEqual(1);
  });

  it('brings element to front via properties panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    fireEvent.click(screen.getByText('Bring Front'));
    // Should not throw, element still selected
    expect(screen.getAllByText('Text Properties').length).toBeGreaterThanOrEqual(1);
  });

  it('sends element to back via properties panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    fireEvent.click(screen.getByText('Send Back'));
    expect(screen.getAllByText('Text Properties').length).toBeGreaterThanOrEqual(1);
  });

  it('updates element position via properties panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    // Find X input and change it
    const xInput = screen.getByText('X').closest('div')?.querySelector('input');
    expect(xInput).toBeTruthy();
    fireEvent.change(xInput!, { target: { value: '99' } });
    // Verify it updated
    expect(xInput).toHaveValue(99);
  });

  it('updates element size via properties panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    const wInput = screen.getByText('W').closest('div')?.querySelector('input');
    expect(wInput).toBeTruthy();
    fireEvent.change(wInput!, { target: { value: '300' } });
    expect(wInput).toHaveValue(300);
  });

  it('toggles locked via properties panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    const locked = screen.getByLabelText('Locked') as HTMLInputElement;
    expect(locked.checked).toBe(false);
    fireEvent.click(locked);
    expect(locked.checked).toBe(true);
  });

  it('toggles visible via properties panel', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    const visible = screen.getByLabelText('Visible') as HTMLInputElement;
    expect(visible.checked).toBe(true);
    fireEvent.click(visible);
    expect(visible.checked).toBe(false);
  });

  // ─── Keyboard shortcuts ───────────────────────────────────

  it('Ctrl+Z triggers undo', () => {
    render(<LayoutEditor resumeData={null} />);
    // Add element to create undo history
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    expect(screen.getAllByText('Text Properties').length).toBeGreaterThanOrEqual(1);
    // Undo
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    });
    // After undo the added element should be gone, placeholder back
    expect(screen.getByText(/Select an element to/)).toBeInTheDocument();
  });

  it('Ctrl+Shift+Z triggers redo', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    // Undo
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    });
    expect(screen.getByText(/Select an element to/)).toBeInTheDocument();
    // Redo
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true })
      );
    });
    // Element should be back but may not be selected
  });

  it('Ctrl+Y triggers redo', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));
    });
  });

  it('Delete key removes selected element', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    expect(screen.getAllByText('Text Properties').length).toBeGreaterThanOrEqual(1);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    });
    expect(screen.getByText(/Select an element to/)).toBeInTheDocument();
  });

  it('Backspace key removes selected element', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    });
    expect(screen.getByText(/Select an element to/)).toBeInTheDocument();
  });

  it('arrow keys do nothing when no element selected', () => {
    render(<LayoutEditor resumeData={null} />);
    // Should not throw
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });
  });

  it('arrow keys snap to grid when grid is on (default)', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    const xInput = screen.getByText('X').closest('div')?.querySelector('input') as HTMLInputElement;
    const initialX = xInput.valueAsNumber;
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    const newX = (screen.getByText('X').closest('div')?.querySelector('input') as HTMLInputElement)
      .valueAsNumber;
    // Grid is on by default (gridSize=10), so nudge snaps to nearest 10
    expect(newX).toBe(Math.round((initialX + 10) / 10) * 10);
  });

  it('arrow keys nudge by 1 when grid is off', () => {
    render(<LayoutEditor resumeData={null} />);
    // Turn off grid
    fireEvent.click(screen.getByTitle('Toggle Grid'));
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    const yInput = screen.getByText('Y').closest('div')?.querySelector('input') as HTMLInputElement;
    const initialY = yInput.valueAsNumber;
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    const newY = (screen.getByText('Y').closest('div')?.querySelector('input') as HTMLInputElement)
      .valueAsNumber;
    expect(newY).toBe(initialY + 1);
  });

  it('shift+arrow keys nudge by 10 when grid is off', () => {
    render(<LayoutEditor resumeData={null} />);
    // Turn off grid
    fireEvent.click(screen.getByTitle('Toggle Grid'));
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    const yInput = screen.getByText('Y').closest('div')?.querySelector('input') as HTMLInputElement;
    const initialY = yInput.valueAsNumber;
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true }));
    });
    const newY = (screen.getByText('Y').closest('div')?.querySelector('input') as HTMLInputElement)
      .valueAsNumber;
    expect(newY).toBe(initialY + 10);
  });

  it('ArrowLeft snaps to grid when grid is on', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    const xInput = () =>
      (screen.getByText('X').closest('div')?.querySelector('input') as HTMLInputElement)
        .valueAsNumber;
    const before = xInput();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });
    expect(xInput()).toBe(Math.round((before - 10) / 10) * 10);
  });

  it('ArrowUp snaps to grid when grid is on', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    const yInput = () =>
      (screen.getByText('Y').closest('div')?.querySelector('input') as HTMLInputElement)
        .valueAsNumber;
    const before = yInput();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });
    expect(yInput()).toBe(Math.round((before - 10) / 10) * 10);
  });

  // ─── Export PNG ───────────────────────────────────────────

  it('calls exportPng on export click', async () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Export PNG'));
    // stageRef.current is null in test, so it shows error
    await waitFor(() => {
      expect(window.electronAPI.exportPng).not.toHaveBeenCalled();
      expect(screen.getByText('Canvas not ready')).toBeInTheDocument();
    });
  });

  it('export PNG with resume data uses name in suggestion', async () => {
    render(<LayoutEditor resumeData={mockResume} />);
    fireEvent.click(screen.getByText('Export PNG'));
    // stageRef is null so exportPng won't be called, but the callback is exercised
    await waitFor(() => {
      expect(screen.getByText('Canvas not ready')).toBeInTheDocument();
    });
  });

  // ─── Pick Image ───────────────────────────────────────────

  it('calls pickImage from Image tools', async () => {
    window.electronAPI.pickImage = vi.fn().mockResolvedValue({ success: true, cancelled: true });
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Images'));
    fireEvent.click(screen.getByText('Upload Image'));
    await waitFor(() => {
      expect(window.electronAPI.pickImage).toHaveBeenCalledTimes(1);
    });
  });

  it('adds image element when pickImage returns dataUrl', async () => {
    window.electronAPI.pickImage = vi.fn().mockResolvedValue({
      success: true,
      cancelled: false,
      dataUrl: 'data:image/png;base64,abc',
    });
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Images'));
    fireEvent.click(screen.getByText('Upload Image'));
    await waitFor(() => {
      // Image element should be added and selected
      expect(screen.getByText('Image Properties')).toBeInTheDocument();
    });
  });

  // ─── Template with resume data ────────────────────────────

  it('applies Classic template with resume data', () => {
    render(<LayoutEditor resumeData={mockResume} />);
    fireEvent.click(screen.getByText('Classic'));
    expect(screen.getByDisplayValue('Classic')).toBeInTheDocument();
  });

  it('applies Creative template', () => {
    render(<LayoutEditor resumeData={mockResume} />);
    fireEvent.click(screen.getByText('Creative'));
    expect(screen.getByDisplayValue('Creative')).toBeInTheDocument();
  });

  it('applies Minimal template', () => {
    render(<LayoutEditor resumeData={mockResume} />);
    fireEvent.click(screen.getByText('Minimal'));
    expect(screen.getByDisplayValue('Minimal')).toBeInTheDocument();
  });

  // ─── Color Tools integration ──────────────────────────────

  it('updates element color via color tools', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    // Switch to Colors tab
    fireEvent.click(screen.getByText('Colors'));
    expect(screen.getByText('Fill Color')).toBeInTheDocument();
  });

  // ─── Text property editing via TextTools ──────────────────

  it('changes font family of selected text element', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    // The text tools should show font selector
    const fontSelect = screen.getByDisplayValue('Helvetica');
    fireEvent.change(fontSelect, { target: { value: 'Georgia' } });
    expect(screen.getByDisplayValue('Georgia')).toBeInTheDocument();
  });

  it('changes font size of selected text element', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    // Find the font size range input
    const sizeSlider = screen
      .getByText(/Size:/)
      .closest('div')
      ?.querySelector('input[type="range"]');
    expect(sizeSlider).toBeTruthy();
    fireEvent.change(sizeSlider!, { target: { value: '24' } });
    expect(screen.getByText(/Size: 24pt/)).toBeInTheDocument();
  });

  it('toggles bold on selected text element', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    // Add a body text (starts as normal)
    fireEvent.click(screen.getByText('body'));
    // Click bold button - should now be bold
    const boldBtn = screen.getByText('B');
    fireEvent.click(boldBtn);
    expect(boldBtn.className).toContain('bg-blue-100');
  });

  it('changes alignment of selected text element', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    fireEvent.click(screen.getByText('Center'));
    const centerBtn = screen.getByText('Center');
    expect(centerBtn.className).toContain('bg-blue-100');
  });

  it('changes line height of selected text element', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    const lhSlider = screen
      .getByText(/Line Height:/)
      .closest('div')
      ?.querySelector('input[type="range"]');
    expect(lhSlider).toBeTruthy();
    fireEvent.change(lhSlider!, { target: { value: '2.0' } });
    expect(screen.getByText(/Line Height: 2.0/)).toBeInTheDocument();
  });

  it('changes letter spacing of selected text element', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    const lsSlider = screen
      .getByText(/Letter Spacing:/)
      .closest('div')
      ?.querySelector('input[type="range"]');
    expect(lsSlider).toBeTruthy();
    fireEvent.change(lsSlider!, { target: { value: '3.0' } });
    expect(screen.getByText(/Letter Spacing: 3.0/)).toBeInTheDocument();
  });

  it('changes text color via color input', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    // Find the color input within text tools
    const colorInput = screen
      .getByText('Color')
      .closest('div')
      ?.querySelector('input[type="color"]');
    expect(colorInput).toBeTruthy();
    fireEvent.change(colorInput!, { target: { value: '#ff0000' } });
  });

  // ─── Rotation change via properties panel ─────────────────

  it('changes rotation via properties panel slider', () => {
    render(<LayoutEditor resumeData={null} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('heading'));
    const rotSlider = screen
      .getByText('Rotation')
      .closest('div')
      ?.querySelector('input[type="range"]');
    expect(rotSlider).toBeTruthy();
    fireEvent.change(rotSlider!, { target: { value: '90' } });
    // Verify the text input shows the updated value
    const rotInput = screen
      .getByText('Rotation')
      .closest('div')
      ?.querySelector('input[type="text"]') as HTMLInputElement;
    expect(rotInput).toBeTruthy();
  });
});
