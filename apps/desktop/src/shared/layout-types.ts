// ─── Element Property Types ───────────────────────────────────

export interface TextProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic';
  textDecoration: 'none' | 'underline';
  fill: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  /** When bound, editing this element updates ResumeData at the given path */
  dataBinding?: string;
}

export interface ShapeProps {
  shapeType: 'rect' | 'circle' | 'line' | 'ellipse';
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  cornerRadius: number;
}

export interface ImageProps {
  /** base64 data URL or file path */
  src: string;
  opacity: number;
  cornerRadius: number;
  /** circular crop mask */
  clipCircle: boolean;
}

export interface DividerProps {
  orientation: 'horizontal' | 'vertical';
  stroke: string;
  strokeWidth: number;
  dashEnabled: boolean;
  dash: number[];
}

export interface SectionProps {
  label: string;
  /** data key to map resume data into child elements */
  dataKey?: string;
  backgroundColor: string;
  padding: number;
}

export interface IconProps {
  /** SVG path data */
  path: string;
  fill: string;
  /** icon name for reference */
  name: string;
}

// ─── Layout Element ───────────────────────────────────────────

export type ElementType = 'text' | 'shape' | 'image' | 'divider' | 'section' | 'icon';

export type ElementProps =
  | TextProps
  | ShapeProps
  | ImageProps
  | DividerProps
  | SectionProps
  | IconProps;

export interface LayoutElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  props: ElementProps;
}

// ─── Resume Layout ────────────────────────────────────────────

export interface ResumeLayout {
  id: string;
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  elements: LayoutElement[];
  createdAt: string;
  updatedAt: string;
}

// ─── Icon Library ─────────────────────────────────────────────

export interface IconDefinition {
  name: string;
  path: string;
  viewBox: string;
}

export const RESUME_ICONS: IconDefinition[] = [
  {
    name: 'phone',
    path: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'email',
    path: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
    viewBox: '0 0 24 24',
  },
  {
    name: 'location',
    path: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'linkedin',
    path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z M2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'web',
    path: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
    viewBox: '0 0 24 24',
  },
  {
    name: 'github',
    path: 'M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.49.5.09.682-.218.682-.483 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'briefcase',
    path: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0',
    viewBox: '0 0 24 24',
  },
  {
    name: 'graduation',
    path: 'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15v-3.75m0 0h10.5m-10.5 0L12 9',
    viewBox: '0 0 24 24',
  },
];

// ─── Default Colors ───────────────────────────────────────────

export const RESUME_COLORS = {
  navy: '#2C3E5A',
  darkText: '#1A1A1A',
  mutedText: '#555555',
  lightGray: '#F2F2F2',
  white: '#FFFFFF',
  accent: '#3B82F6',
  black: '#000000',
};

// ─── Default Template ─────────────────────────────────────────

let layoutIdCounter = 0;
export function generateLayoutId(): string {
  return `el-${Date.now()}-${++layoutIdCounter}`;
}

export const CANVAS_WIDTH = 612; // US Letter at 72 DPI
export const CANVAS_HEIGHT = 792;

