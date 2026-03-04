import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type Konva from 'konva';
import type { ResumeData } from '../../../shared/resume-types.ts';
import type {
  LayoutElement,
  ImageProps,
  ResumeLayout,
  TemplateDefinition,
} from '../../../shared/layout-types.ts';
import {
  createDefaultLayout,
  generateLayoutId,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '../../../shared/layout-types.ts';
import { useCanvasState } from '../../hooks/useCanvasState.ts';
import { useLayoutHistory } from '../../hooks/useLayoutHistory.ts';
import { useResumeToLayout } from '../../hooks/useResumeToLayout.ts';
import { ResumeCanvas } from './ResumeCanvas.tsx';
import { ToolPanel } from './tools/ToolPanel.tsx';
import { PropertiesPanel } from './PropertiesPanel.tsx';

interface LayoutEditorProps {
  resumeData: ResumeData | null;
}

// ─── Template Definitions ─────────────────────────────────────

function createClassicLayout(): ResumeLayout {
  const id = generateLayoutId();
  return {
    id,
    name: 'Classic',
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    backgroundColor: '#FFFFFF',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    elements: [
      // Full-width header
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 30,
        width: CANVAS_WIDTH - 80,
        height: 30,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Full Name',
          fontFamily: 'Times New Roman',
          fontSize: 24,
          fontStyle: 'bold' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'center' as const,
          lineHeight: 1.2,
          letterSpacing: 1,
          dataBinding: 'personalInfo.fullName',
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 62,
        width: CANVAS_WIDTH - 80,
        height: 18,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Job Title',
          fontFamily: 'Times New Roman',
          fontSize: 12,
          fontStyle: 'italic' as const,
          textDecoration: 'none' as const,
          fill: '#555555',
          align: 'center' as const,
          lineHeight: 1.2,
          letterSpacing: 0.5,
          dataBinding: 'personalInfo.jobTitle',
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 82,
        width: CANVAS_WIDTH - 80,
        height: 14,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'email@example.com | (555) 123-4567 | City, State',
          fontFamily: 'Times New Roman',
          fontSize: 9,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#555555',
          align: 'center' as const,
          lineHeight: 1.2,
          letterSpacing: 0,
          dataBinding: 'personalInfo.email',
        },
      },
      {
        id: generateLayoutId(),
        type: 'divider',
        x: 40,
        y: 102,
        width: CANVAS_WIDTH - 80,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal' as const,
          stroke: '#1A1A1A',
          strokeWidth: 1,
          dashEnabled: false,
          dash: [],
        },
      },
      // Summary
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 114,
        width: CANVAS_WIDTH - 80,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'PROFESSIONAL SUMMARY',
          fontFamily: 'Times New Roman',
          fontSize: 11,
          fontStyle: 'bold' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 1,
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 134,
        width: CANVAS_WIDTH - 80,
        height: 50,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'A brief professional summary.',
          fontFamily: 'Times New Roman',
          fontSize: 10,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.5,
          letterSpacing: 0,
          dataBinding: 'personalInfo.summary',
        },
      },
      // Work Experience
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 196,
        width: CANVAS_WIDTH - 80,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'WORK EXPERIENCE',
          fontFamily: 'Times New Roman',
          fontSize: 11,
          fontStyle: 'bold' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 1,
        },
      },
      {
        id: generateLayoutId(),
        type: 'divider',
        x: 40,
        y: 214,
        width: CANVAS_WIDTH - 80,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal' as const,
          stroke: '#CCCCCC',
          strokeWidth: 0.5,
          dashEnabled: false,
          dash: [],
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 222,
        width: CANVAS_WIDTH - 80,
        height: 200,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Job Title at Company\nJan 2022 - Present\n• Key responsibility',
          fontFamily: 'Times New Roman',
          fontSize: 10,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.5,
          letterSpacing: 0,
          dataBinding: 'workExperience',
        },
      },
      // Education
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 440,
        width: CANVAS_WIDTH - 80,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'EDUCATION',
          fontFamily: 'Times New Roman',
          fontSize: 11,
          fontStyle: 'bold' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 1,
        },
      },
      {
        id: generateLayoutId(),
        type: 'divider',
        x: 40,
        y: 458,
        width: CANVAS_WIDTH - 80,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal' as const,
          stroke: '#CCCCCC',
          strokeWidth: 0.5,
          dashEnabled: false,
          dash: [],
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 466,
        width: CANVAS_WIDTH - 80,
        height: 60,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Degree in Field\nInstitution\n2020 - 2024',
          fontFamily: 'Times New Roman',
          fontSize: 10,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.5,
          letterSpacing: 0,
          dataBinding: 'education',
        },
      },
      // Skills
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 544,
        width: CANVAS_WIDTH - 80,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'SKILLS',
          fontFamily: 'Times New Roman',
          fontSize: 11,
          fontStyle: 'bold' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 1,
        },
      },
      {
        id: generateLayoutId(),
        type: 'divider',
        x: 40,
        y: 562,
        width: CANVAS_WIDTH - 80,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal' as const,
          stroke: '#CCCCCC',
          strokeWidth: 0.5,
          dashEnabled: false,
          dash: [],
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 570,
        width: CANVAS_WIDTH - 80,
        height: 80,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: '• Skill 1\n• Skill 2\n• Skill 3',
          fontFamily: 'Times New Roman',
          fontSize: 10,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.6,
          letterSpacing: 0,
          dataBinding: 'skills',
        },
      },
    ],
  };
}

function createCreativeLayout(): ResumeLayout {
  const id = generateLayoutId();
  return {
    id,
    name: 'Creative',
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    backgroundColor: '#FFFFFF',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    elements: [
      // Full-width color bar
      {
        id: generateLayoutId(),
        type: 'shape',
        x: 0,
        y: 0,
        width: CANVAS_WIDTH,
        height: 110,
        rotation: 0,
        zIndex: 0,
        locked: false,
        visible: true,
        props: {
          shapeType: 'rect' as const,
          fill: '#6366F1',
          stroke: 'transparent',
          strokeWidth: 0,
          opacity: 1,
          cornerRadius: 0,
        },
      },
      // Accent bar
      {
        id: generateLayoutId(),
        type: 'shape',
        x: 0,
        y: 110,
        width: CANVAS_WIDTH,
        height: 6,
        rotation: 0,
        zIndex: 0,
        locked: false,
        visible: true,
        props: {
          shapeType: 'rect' as const,
          fill: '#F59E0B',
          stroke: 'transparent',
          strokeWidth: 0,
          opacity: 1,
          cornerRadius: 0,
        },
      },
      // Name
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 24,
        width: CANVAS_WIDTH - 80,
        height: 36,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Full Name',
          fontFamily: 'Helvetica',
          fontSize: 28,
          fontStyle: 'bold' as const,
          textDecoration: 'none' as const,
          fill: '#FFFFFF',
          align: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 1,
          dataBinding: 'personalInfo.fullName',
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 62,
        width: CANVAS_WIDTH - 80,
        height: 18,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Job Title',
          fontFamily: 'Helvetica',
          fontSize: 14,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#E0E7FF',
          align: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 2,
          dataBinding: 'personalInfo.jobTitle',
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 84,
        width: CANVAS_WIDTH - 80,
        height: 14,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'email@example.com | (555) 123-4567',
          fontFamily: 'Helvetica',
          fontSize: 9,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#C7D2FE',
          align: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 0,
          dataBinding: 'personalInfo.email',
        },
      },
      // Two column layout below header
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 132,
        width: 340,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'EXPERIENCE',
          fontFamily: 'Helvetica',
          fontSize: 11,
          fontStyle: 'bold' as const,
          textDecoration: 'none' as const,
          fill: '#6366F1',
          align: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 2,
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 40,
        y: 154,
        width: 340,
        height: 300,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Job Title at Company\nJan 2022 - Present\n• Key responsibility',
          fontFamily: 'Helvetica',
          fontSize: 9,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.5,
          letterSpacing: 0,
          dataBinding: 'workExperience',
        },
      },
      // Right sidebar
      {
        id: generateLayoutId(),
        type: 'shape',
        x: 400,
        y: 116,
        width: 1,
        height: CANVAS_HEIGHT - 140,
        rotation: 0,
        zIndex: 0,
        locked: false,
        visible: true,
        props: {
          shapeType: 'rect' as const,
          fill: '#E5E7EB',
          stroke: 'transparent',
          strokeWidth: 0,
          opacity: 1,
          cornerRadius: 0,
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 420,
        y: 132,
        width: 152,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'SKILLS',
          fontFamily: 'Helvetica',
          fontSize: 11,
          fontStyle: 'bold' as const,
          textDecoration: 'none' as const,
          fill: '#6366F1',
          align: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 2,
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 420,
        y: 154,
        width: 152,
        height: 120,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: '• Skill 1\n• Skill 2\n• Skill 3',
          fontFamily: 'Helvetica',
          fontSize: 9,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.6,
          letterSpacing: 0,
          dataBinding: 'skills',
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 420,
        y: 290,
        width: 152,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'EDUCATION',
          fontFamily: 'Helvetica',
          fontSize: 11,
          fontStyle: 'bold' as const,
          textDecoration: 'none' as const,
          fill: '#6366F1',
          align: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 2,
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 420,
        y: 312,
        width: 152,
        height: 80,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Degree in Field\nInstitution\n2020 - 2024',
          fontFamily: 'Helvetica',
          fontSize: 9,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.5,
          letterSpacing: 0,
          dataBinding: 'education',
        },
      },
    ],
  };
}