export function createDefaultLayout(): ResumeLayout {
  const leftColWidth = 184; // ~30% of 612
  const rightColX = leftColWidth;
  const rightColWidth = CANVAS_WIDTH - leftColWidth;

  return {
    id: generateLayoutId(),
    name: 'Modern',
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    backgroundColor: RESUME_COLORS.white,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    elements: [
      // ─── Left sidebar background ───
      {
        id: generateLayoutId(),
        type: 'shape',
        x: 0,
        y: 0,
        width: leftColWidth,
        height: CANVAS_HEIGHT,
        rotation: 0,
        zIndex: 0,
        locked: true,
        visible: true,
        props: {
          shapeType: 'rect',
          fill: RESUME_COLORS.lightGray,
          stroke: 'transparent',
          strokeWidth: 0,
          opacity: 1,
          cornerRadius: 0,
        } as ShapeProps,
      },
      // ─── Right header bar ───
      {
        id: generateLayoutId(),
        type: 'shape',
        x: rightColX,
        y: 0,
        width: rightColWidth,
        height: 80,
        rotation: 0,
        zIndex: 0,
        locked: false,
        visible: true,
        props: {
          shapeType: 'rect',
          fill: RESUME_COLORS.navy,
          stroke: 'transparent',
          strokeWidth: 0,
          opacity: 1,
          cornerRadius: 0,
        } as ShapeProps,
      },
      // ─── Profile photo placeholder (circle) ───
      {
        id: generateLayoutId(),
        type: 'shape',
        x: 42,
        y: 24,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          shapeType: 'circle',
          fill: '#D1D5DB',
          stroke: RESUME_COLORS.white,
          strokeWidth: 3,
          opacity: 1,
          cornerRadius: 0,
        } as ShapeProps,
      },
      // ─── Name ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: rightColX + 20,
        y: 18,
        width: rightColWidth - 40,
        height: 30,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Full Name',
          fontFamily: 'Helvetica',
          fontSize: 22,
          fontStyle: 'bold',
          textDecoration: 'none',
          fill: RESUME_COLORS.white,
          align: 'left',
          lineHeight: 1.2,
          letterSpacing: 0.5,
          dataBinding: 'personalInfo.fullName',
        } as TextProps,
      },
      // ─── Job title (subtitle in header) ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: rightColX + 20,
        y: 50,
        width: rightColWidth - 40,
        height: 20,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Job Title',
          fontFamily: 'Helvetica',
          fontSize: 12,
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: '#CBD5E1',
          align: 'left',
          lineHeight: 1.2,
          letterSpacing: 1,
          dataBinding: 'personalInfo.jobTitle',
        } as TextProps,
      },
      // ─── Contact section header ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: 16,
        y: 140,
        width: leftColWidth - 32,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'CONTACT',
          fontFamily: 'Helvetica',
          fontSize: 10,
          fontStyle: 'bold',
          textDecoration: 'none',
          fill: RESUME_COLORS.navy,
          align: 'left',
          lineHeight: 1.2,
          letterSpacing: 2,
        } as TextProps,
      },
      // ─── Contact divider ───
      {
        id: generateLayoutId(),
        type: 'divider',
        x: 16,
        y: 158,
        width: leftColWidth - 32,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal',
          stroke: RESUME_COLORS.navy,
          strokeWidth: 1,
          dashEnabled: false,
          dash: [],
        } as DividerProps,
      },
      // ─── Email ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: 16,
        y: 166,
        width: leftColWidth - 32,
        height: 14,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'email@example.com',
          fontFamily: 'Helvetica',
          fontSize: 8,
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: RESUME_COLORS.mutedText,
          align: 'left',
          lineHeight: 1.4,
          letterSpacing: 0,
          dataBinding: 'personalInfo.email',
        } as TextProps,
      },
      // ─── Phone ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: 16,
        y: 182,
        width: leftColWidth - 32,
        height: 14,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: '(555) 123-4567',
          fontFamily: 'Helvetica',
          fontSize: 8,
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: RESUME_COLORS.mutedText,
          align: 'left',
          lineHeight: 1.4,
          letterSpacing: 0,
          dataBinding: 'personalInfo.phone',
        } as TextProps,
      },
      // ─── Location ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: 16,
        y: 198,
        width: leftColWidth - 32,
        height: 14,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'City, State',
          fontFamily: 'Helvetica',
          fontSize: 8,
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: RESUME_COLORS.mutedText,
          align: 'left',
          lineHeight: 1.4,
          letterSpacing: 0,
          dataBinding: 'personalInfo.location',
        } as TextProps,
      },
      // ─── Education section header ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: 16,
        y: 230,
        width: leftColWidth - 32,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'EDUCATION',
          fontFamily: 'Helvetica',
          fontSize: 10,
          fontStyle: 'bold',
          textDecoration: 'none',
          fill: RESUME_COLORS.navy,
          align: 'left',
          lineHeight: 1.2,
          letterSpacing: 2,
        } as TextProps,
      },
      // ─── Education divider ───
      {
        id: generateLayoutId(),
        type: 'divider',
        x: 16,
        y: 248,
        width: leftColWidth - 32,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal',
          stroke: RESUME_COLORS.navy,
          strokeWidth: 1,
          dashEnabled: false,
          dash: [],
        } as DividerProps,
      },
      // ─── Education placeholder ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: 16,
        y: 256,
        width: leftColWidth - 32,
        height: 60,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Degree in Field\nInstitution\n2020 - 2024',
          fontFamily: 'Helvetica',
          fontSize: 8,
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: RESUME_COLORS.darkText,
          align: 'left',
          lineHeight: 1.5,
          letterSpacing: 0,
          dataBinding: 'education',
        } as TextProps,
      },
      // ─── Skills section header ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: 16,
        y: 334,
        width: leftColWidth - 32,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'SKILLS',
          fontFamily: 'Helvetica',
          fontSize: 10,
          fontStyle: 'bold',
          textDecoration: 'none',
          fill: RESUME_COLORS.navy,
          align: 'left',
          lineHeight: 1.2,
          letterSpacing: 2,
        } as TextProps,
      },
      // ─── Skills divider ───
      {
        id: generateLayoutId(),
        type: 'divider',
        x: 16,
        y: 352,
        width: leftColWidth - 32,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal',
          stroke: RESUME_COLORS.navy,
          strokeWidth: 1,
          dashEnabled: false,
          dash: [],
        } as DividerProps,
      },
      // ─── Skills list ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: 16,
        y: 360,
        width: leftColWidth - 32,
        height: 120,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: '• Skill 1\n• Skill 2\n• Skill 3',
          fontFamily: 'Helvetica',
          fontSize: 8,
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: RESUME_COLORS.darkText,
          align: 'left',
          lineHeight: 1.6,
          letterSpacing: 0,
          dataBinding: 'skills',
        } as TextProps,
      },
      // ─── Summary section header ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: rightColX + 20,
        y: 96,
        width: rightColWidth - 40,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'SUMMARY',
          fontFamily: 'Helvetica',
          fontSize: 10,
          fontStyle: 'bold',
          textDecoration: 'none',
          fill: RESUME_COLORS.navy,
          align: 'left',
          lineHeight: 1.2,
          letterSpacing: 2,
        } as TextProps,
      },
      // ─── Summary divider ───
      {
        id: generateLayoutId(),
        type: 'divider',
        x: rightColX + 20,
        y: 114,
        width: rightColWidth - 40,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal',
          stroke: RESUME_COLORS.navy,
          strokeWidth: 1,
          dashEnabled: false,
          dash: [],
        } as DividerProps,
      },
      // ─── Summary text ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: rightColX + 20,
        y: 122,
        width: rightColWidth - 40,
        height: 50,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'A brief professional summary about your experience and goals.',
          fontFamily: 'Helvetica',
          fontSize: 9,
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: RESUME_COLORS.darkText,
          align: 'left',
          lineHeight: 1.5,
          letterSpacing: 0,
          dataBinding: 'personalInfo.summary',
        } as TextProps,
      },
      // ─── Work Experience section header ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: rightColX + 20,
        y: 184,
        width: rightColWidth - 40,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'WORK EXPERIENCE',
          fontFamily: 'Helvetica',
          fontSize: 10,
          fontStyle: 'bold',
          textDecoration: 'none',
          fill: RESUME_COLORS.navy,
          align: 'left',
          lineHeight: 1.2,
          letterSpacing: 2,
        } as TextProps,
      },
      // ─── Work Experience divider ───
      {
        id: generateLayoutId(),
        type: 'divider',
        x: rightColX + 20,
        y: 202,
        width: rightColWidth - 40,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal',
          stroke: RESUME_COLORS.navy,
          strokeWidth: 1,
          dashEnabled: false,
          dash: [],
        } as DividerProps,
      },
      // ─── Work Experience placeholder ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: rightColX + 20,
        y: 210,
        width: rightColWidth - 40,
        height: 200,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Job Title at Company\nCity, State | Jan 2022 - Present\n• Key responsibility or achievement\n• Another accomplishment with measurable results',
          fontFamily: 'Helvetica',
          fontSize: 9,
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: RESUME_COLORS.darkText,
          align: 'left',
          lineHeight: 1.5,
          letterSpacing: 0,
          dataBinding: 'workExperience',
        } as TextProps,
      },
      // ─── Certifications section header ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: rightColX + 20,
        y: 430,
        width: rightColWidth - 40,
        height: 16,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'CERTIFICATIONS',
          fontFamily: 'Helvetica',
          fontSize: 10,
          fontStyle: 'bold',
          textDecoration: 'none',
          fill: RESUME_COLORS.navy,
          align: 'left',
          lineHeight: 1.2,
          letterSpacing: 2,
        } as TextProps,
      },
      // ─── Certifications divider ───
      {
        id: generateLayoutId(),
        type: 'divider',
        x: rightColX + 20,
        y: 448,
        width: rightColWidth - 40,
        height: 1,
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          orientation: 'horizontal',
          stroke: RESUME_COLORS.navy,
          strokeWidth: 1,
          dashEnabled: false,
          dash: [],
        } as DividerProps,
      },
      // ─── Certifications placeholder ───
      {
        id: generateLayoutId(),
        type: 'text',
        x: rightColX + 20,
        y: 456,
        width: rightColWidth - 40,
        height: 60,
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          text: 'Certification Name - Issuer (Year)',
          fontFamily: 'Helvetica',
          fontSize: 9,
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: RESUME_COLORS.darkText,
          align: 'left',
          lineHeight: 1.5,
          letterSpacing: 0,
          dataBinding: 'certifications',
        } as TextProps,
      },
    ],
  };
}

// ─── Template Definitions ─────────────────────────────────────

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  thumbnail: string; // CSS gradient or color for preview
  createLayout: () => ResumeLayout;
}