function createMinimalLayout(): ResumeLayout {
  const id = generateLayoutId();
  return {
    id,
    name: 'Minimal',
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    backgroundColor: '#FFFFFF',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    elements: [
      {
        id: generateLayoutId(),
        type: 'text',
        x: 60,
        y: 50,
        width: CANVAS_WIDTH - 120,
        height: 30,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Full Name',
          fontFamily: 'Helvetica',
          fontSize: 20,
          fontStyle: 'bold' as const,
          textDecoration: 'none' as const,
          fill: '#000000',
          align: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 0,
          dataBinding: 'personalInfo.fullName',
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 60,
        y: 80,
        width: CANVAS_WIDTH - 120,
        height: 14,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'email@example.com | (555) 123-4567 | City, State',
          fontFamily: 'Helvetica',
          fontSize: 9,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#666666',
          align: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 0,
          dataBinding: 'personalInfo.email',
        },
      },
      {
        id: generateLayoutId(),
        type: 'divider',
        x: 60,
        y: 104,
        width: CANVAS_WIDTH - 120,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal' as const,
          stroke: '#E5E7EB',
          strokeWidth: 1,
          dashEnabled: false,
          dash: [],
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 60,
        y: 120,
        width: CANVAS_WIDTH - 120,
        height: 200,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Job Title at Company\nJan 2022 - Present\n• Key responsibility',
          fontFamily: 'Helvetica',
          fontSize: 9,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.6,
          letterSpacing: 0,
          dataBinding: 'workExperience',
        },
      },
      {
        id: generateLayoutId(),
        type: 'divider',
        x: 60,
        y: 340,
        width: CANVAS_WIDTH - 120,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal' as const,
          stroke: '#E5E7EB',
          strokeWidth: 1,
          dashEnabled: false,
          dash: [],
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 60,
        y: 356,
        width: CANVAS_WIDTH - 120,
        height: 60,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Degree in Field\nInstitution\n2020 - 2024',
          fontFamily: 'Helvetica',
          fontSize: 9,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.5,
          letterSpacing: 0,
          dataBinding: 'education',
        },
      },
      {
        id: generateLayoutId(),
        type: 'divider',
        x: 60,
        y: 432,
        width: CANVAS_WIDTH - 120,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal' as const,
          stroke: '#E5E7EB',
          strokeWidth: 1,
          dashEnabled: false,
          dash: [],
        },
      },
      {
        id: generateLayoutId(),
        type: 'text',
        x: 60,
        y: 448,
        width: CANVAS_WIDTH - 120,
        height: 80,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: '• Skill 1\n• Skill 2\n• Skill 3',
          fontFamily: 'Helvetica',
          fontSize: 9,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          fill: '#1A1A1A',
          align: 'left' as const,
          lineHeight: 1.6,
          letterSpacing: 0,
          dataBinding: 'skills',
        },
      },
    ],
  };
}

const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Two-column with navy header and sidebar',
    thumbnail: 'linear-gradient(135deg, #F2F2F2 30%, #2C3E5A 30%)',
    createLayout: createDefaultLayout,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional single-column with serif fonts',
    thumbnail: 'linear-gradient(180deg, #1A1A1A 15%, #FFFFFF 15%)',
    createLayout: createClassicLayout,
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold colors with asymmetric layout',
    thumbnail: 'linear-gradient(180deg, #6366F1 18%, #F59E0B 18%, #F59E0B 19%, #FFFFFF 19%)',
    createLayout: createCreativeLayout,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean whitespace, monochrome design',
    thumbnail: 'linear-gradient(180deg, #FFFFFF 100%, #FFFFFF 100%)',
    createLayout: createMinimalLayout,
  },
];

// ─── Main Component ───────────────────────────────────────────

export function LayoutEditor({ resumeData }: LayoutEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [layout, setLayout] = useState<ResumeLayout>(() => createDefaultLayout());
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [layoutName, setLayoutName] = useState('Modern');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textareaValue, setTextareaValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { applyResumeToElements } = useResumeToLayout();

  // Apply resume data to elements
  const populatedElements = useMemo(
    () => applyResumeToElements(layout.elements, resumeData),
    [layout.elements, resumeData, applyResumeToElements]
  );

  const {
    elements,
    setElements,
    setElementsImmediate,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  } = useLayoutHistory(populatedElements);

  // Sync populated elements when resume data changes
  useEffect(() => {
    const newElements = applyResumeToElements(layout.elements, resumeData);
    resetHistory(newElements);
  }, [resumeData, layout.elements, applyResumeToElements, resetHistory]);

  const canvas = useCanvasState();

  const selectedElement = useMemo(
    () =>
      canvas.selectedIds.length === 1
        ? (elements.find((e) => e.id === canvas.selectedIds[0]) ?? null)
        : null,
    [canvas.selectedIds, elements]
  );

  // ─── Element Operations ─────────────────────────────────────

  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      setElements((prev) => prev.map((el) => (el.id === id ? { ...el, x, y } : el)));
    },
    [setElements]
  );

  const handleTransformEnd = useCallback(
    (
      id: string,
      attrs: { x: number; y: number; width: number; height: number; rotation: number }
    ) => {
      setElementsImmediate(
        elements.map((el) => {
          if (el.id !== id) return el;
          const updated = { ...el, ...attrs };
          // Lock manual size for text elements after user resize
          if (el.type === 'text') {
            updated.props = { ...el.props, autoFit: false } as LayoutElement['props'];
          }
          return updated;
        })
      );
    },
    [elements, setElementsImmediate]
  );

  const handleAddElement = useCallback(
    (partial: Omit<LayoutElement, 'id' | 'zIndex'>) => {
      const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
      const newEl: LayoutElement = {
        ...partial,
        id: generateLayoutId(),
        zIndex: maxZ + 1,
      };
      setElementsImmediate([...elements, newEl]);
      canvas.selectElement(newEl.id, false);
    },
    [elements, setElementsImmediate, canvas]
  );

  const handleUpdateElement = useCallback(
    (id: string, updates: Partial<LayoutElement>) => {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== id) return el;
          return {
            ...el,
            ...updates,
            props: (updates.props
              ? { ...el.props, ...updates.props }
              : el.props) as LayoutElement['props'],
          };
        })
      );
    },
    [setElements]
  );

  const handleDeleteElement = useCallback(
    (id: string) => {
      setElementsImmediate(elements.filter((el) => el.id !== id));
      canvas.deselectAll();
    },
    [elements, setElementsImmediate, canvas]
  );

  const handleDuplicateElement = useCallback(
    (id: string) => {
      const el = elements.find((e) => e.id === id);
      if (!el) return;
      const maxZ = elements.reduce((max, e) => Math.max(max, e.zIndex), 0);
      const dup: LayoutElement = {
        ...JSON.parse(JSON.stringify(el)),
        id: generateLayoutId(),
        x: el.x + 10,
        y: el.y + 10,
        zIndex: maxZ + 1,
      };
      setElementsImmediate([...elements, dup]);
      canvas.selectElement(dup.id, false);
    },
    [elements, setElementsImmediate, canvas]
  );

  const handleBringToFront = useCallback(
    (id: string) => {
      const maxZ = elements.reduce((max, e) => Math.max(max, e.zIndex), 0);
      setElementsImmediate(elements.map((e) => (e.id === id ? { ...e, zIndex: maxZ + 1 } : e)));
    },
    [elements, setElementsImmediate]
  );

  const handleSendToBack = useCallback(
    (id: string) => {
      const minZ = elements.reduce((min, e) => Math.min(min, e.zIndex), Infinity);
      setElementsImmediate(elements.map((e) => (e.id === id ? { ...e, zIndex: minZ - 1 } : e)));
    },
    [elements, setElementsImmediate]
  );

  // ─── Inline Text Editing ────────────────────────────────────

  const handleDblClick = useCallback(
    (id: string) => {
      const el = elements.find((e) => e.id === id);
      if (!el || el.type !== 'text') return;
      const textProps = el.props as import('../../../shared/layout-types.ts').TextProps;
      setEditingTextId(id);
      setTextareaValue(textProps.text);
    },
    [elements]
  );

  const commitTextEdit = useCallback(() => {
    if (!editingTextId) return;
    setElementsImmediate(
      elements.map((el) =>
        el.id === editingTextId
          ? {
              ...el,
              props: {
                ...(el.props as import('../../../shared/layout-types.ts').TextProps),
                text: textareaValue,
              },
            }
          : el
      )
    );
    setEditingTextId(null);
    setTextareaValue('');
  }, [editingTextId, textareaValue, elements, setElementsImmediate]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingTextId]);

  // ─── Image Picker ───────────────────────────────────────────

  const handlePickImage = useCallback(async () => {
    const result = await window.electronAPI.pickImage();
    if (!result.success || result.cancelled || !result.dataUrl) return;

    handleAddElement({
      type: 'image',
      x: 42,
      y: 24,
      width: 100,
      height: 100,
      rotation: 0,
      locked: false,
      visible: true,
      props: {
        src: result.dataUrl,
        opacity: 1,
        cornerRadius: 0,
        clipCircle: true,
      } as ImageProps,
    });
  }, [handleAddElement]);

  // ─── Template Application ───────────────────────────────────

  const handleApplyTemplate = useCallback(
    (template: TemplateDefinition) => {
      const newLayout = template.createLayout();
      const populated = applyResumeToElements(newLayout.elements, resumeData);
      setLayout(newLayout);
      resetHistory(populated);
      setLayoutName(template.name);
      canvas.deselectAll();
    },
    [applyResumeToElements, resumeData, resetHistory, canvas]
  );

  // ─── Save / Load / Export ───────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const toSave: ResumeLayout = {
        ...layout,
        name: layoutName,
        elements,
        updatedAt: new Date().toISOString(),
      };
      const result = await window.electronAPI.saveLayout(
        toSave as unknown as Record<string, unknown>
      );
      if (result && typeof result === 'object' && 'success' in result && result.success) {
        setLayout(toSave);
        setStatusMsg({ type: 'success', text: 'Layout saved!' });
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to save layout' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to save layout' });
    }
    setSaving(false);
    setTimeout(() => setStatusMsg(null), 3000);
  }, [layout, layoutName, elements]);

  const handleExportPng = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) {
      setStatusMsg({ type: 'error', text: 'Canvas not ready' });
      setTimeout(() => setStatusMsg(null), 3000);
      return;
    }
    setStatusMsg(null);
    try {
      const dataUrl = stage.toDataURL({ pixelRatio: 2 });
      const suggestedName = resumeData?.personalInfo.fullName
        ? `${resumeData.personalInfo.fullName} Resume Layout`
        : 'Resume Layout';
      const result = await window.electronAPI.exportPng(dataUrl, suggestedName);
      if (result && typeof result === 'object' && 'success' in result && result.success) {
        const filePath = 'filePath' in result ? ` to ${result.filePath}` : '';
        setStatusMsg({ type: 'success', text: `PNG exported${filePath}` });
      } else {
        const errMsg =
          result && typeof result === 'object' && 'error' in result
            ? String(result.error)
            : 'Export failed';
        setStatusMsg({ type: 'error', text: errMsg });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Export failed' });
    }
    setTimeout(() => setStatusMsg(null), 5000);
  }, [resumeData]);

  // ─── Keyboard Shortcuts ─────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingTextId) return; // Don't intercept when editing text
      // Don't intercept when focused on an input, textarea, or contentEditable
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable)
        return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (canvas.selectedIds.length > 0) {
          canvas.selectedIds.forEach((id) => handleDeleteElement(id));
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      // Arrow key nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (canvas.selectedIds.length === 0) return;
        e.preventDefault();
        const delta = canvas.showGrid ? canvas.gridSize : e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -delta : e.key === 'ArrowRight' ? delta : 0;
        const dy = e.key === 'ArrowUp' ? -delta : e.key === 'ArrowDown' ? delta : 0;
        setElements((prev) =>
          prev.map((el) => {
            if (!canvas.selectedIds.includes(el.id)) return el;
            if (canvas.showGrid) {
              // Snap to nearest grid line
              const newX = Math.round((el.x + dx) / canvas.gridSize) * canvas.gridSize;
              const newY = Math.round((el.y + dy) / canvas.gridSize) * canvas.gridSize;
              return { ...el, x: newX, y: newY };
            }
            return { ...el, x: el.x + dx, y: el.y + dy };
          })
        );
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    canvas.selectedIds,
    canvas.showGrid,
    canvas.gridSize,
    editingTextId,
    handleDeleteElement,
    undo,
    redo,
    setElements,
  ]);

  // ─── Render ─────────────────────────────────────────────────

  // Compute textarea position for inline editing
  const editingElement = editingTextId ? elements.find((e) => e.id === editingTextId) : null;
  const editingProps =
    editingElement?.type === 'text'
      ? (editingElement.props as import('../../../shared/layout-types.ts').TextProps)
      : null;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -mx-6 -my-6">
      {/* Left: Tool Panel */}
      <ToolPanel
        onAddElement={handleAddElement}
        onPickImage={handlePickImage}
        selectedElement={selectedElement}
        onUpdateElement={handleUpdateElement}
        templates={TEMPLATES}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* Center: Canvas + Toolbar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {/* Layout name */}
          <input
            type="text"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            className="px-2 py-1 text-sm font-medium rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none w-40"
          />

          <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
              />
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
              />
            </svg>
          </button>

          <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Zoom controls */}
          <button
            onClick={canvas.zoomOut}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Zoom Out"
          >
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
              />
            </svg>
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[3rem] text-center">
            {Math.round(canvas.zoom * 100)}%
          </span>
          <button
            onClick={canvas.zoomIn}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Zoom In"
          >
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
              />
            </svg>
          </button>
          <button
            onClick={canvas.resetZoom}
            className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Reset Zoom"
          >
            Fit
          </button>

          <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Grid toggle */}
          <button
            onClick={canvas.toggleGrid}
            className={`p-1.5 rounded transition-colors ${
              canvas.showGrid
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Toggle Grid"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125M12 18.375c0-.621.504-1.125 1.125-1.125"
              />
            </svg>
          </button>

          <div className="flex-1" />

          {/* Export & Save buttons */}
          <button
            onClick={handleExportPng}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Export PNG
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Layout'}
          </button>
          {statusMsg && (
            <span
              className={`px-2 py-1 text-xs rounded ${
                statusMsg.type === 'success'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}
            >
              {statusMsg.text}
            </span>
          )}
        </div>

        {/* Canvas area */}
        <div className="relative flex-1 flex overflow-hidden">
          <ResumeCanvas
            elements={elements}
            selectedIds={canvas.selectedIds}
            zoom={canvas.zoom}
            backgroundColor={layout.backgroundColor}
            showGrid={canvas.showGrid}
            snapToGrid={canvas.showGrid}
            gridSize={canvas.gridSize}
            onSelect={canvas.selectElement}
            onDeselectAll={canvas.deselectAll}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
            onDblClick={handleDblClick}
            onWheel={canvas.handleWheel}
            stageRef={stageRef}
          />

          {/* Inline text editing overlay */}
          {editingTextId && editingElement && editingProps && (
            <div className="fixed inset-0 z-50" onClick={() => commitTextEdit()}>
              <textarea
                ref={textareaRef}
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') commitTextEdit();
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left:
                    (editingElement.x + (editingProps.padding?.[0] ?? 4)) * canvas.zoom + 264 + 32, // tool panel width + padding
                  top:
                    (editingElement.y + (editingProps.padding?.[1] ?? 2)) * canvas.zoom + 48 + 32, // toolbar height + padding
                  width:
                    (editingElement.width - (editingProps.padding?.[0] ?? 4) * 2) * canvas.zoom,
                  minHeight:
                    (editingElement.height - (editingProps.padding?.[1] ?? 2) * 2) * canvas.zoom,
                  fontFamily: editingProps.fontFamily,
                  fontSize: editingProps.fontSize * canvas.zoom,
                  fontWeight: editingProps.fontStyle.includes('bold') ? 'bold' : 'normal',
                  fontStyle: editingProps.fontStyle.includes('italic') ? 'italic' : 'normal',
                  color: editingProps.fill,
                  textAlign: editingProps.align,
                  lineHeight: editingProps.lineHeight,
                  letterSpacing: editingProps.letterSpacing * canvas.zoom,
                  border: '2px solid #3B82F6',
                  borderRadius: 2,
                  padding: 2,
                  background: 'rgba(255,255,255,0.95)',
                  resize: 'both',
                  outline: 'none',
                  overflow: 'hidden',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: Properties Panel */}
      <PropertiesPanel
        selectedElement={selectedElement}
        onUpdateElement={handleUpdateElement}
        onDeleteElement={handleDeleteElement}
        onDuplicateElement={handleDuplicateElement}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
      />
    </div>
  );
}
