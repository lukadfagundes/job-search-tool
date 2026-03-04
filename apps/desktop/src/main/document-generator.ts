import type { ResumeData, Education, Certification } from '../shared/resume-types.ts';
import { GEMINI_ENDPOINT, enforceRateLimit, recordCall, stripDashes } from './gemini-parser.ts';
import type { GeminiResponse } from './gemini-parser.ts';
import type {
  ResumeLayout,
  TextProps,
  ShapeProps,
  DividerProps,
  IconProps,
  ImageProps,
  LayoutElement,
} from '../shared/layout-types.ts';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../shared/layout-types.ts';
import { PNG } from 'pngjs';
import * as jpegJs from 'jpeg-js';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  TabStopPosition,
  TabStopType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  VerticalAlignTable,
} from 'docx';

// ---------------------------------------------------------------------------
// Layout style extraction
// ---------------------------------------------------------------------------

interface LayoutStyle {
  font: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
}

interface LayoutStyles {
  name?: LayoutStyle;
  contact?: LayoutStyle;
  sectionHeader?: LayoutStyle;
  body?: LayoutStyle;
  backgroundColor?: string;
}

/**
 * Extract styling from a saved ResumeLayout's text elements.
 * Maps dataBinding keys to font/color/size styles so the generated
 * PDF/DOCX matches the user's visual design.
 */
function extractLayoutStyles(layout: ResumeLayout): LayoutStyles {
  const styles: LayoutStyles = { backgroundColor: layout.backgroundColor };
  const textElements = layout.elements.filter(
    (el): el is LayoutElement & { props: TextProps } => el.type === 'text' && 'text' in el.props
  );

  for (const el of textElements) {
    const tp = el.props as TextProps;
    const style: LayoutStyle = {
      font: tp.fontFamily,
      fontSize: tp.fontSize,
      color: tp.fill,
      bold: tp.fontStyle.includes('bold'),
      italic: tp.fontStyle.includes('italic'),
      align: tp.align,
      lineHeight: tp.lineHeight,
    };

    const binding = tp.dataBinding;
    if (binding === 'personalInfo.fullName') {
      styles.name = style;
    } else if (binding === 'personalInfo.email' || binding === 'personalInfo.phone') {
      if (!styles.contact) styles.contact = style;
    } else if (
      binding === 'workExperience' ||
      binding === 'personalInfo.summary' ||
      binding === 'education' ||
      binding === 'skills' ||
      binding === 'certifications'
    ) {
      if (!styles.body) styles.body = style;
    }
  }

  // Find section headers (bold text without dataBinding, typically section labels)
  const sectionHeaderEl = textElements.find(
    (el) => !el.props.dataBinding && el.props.fontStyle.includes('bold') && el.props.fontSize >= 10
  );
  if (sectionHeaderEl) {
    const tp = sectionHeaderEl.props as TextProps;
    styles.sectionHeader = {
      font: tp.fontFamily,
      fontSize: tp.fontSize,
      color: tp.fill,
      bold: true,
      italic: false,
      align: tp.align,
      lineHeight: tp.lineHeight,
    };
  }

  return styles;
}

// ---------------------------------------------------------------------------
// Data binding resolution (server-side version of useResumeToLayout.resolveBinding)
// ---------------------------------------------------------------------------

interface TailoredData {
  professionalSummary?: string;
  objectiveStatement?: string;
  targetTitle?: string;
  workExperience: Array<{
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    responsibilities: string[];
  }>;
  skills: Record<string, string[]> | string[];
}

/**
 * Resolve a dataBinding path to the final text for PDF/DOCX rendering.
 * Uses AI-tailored content where available, falling back to resume data.
 */
export function resolveTailoredText(
  binding: string,
  tailored: TailoredData,
  resumeData: ResumeData
): string | null {
  // Personal info fields (from original resume data)
  if (binding === 'personalInfo.fullName') return resumeData.personalInfo.fullName || null;
  if (binding === 'personalInfo.email') return resumeData.personalInfo.email || null;
  if (binding === 'personalInfo.phone') return resumeData.personalInfo.phone || null;
  if (binding === 'personalInfo.location') return resumeData.personalInfo.location || null;
  if (binding === 'personalInfo.linkedin') return resumeData.personalInfo.linkedin || null;
  if (binding === 'personalInfo.website') return resumeData.personalInfo.website || null;
  if (binding === 'personalInfo.jobTitle') {
    return tailored.targetTitle || resumeData.personalInfo.jobTitle || null;
  }
  if (binding === 'personalInfo.summary') {
    return tailored.professionalSummary || tailored.objectiveStatement || null;
  }

  // Work experience (tailored)
  if (binding === 'workExperience') {
    if (!tailored.workExperience.length) return null;
    return tailored.workExperience
      .map((w) => {
        const dateRange = w.current ? `${w.startDate} - Present` : `${w.startDate} - ${w.endDate}`;
        const header = `${w.jobTitle} at ${w.company}\n${w.location} | ${dateRange}`;
        const bullets = w.responsibilities
          .filter((r) => r.trim().length > 0)
          .map((r) => `\u2022 ${r}`)
          .join('\n');
        return bullets ? `${header}\n${bullets}` : header;
      })
      .join('\n\n');
  }

  // Skills (tailored)
  if (binding === 'skills') {
    const skills = tailored.skills;
    if (Array.isArray(skills)) {
      if (!skills.length) return null;
      return skills.map((s) => `\u2022 ${s}`).join('\n');
    }
    const entries = Object.entries(skills);
    if (!entries.length) return null;
    return entries.map(([category, items]) => `${category}: ${items.join(', ')}`).join('\n');
  }

  // Education (from resume data)
  if (binding === 'education') {
    if (!resumeData.education.length) return null;
    return resumeData.education
      .map((e) => {
        const dateRange = e.current ? `${e.startDate} - Present` : `${e.startDate} - ${e.endDate}`;
        const degreeLine = e.fieldOfStudy ? `${e.degree} in ${e.fieldOfStudy}` : e.degree;
        return `${degreeLine}\n${e.institution}\n${dateRange}`;
      })
      .join('\n\n');
  }

  // Certifications (from resume data)
  if (binding === 'certifications') {
    if (!resumeData.certifications.length) return null;
    return resumeData.certifications
      .map((c) => `${c.name} - ${c.issuer} (${c.dateObtained})`)
      .join('\n');
  }

  return null;
}

// ---------------------------------------------------------------------------
// Font mapping for pdfmake
// ---------------------------------------------------------------------------

function mapFontFamily(family: string): string {
  const lower = family.toLowerCase();
  if (lower.includes('times')) return 'Times';
  return 'Helvetica';
}

// ---------------------------------------------------------------------------
// Visual PDF layout builder (pixel-perfect canvas → PDF)
// ---------------------------------------------------------------------------

/**
 * Build a pdfmake document that reproduces the visual canvas layout using
 * absolute positioning. Canvas is 612×792 which maps 1:1 to PDF points.
 */
export function buildVisualPdfLayout(
  tailored: TailoredData,
  resumeData: ResumeData,
  layout: ResumeLayout
): PdfDocDefinition {
  const content: PdfContent[] = [];

  // Page background (if not white)
  const bg = layout.backgroundColor;
  if (bg && bg !== '#FFFFFF' && bg !== '#ffffff' && bg !== 'white') {
    content.push({
      canvas: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          w: CANVAS_WIDTH,
          h: CANVAS_HEIGHT,
          color: bg,
        },
      ],
      absolutePosition: { x: 0, y: 0 },
    });
  }

  // Pre-scan: identify data-bound elements that resolve to empty content.
  const emptyBindings = new Set<string>();
  for (const el of layout.elements) {
    if (el.type !== 'text' || !el.visible) continue;
    const tp = el.props as TextProps;
    if (tp.dataBinding) {
      const resolved = resolveTailoredText(tp.dataBinding, tailored, resumeData);
      if (resolved === null) emptyBindings.add(tp.dataBinding);
    }
  }

  const sectionBindingMap: Record<string, string> = {
    CERTIFICATIONS: 'certifications',
    EDUCATION: 'education',
    SKILLS: 'skills',
    'WORK EXPERIENCE': 'workExperience',
    SUMMARY: 'personalInfo.summary',
    CONTACT: '__contact__',
  };

  // Build suppressed element set (headers/dividers for empty sections)
  const suppressedElementIds = new Set<string>();
  const visibleEls = layout.elements.filter((el) => el.visible);
  for (const el of visibleEls) {
    if (el.type !== 'text') continue;
    const tp = el.props as TextProps;
    if (!tp.dataBinding && tp.fontStyle.includes('bold') && tp.fontSize >= 10) {
      const headerLabel = tp.text.trim().toUpperCase();
      const bindingKey = sectionBindingMap[headerLabel];
      if (bindingKey && emptyBindings.has(bindingKey)) {
        suppressedElementIds.add(el.id);
        for (const d of visibleEls) {
          if (d.type === 'divider' && Math.abs(d.x - el.x) < 20 && d.y > el.y && d.y - el.y < 30) {
            suppressedElementIds.add(d.id);
          }
        }
      }
    }
  }

  // Detect column structure
  const structure = analyzeLayoutColumns(layout);

  // Separate elements into:
  // 1. Decorative (shapes, icons, images) → absolute positioned
  // 2. Header-bar text (name, job title inside header) → absolute positioned
  // 3. Column content (text + dividers below header) → flowing stacks
  const headerHeight = structure.headerBg?.height ?? 0;

  for (const el of visibleEls) {
    if (suppressedElementIds.has(el.id)) continue;
    if (el.type === 'shape' || el.type === 'icon' || el.type === 'image') {
      const item = renderElementToPdf(el, tailored, resumeData);
      if (item) content.push(item);
    }
    // Header-bar text (within header y-range, in main/non-sidebar column)
    if (el.type === 'text' && el.y < headerHeight) {
      const colIdx = classifyColumn(el, structure);
      const inSidebar = structure.columns[colIdx]?.bgColor != null;
      if (!inSidebar) {
        const item = renderTextToPdf(el, tailored, resumeData);
        if (item) content.push(item);
      }
    }
  }

  // Build flowing stacks for each column
  const flowableTypes = new Set(['text', 'divider']);
  const columnElements: LayoutElement[][] = structure.columns.map(() => []);

  for (const el of visibleEls) {
    if (suppressedElementIds.has(el.id)) continue;
    if (!flowableTypes.has(el.type)) continue;
    // Skip header-bar text already rendered above
    if (el.type === 'text' && el.y < headerHeight) {
      const colIdx = classifyColumn(el, structure);
      const inSidebar = structure.columns[colIdx]?.bgColor != null;
      if (!inSidebar) continue;
    }
    const colIdx = classifyColumn(el, structure);
    columnElements[colIdx].push(el);
  }

  // For each column, sort by y-position and build a flowing stack
  for (let colIdx = 0; colIdx < structure.columns.length; colIdx++) {
    const col = structure.columns[colIdx];
    const els = columnElements[colIdx].sort((a, b) => a.y - b.y);
    if (els.length === 0) continue;

    // Column starts at the y of its first element (or below header)
    const startY = els[0].y;
    const padX = 4; // small horizontal padding

    const stackItems: PdfContent[] = [];
    for (const el of els) {
      if (el.type === 'divider') {
        const dp = el.props as DividerProps;
        stackItems.push({
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: el.width,
              y2: 0,
              lineWidth: dp.strokeWidth,
              lineColor: dp.stroke,
              ...(dp.dashEnabled && dp.dash.length > 0
                ? { dash: { length: dp.dash[0], space: dp.dash[1] ?? dp.dash[0] } }
                : {}),
            },
          ],
          margin: [0, 2, 0, 2],
        });
        continue;
      }

      if (el.type === 'text') {
        const tp = el.props as TextProps;
        const fontName = mapFontFamily(tp.fontFamily);
        const availWidth = Math.max(1, col.width - padX * 2);

        // Structured data-bound content
        if (tp.dataBinding) {
          const structured = renderFlowingStructuredContent(
            tp.dataBinding,
            tailored,
            resumeData,
            tp,
            availWidth,
            fontName
          );
          if (structured) {
            stackItems.push(...structured);
            continue;
          }
          // Skip if binding resolves to null (empty section)
          const resolved = resolveTailoredText(tp.dataBinding, tailored, resumeData);
          if (resolved === null) continue;
          // Fall through to plain text for resolved bindings
          stackItems.push({
            text: resolved,
            fontSize: tp.fontSize,
            font: fontName,
            bold: tp.fontStyle.includes('bold'),
            italics: tp.fontStyle.includes('italic'),
            color: tp.fill,
            alignment: tp.align,
            lineHeight: tp.lineHeight,
            width: availWidth,
            ...(tp.textDecoration === 'underline' ? { decoration: 'underline' } : {}),
          });
          continue;
        }

        // Static text (section headers, labels)
        stackItems.push({
          text: tp.text,
          fontSize: tp.fontSize,
          font: fontName,
          bold: tp.fontStyle.includes('bold'),
          italics: tp.fontStyle.includes('italic'),
          color: tp.fill,
          alignment: tp.align,
          lineHeight: tp.lineHeight,
          width: availWidth,
          margin:
            tp.fontStyle.includes('bold') && tp.fontSize >= 10
              ? [0, 6, 0, 0] // Section headers get top spacing
              : undefined,
          ...(tp.textDecoration === 'underline' ? { decoration: 'underline' } : {}),
        });
      }
    }

    if (stackItems.length > 0) {
      content.push({
        stack: stackItems,
        width: col.width - padX * 2,
        absolutePosition: { x: col.x + padX, y: startY },
      });
    }
  }

  return {
    content,
    defaultStyle: { font: 'Helvetica', fontSize: 10, lineHeight: 1.3 },
    styles: {},
    pageMargins: [0, 0, 0, 0],
    pageSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  };
}

function renderElementToPdf(
  el: LayoutElement,
  tailored: TailoredData,
  resumeData: ResumeData
): PdfContent | null {
  switch (el.type) {
    case 'shape':
      return renderShapeToPdf(el);
    case 'text':
      return renderTextToPdf(el, tailored, resumeData);
    case 'divider':
      return renderDividerToPdf(el);
    case 'icon':
      return renderIconToPdf(el);
    case 'image':
      return renderImageToPdf(el);
    default:
      return null;
  }
}

function renderShapeToPdf(el: LayoutElement): PdfContent | null {
  const p = el.props as ShapeProps;

  switch (p.shapeType) {
    case 'rect':
      return {
        canvas: [
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: el.width,
            h: el.height,
            color: p.fill,
            r: p.cornerRadius || 0,
            ...(p.stroke && p.stroke !== 'transparent' && p.strokeWidth > 0
              ? { lineWidth: p.strokeWidth, lineColor: p.stroke }
              : {}),
          },
        ],
        absolutePosition: { x: el.x, y: el.y },
      };
    case 'circle': {
      const r = Math.min(el.width, el.height) / 2;
      return {
        canvas: [
          {
            type: 'ellipse',
            x: el.width / 2,
            y: el.height / 2,
            r1: r,
            r2: r,
            color: p.fill,
            ...(p.stroke && p.stroke !== 'transparent' && p.strokeWidth > 0
              ? { lineWidth: p.strokeWidth, lineColor: p.stroke }
              : {}),
          },
        ],
        absolutePosition: { x: el.x, y: el.y },
      };
    }
    case 'ellipse':
      return {
        canvas: [
          {
            type: 'ellipse',
            x: el.width / 2,
            y: el.height / 2,
            r1: el.width / 2,
            r2: el.height / 2,
            color: p.fill,
            ...(p.stroke && p.stroke !== 'transparent' && p.strokeWidth > 0
              ? { lineWidth: p.strokeWidth, lineColor: p.stroke }
              : {}),
          },
        ],
        absolutePosition: { x: el.x, y: el.y },
      };
    case 'line':
      return {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: el.width,
            y2: 0,
            lineWidth: p.strokeWidth || 2,
            lineColor: p.stroke || p.fill,
          },
        ],
        absolutePosition: { x: el.x, y: el.y },
      };
    default:
      return null;
  }
}

/**
 * Render a text element with absolute positioning.
 * Used only for header-bar text (name, job title) that doesn't need flowing layout.
 */
function renderTextToPdf(
  el: LayoutElement,
  tailored: TailoredData,
  resumeData: ResumeData
): PdfContent | null {
  const p = el.props as TextProps;

  const padH = p.padding?.[0] ?? 4;
  const padV = p.padding?.[1] ?? 2;
  const availWidth = Math.max(1, el.width - padH * 2);
  const basePos = { x: el.x + padH, y: el.y + padV };
  const fontName = mapFontFamily(p.fontFamily);

  let text = p.text;
  if (p.dataBinding) {
    const resolved = resolveTailoredText(p.dataBinding, tailored, resumeData);
    if (resolved === null) return null;
    text = resolved;
  }
  if (!text) return null;

  return {
    text,
    fontSize: p.fontSize,
    font: fontName,
    bold: p.fontStyle.includes('bold'),
    italics: p.fontStyle.includes('italic'),
    color: p.fill,
    alignment: p.align,
    lineHeight: p.lineHeight,
    width: availWidth,
    absolutePosition: basePos,
    ...(p.textDecoration === 'underline' ? { decoration: 'underline' } : {}),
  };
}

/**
 * Render data-bound content as flowing PdfContent items (no absolutePosition).
 * Returns an array of items for inclusion in a column stack, or null if the
 * binding isn't a structured type or has no data.
 */
function renderFlowingStructuredContent(
  binding: string,
  tailored: TailoredData,
  resumeData: ResumeData,
  style: TextProps,
  width: number,
  font: string
): PdfContent[] | null {
  const color = style.fill;
  const fontSize = style.fontSize;
  const lineHeight = style.lineHeight;

  if (binding === 'workExperience') {
    if (!tailored.workExperience.length) return null;
    const items: PdfContent[] = [];
    for (let i = 0; i < tailored.workExperience.length; i++) {
      const w = tailored.workExperience[i];
      const dateRange = w.current ? `${w.startDate} - Present` : `${w.startDate} - ${w.endDate}`;
      const bullets = w.responsibilities.filter((r) => r.trim().length > 0);

      items.push({
        text: `${w.jobTitle} at ${w.company}`,
        fontSize,
        font,
        color,
        lineHeight,
        width,
        bold: true,
        margin: i > 0 ? [0, 8, 0, 0] : undefined,
      });
      items.push({
        text: `${w.location} | ${dateRange}`,
        fontSize,
        font,
        color,
        lineHeight,
        width,
        italics: true,
      });
      for (const bullet of bullets) {
        items.push({
          text: `\u2022 ${bullet}`,
          fontSize,
          font,
          color,
          lineHeight,
          width,
          margin: [6, 0, 0, 0],
        });
      }
    }
    return items;
  }

  if (binding === 'education') {
    if (!resumeData.education.length) return null;
    const items: PdfContent[] = [];
    for (let i = 0; i < resumeData.education.length; i++) {
      const e = resumeData.education[i];
      const dateRange = e.current ? `${e.startDate} - Present` : `${e.startDate} - ${e.endDate}`;
      const degreeLine = e.fieldOfStudy ? `${e.degree} in ${e.fieldOfStudy}` : e.degree;

      items.push({
        text: degreeLine,
        fontSize,
        font,
        color,
        lineHeight,
        width,
        bold: true,
        margin: i > 0 ? [0, 4, 0, 0] : undefined,
      });
      items.push({
        text: e.institution,
        fontSize,
        font,
        color,
        lineHeight,
        width,
      });
      items.push({
        text: dateRange,
        fontSize,
        font,
        color,
        lineHeight,
        width,
        italics: true,
      });
    }
    return items;
  }

  if (binding === 'skills') {
    const skills = tailored.skills;
    const items: PdfContent[] = [];
    if (Array.isArray(skills)) {
      if (!skills.length) return null;
      for (const s of skills) {
        items.push({ text: `\u2022 ${s}`, fontSize, font, color, lineHeight, width });
      }
    } else {
      const entries = Object.entries(skills);
      if (!entries.length) return null;
      for (let i = 0; i < entries.length; i++) {
        const [category, skillList] = entries[i];
        items.push({
          text: [
            { text: `${category}: `, bold: true, fontSize, font, color },
            { text: skillList.join(', '), fontSize, font, color },
          ] as PdfContent[],
          lineHeight,
          width,
          margin: i > 0 ? [0, 3, 0, 0] : undefined,
        });
      }
    }
    return items;
  }

  if (binding === 'certifications') {
    if (!resumeData.certifications.length) return null;
    const items: PdfContent[] = [];
    for (const c of resumeData.certifications) {
      items.push({
        text: `${c.name} - ${c.issuer} (${c.dateObtained})`,
        fontSize,
        font,
        color,
        lineHeight,
        width,
      });
    }
    return items;
  }

  return null;
}

function renderDividerToPdf(el: LayoutElement): PdfContent {
  const p = el.props as DividerProps;
  const isH = p.orientation === 'horizontal';

  return {
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: isH ? el.width : 0,
        y2: isH ? 0 : el.height,
        lineWidth: p.strokeWidth,
        lineColor: p.stroke,
        ...(p.dashEnabled && p.dash.length > 0
          ? { dash: { length: p.dash[0], space: p.dash[1] ?? p.dash[0] } }
          : {}),
      },
    ],
    absolutePosition: { x: el.x, y: el.y },
  };
}

function renderIconToPdf(el: LayoutElement): PdfContent | null {
  const p = el.props as IconProps;
  if (!p.path) return null;

  const vb = p.viewBox || '0 0 24 24';
  const fillAttr =
    p.filled !== false ? `fill="${p.fill}"` : `fill="none" stroke="${p.fill}" stroke-width="1.5"`;

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${el.width}" height="${el.height}" ${fillAttr}><path d="${p.path}"/></svg>`,
    width: el.width,
    height: el.height,
    absolutePosition: { x: el.x, y: el.y },
  };
}

/**
 * Decode a base64 data URL image into raw RGBA pixel data.
 * Supports both PNG and JPEG sources.
 */
function decodeImageDataUrl(
  dataUrl: string
): { data: Buffer; width: number; height: number } | null {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;

  const mime = match[1];
  const raw = Buffer.from(match[2], 'base64');

  if (mime === 'image/png') {
    const png = PNG.sync.read(raw);
    return { data: png.data as unknown as Buffer, width: png.width, height: png.height };
  }

  // JPEG (or other) → decode via jpeg-js
  const decoded = jpegJs.decode(raw, { useTArray: true, formatAsRGBA: true });
  return { data: Buffer.from(decoded.data), width: decoded.width, height: decoded.height };
}

/**
 * Apply a circular alpha mask to raw RGBA pixel data, then re-encode as
 * a base64 PNG data URL. Crops to a centered square first so the result
 * is a perfect circle, not an oval.
 */
export function cropImageToCircle(dataUrl: string): string | null {
  const img = decodeImageDataUrl(dataUrl);
  if (!img) return null;

  const size = Math.min(img.width, img.height);
  const offsetX = Math.floor((img.width - size) / 2);
  const offsetY = Math.floor((img.height - size) / 2);
  const radius = size / 2;

  const out = new PNG({ width: size, height: size });

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcIdx = ((y + offsetY) * img.width + (x + offsetX)) * 4;
      const dstIdx = (y * size + x) * 4;

      out.data[dstIdx] = img.data[srcIdx];
      out.data[dstIdx + 1] = img.data[srcIdx + 1];
      out.data[dstIdx + 2] = img.data[srcIdx + 2];
      out.data[dstIdx + 3] = img.data[srcIdx + 3];

      // Apply circular mask
      const dx = x - radius;
      const dy = y - radius;
      if (dx * dx + dy * dy > radius * radius) {
        out.data[dstIdx + 3] = 0;
      }
    }
  }

  const pngBuf = PNG.sync.write(out);
  return `data:image/png;base64,${pngBuf.toString('base64')}`;
}

function renderImageToPdf(el: LayoutElement): PdfContent | null {
  const p = el.props as ImageProps;
  if (!p.src) return null;

  // For circular-clipped images, pre-process with pixel-level alpha mask
  if (p.clipCircle) {
    const circularSrc = cropImageToCircle(p.src);
    if (!circularSrc) return null;
    return {
      image: circularSrc,
      fit: [el.width, el.height],
      absolutePosition: { x: el.x, y: el.y },
    };
  }

  return {
    image: p.src,
    fit: [el.width, el.height],
    absolutePosition: { x: el.x, y: el.y },
  };
}

// ---------------------------------------------------------------------------
// Visual DOCX layout builder (table-based columns)
// ---------------------------------------------------------------------------

interface ColumnRegion {
  x: number;
  width: number;
  bgColor?: string;
}

interface LayoutStructure {
  headerBg?: { color: string; height: number };
  columns: ColumnRegion[];
}

/**
 * Analyze canvas layout to detect column structure.
 * Finds full-height rect shapes (sidebar) and header bars.
 */
export function analyzeLayoutColumns(layout: ResumeLayout): LayoutStructure {
  const shapes = layout.elements.filter(
    (el): el is LayoutElement & { props: ShapeProps } =>
      el.type === 'shape' && el.visible && (el.props as ShapeProps).shapeType === 'rect'
  );

  // Find header bar: wide rect near top
  const headerBar = shapes.find(
    (s) => s.y === 0 && s.height < CANVAS_HEIGHT * 0.2 && s.width > CANVAS_WIDTH * 0.3
  );

  // Find sidebar: tall rect that spans most of the page height
  const sidebar = shapes.find(
    (s) => s.y === 0 && s.height >= CANVAS_HEIGHT * 0.8 && s.width < CANVAS_WIDTH * 0.5
  );

  const structure: LayoutStructure = { columns: [] };

  if (headerBar) {
    const p = headerBar.props as ShapeProps;
    if (p.fill && p.fill !== 'transparent') {
      structure.headerBg = { color: p.fill, height: headerBar.height };
    }
  }

  if (sidebar) {
    const p = sidebar.props as ShapeProps;
    const sidebarIsLeft = sidebar.x < CANVAS_WIDTH / 2;

    if (sidebarIsLeft) {
      structure.columns = [
        { x: 0, width: sidebar.width, bgColor: p.fill !== 'transparent' ? p.fill : undefined },
        { x: sidebar.width, width: CANVAS_WIDTH - sidebar.width },
      ];
    } else {
      structure.columns = [
        { x: 0, width: sidebar.x },
        {
          x: sidebar.x,
          width: sidebar.width,
          bgColor: p.fill !== 'transparent' ? p.fill : undefined,
        },
      ];
    }
  } else {
    // Single column
    structure.columns = [{ x: 0, width: CANVAS_WIDTH }];
  }

  return structure;
}

/**
 * Classify a text element into a column index based on its x position.
 */
function classifyColumn(el: LayoutElement, structure: LayoutStructure): number {
  const centerX = el.x + el.width / 2;
  for (let i = 0; i < structure.columns.length; i++) {
    const col = structure.columns[i];
    if (centerX >= col.x && centerX < col.x + col.width) return i;
  }
  return 0;
}

/**
 * Build a DOCX document that approximates the visual canvas layout using
 * table cells for column structure and cell shading for backgrounds.
 */
export function buildVisualDocxLayout(
  tailored: TailoredData,
  resumeData: ResumeData,
  layout: ResumeLayout
): { paragraphs?: Paragraph[]; doc?: Document } {
  const structure = analyzeLayoutColumns(layout);

  // Get text style info from layout
  const ls = extractLayoutStyles(layout);
  const s = buildDocxStylesFromLayout(ls);

  // If single column, fall back to sequential layout (handled by caller)
  if (structure.columns.length < 2) {
    return {};
  }

  // Pre-scan: identify data-bound elements that resolve to empty content.
  const docxEmptyBindings = new Set<string>();
  for (const el of layout.elements) {
    if (el.type !== 'text' || !el.visible) continue;
    const tp = el.props as TextProps;
    if (tp.dataBinding) {
      const resolved = resolveTailoredText(tp.dataBinding, tailored, resumeData);
      if (resolved === null) docxEmptyBindings.add(tp.dataBinding);
    }
  }

  const docxSectionMap: Record<string, string> = {
    CERTIFICATIONS: 'certifications',
    EDUCATION: 'education',
    SKILLS: 'skills',
    'WORK EXPERIENCE': 'workExperience',
    SUMMARY: 'personalInfo.summary',
    CONTACT: '__contact__',
  };

  // Identify elements to suppress (headers/dividers for empty sections)
  const docxSuppressed = new Set<string>();
  const allVisible = layout.elements.filter((el) => el.visible);
  for (const el of allVisible) {
    if (el.type !== 'text') continue;
    const tp = el.props as TextProps;
    if (!tp.dataBinding && tp.fontStyle.includes('bold') && tp.fontSize >= 10) {
      const label = tp.text.trim().toUpperCase();
      const bk = docxSectionMap[label];
      if (bk && docxEmptyBindings.has(bk)) {
        docxSuppressed.add(el.id);
        for (const d of allVisible) {
          if (d.type === 'divider' && Math.abs(d.x - el.x) < 20 && d.y > el.y && d.y - el.y < 30) {
            docxSuppressed.add(d.id);
          }
        }
      }
    }
  }

  // Gather visible text, divider, and image elements sorted by y position
  const textEls = layout.elements
    .filter(
      (el) =>
        el.visible &&
        !docxSuppressed.has(el.id) &&
        (el.type === 'text' || el.type === 'divider' || el.type === 'image')
    )
    .sort((a, b) => a.y - b.y);

  // Classify elements into columns
  const columnContent: LayoutElement[][] = structure.columns.map(() => []);
  const headerContent: LayoutElement[] = [];

  for (const el of textEls) {
    const colIdx = classifyColumn(el, structure);
    // Only put in header if within header y-range AND not in a sidebar column
    // (sidebar columns have bgColor set, indicating they're distinct regions)
    const inSidebarCol = structure.columns[colIdx]?.bgColor != null;
    if (structure.headerBg && el.y < structure.headerBg.height && !inSidebarCol) {
      headerContent.push(el);
    } else {
      columnContent[colIdx].push(el);
    }
  }

  // Build header paragraphs
  const headerParagraphs = buildColumnParagraphs(headerContent, tailored, resumeData, s);

  // Build column paragraphs
  const colParagraphs = columnContent.map((els) =>
    buildColumnParagraphs(els, tailored, resumeData, s)
  );

  // Ensure each column has at least one paragraph
  for (const col of colParagraphs) {
    if (col.length === 0) col.push(new Paragraph({}));
  }

  // Build table rows
  const rows: TableRow[] = [];

  // Header row (full width)
  if (headerParagraphs.length > 0) {
    const headerColor = structure.headerBg?.color?.replace('#', '') ?? 'FFFFFF';
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: structure.columns.length,
            shading: { fill: headerColor, type: ShadingType.CLEAR, color: 'auto' },
            width: { size: 100, type: WidthType.PERCENTAGE },
            children: headerParagraphs,
          }),
        ],
      })
    );
  }

  // Content row with columns
  const contentCells = structure.columns.map((col, i) => {
    const widthPct = Math.round((col.width / CANVAS_WIDTH) * 100);
    return new TableCell({
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlignTable.TOP,
      ...(col.bgColor
        ? {
            shading: { fill: col.bgColor.replace('#', ''), type: ShadingType.CLEAR, color: 'auto' },
          }
        : {}),
      children: colParagraphs[i],
    });
  });

  rows.push(new TableRow({ children: contentCells }));

  const table = new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 360, bottom: 360, left: 360, right: 360 },
          },
        },
        children: [table],
      },
    ],
  });

  return { doc };
}

function buildColumnParagraphs(
  elements: LayoutElement[],
  tailored: TailoredData,
  resumeData: ResumeData,
  styles: DocxStyleSet
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const el of elements) {
    if (el.type === 'divider') {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: ((el.props as DividerProps).stroke ?? 'CCCCCC').replace('#', ''),
            },
          },
        })
      );
      continue;
    }

    if (el.type === 'image') {
      const ip = el.props as ImageProps;
      if (ip.src && ip.src.startsWith('data:')) {
        // Apply circular mask if needed, then extract the base64 PNG buffer
        const srcUrl = ip.clipCircle ? (cropImageToCircle(ip.src) ?? ip.src) : ip.src;
        const imgMatch = srcUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (imgMatch) {
          const imgBuffer = Buffer.from(imgMatch[2], 'base64');
          const mime = imgMatch[1];
          const imgType =
            mime === 'image/png'
              ? ('png' as const)
              : mime === 'image/gif'
                ? ('gif' as const)
                : ('jpg' as const);
          paragraphs.push(
            new Paragraph({
              spacing: { after: 40 },
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: imgBuffer,
                  transformation: { width: el.width, height: el.height },
                  type: imgType,
                }),
              ],
            })
          );
        }
      }
      continue;
    }

    if (el.type !== 'text') continue;
    const tp = el.props as TextProps;

    const fontSize = Math.round(tp.fontSize * 2); // pt to half-points
    const color = tp.fill.replace('#', '');
    const alignment =
      tp.align === 'center'
        ? AlignmentType.CENTER
        : tp.align === 'right'
          ? AlignmentType.RIGHT
          : AlignmentType.LEFT;

    // Determine if this is a section header (bold, no dataBinding, short text)
    const isSectionHeader = !tp.dataBinding && tp.fontStyle.includes('bold') && tp.fontSize >= 10;

    if (isSectionHeader) {
      paragraphs.push(
        new Paragraph({
          alignment,
          spacing: { before: 160, after: 60 },
          children: [
            new TextRun({
              text: tp.text,
              bold: true,
              size: fontSize,
              font: styles.font,
              color,
            }),
          ],
        })
      );
      continue;
    }

    // Structured rendering for data-bound sections
    if (tp.dataBinding) {
      const structured = renderStructuredDocx(
        tp.dataBinding,
        tailored,
        resumeData,
        styles,
        fontSize,
        color,
        alignment
      );
      if (structured) {
        paragraphs.push(...structured);
        continue;
      }
    }

    // Resolve text (for data-bound elements, skip if resolved is null
    // to avoid rendering placeholder text for empty sections)
    let text = tp.text;
    if (tp.dataBinding) {
      const resolved = resolveTailoredText(tp.dataBinding, tailored, resumeData);
      if (resolved === null) continue;
      text = resolved;
    }
    if (!text) continue;

    // Multi-line text: split into paragraphs
    const lines = text.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      paragraphs.push(
        new Paragraph({
          alignment,
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: line,
              bold: tp.fontStyle.includes('bold'),
              italics: tp.fontStyle.includes('italic'),
              size: fontSize,
              font: styles.font,
              color,
            }),
          ],
        })
      );
    }
  }

  return paragraphs;
}

/**
 * Render structured DOCX content for data-bound sections with proper
 * formatting: bold job titles, italic dates, separated entries.
 */
function renderStructuredDocx(
  binding: string,
  tailored: TailoredData,
  resumeData: ResumeData,
  styles: DocxStyleSet,
  fontSize: number,
  color: string,
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType]
): Paragraph[] | null {
  if (binding === 'workExperience') {
    if (!tailored.workExperience.length) return null;
    const result: Paragraph[] = [];
    for (let i = 0; i < tailored.workExperience.length; i++) {
      const w = tailored.workExperience[i];
      const dateRange = w.current ? `${w.startDate} - Present` : `${w.startDate} - ${w.endDate}`;
      // Job title at Company (bold)
      result.push(
        new Paragraph({
          alignment,
          spacing: { before: i > 0 ? 120 : 0, after: 0 },
          children: [
            new TextRun({
              text: `${w.jobTitle} at ${w.company}`,
              bold: true,
              size: fontSize,
              font: styles.font,
              color,
            }),
          ],
        })
      );
      // Location | date range (italic, extra spacing before bullets)
      result.push(
        new Paragraph({
          alignment,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: `${w.location} | ${dateRange}`,
              italics: true,
              size: fontSize,
              font: styles.font,
              color,
            }),
          ],
        })
      );
      // Responsibilities as bullets
      const bullets = w.responsibilities.filter((r) => r.trim().length > 0);
      for (const bullet of bullets) {
        result.push(
          new Paragraph({
            alignment,
            spacing: { after: 20 },
            children: [
              new TextRun({
                text: `\u2022 ${bullet}`,
                size: fontSize,
                font: styles.font,
                color,
              }),
            ],
          })
        );
      }
    }
    return result;
  }

  if (binding === 'education') {
    if (!resumeData.education.length) return null;
    const result: Paragraph[] = [];
    for (let i = 0; i < resumeData.education.length; i++) {
      const e = resumeData.education[i];
      const dateRange = e.current ? `${e.startDate} - Present` : `${e.startDate} - ${e.endDate}`;
      result.push(
        new Paragraph({
          alignment,
          spacing: { before: i > 0 ? 80 : 0, after: 0 },
          children: [
            new TextRun({
              text: e.fieldOfStudy ? `${e.degree} in ${e.fieldOfStudy}` : e.degree,
              bold: true,
              size: fontSize,
              font: styles.font,
              color,
            }),
          ],
        })
      );
      result.push(
        new Paragraph({
          alignment,
          spacing: { after: 0 },
          children: [
            new TextRun({
              text: e.institution,
              size: fontSize,
              font: styles.font,
              color,
            }),
          ],
        })
      );
      result.push(
        new Paragraph({
          alignment,
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: dateRange,
              italics: true,
              size: fontSize,
              font: styles.font,
              color,
            }),
          ],
        })
      );
    }
    return result;
  }

  if (binding === 'skills') {
    const skills = tailored.skills;
    const result: Paragraph[] = [];
    if (Array.isArray(skills)) {
      if (!skills.length) return null;
      for (const s of skills) {
        result.push(
          new Paragraph({
            alignment,
            spacing: { after: 20 },
            children: [
              new TextRun({
                text: `\u2022 ${s}`,
                size: fontSize,
                font: styles.font,
                color,
              }),
            ],
          })
        );
      }
    } else {
      const entries = Object.entries(skills);
      if (!entries.length) return null;
      for (let si = 0; si < entries.length; si++) {
        const [category, skillList] = entries[si];
        result.push(
          new Paragraph({
            alignment,
            spacing: { before: si > 0 ? 60 : 0, after: 20 },
            children: [
              new TextRun({
                text: `${category}: `,
                bold: true,
                size: fontSize,
                font: styles.font,
                color,
              }),
              new TextRun({
                text: skillList.join(', '),
                size: fontSize,
                font: styles.font,
                color,
              }),
            ],
          })
        );
      }
    }
    return result;
  }

  if (binding === 'certifications') {
    if (!resumeData.certifications.length) return null;
    const result: Paragraph[] = [];
    for (const c of resumeData.certifications) {
      result.push(
        new Paragraph({
          alignment,
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: `${c.name} - ${c.issuer} (${c.dateObtained})`,
              size: fontSize,
              font: styles.font,
              color,
            }),
          ],
        })
      );
    }
    return result;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JobSummary {
  title: string;
  company: string;
  description: string;
  requiredSkills: string[] | null;
  employmentType: string;
  isRemote: boolean;
  location: string;
  highlights: Record<string, string[]> | null;
}

interface TailoredWorkEntry {
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string[];
}

interface TailoredResume {
  professionalSummary: string;
  targetTitle: string;
  workExperience: TailoredWorkEntry[];
  skills: Record<string, string[]> | string[];
}

interface TailoredCV {
  objectiveStatement: string;
  workExperience: TailoredWorkEntry[];
  skills: Record<string, string[]> | string[];
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

export function buildResumePrompt(resumeData: ResumeData, job: JobSummary): string {
  return `You are an expert resume writer and ATS optimization specialist.

Given the candidate's background and a target job posting, produce a TAILORED resume in JSON format. The resume must be concise (targeting 1-2 pages when formatted) and optimized so that Applicant Tracking Systems (ATS) used by recruiters can parse and score it highly.

CANDIDATE BACKGROUND:
${JSON.stringify(
  {
    personalInfo: resumeData.personalInfo,
    workExperience: resumeData.workExperience.map((w) => ({
      jobTitle: w.jobTitle,
      company: w.company,
      location: w.location,
      startDate: w.startDate,
      endDate: w.endDate,
      current: w.current,
      responsibilities: w.responsibilities,
    })),
    education: resumeData.education.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
    })),
    skills: resumeData.skills,
    certifications: resumeData.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      dateObtained: c.dateObtained,
      expirationDate: c.expirationDate,
    })),
  },
  null,
  2
)}

TARGET JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}${job.isRemote ? ' (Remote)' : ''}
Type: ${job.employmentType}
Description: ${job.description}
${job.requiredSkills ? `Required Skills: ${job.requiredSkills.join(', ')}` : ''}
${job.highlights ? `Highlights: ${JSON.stringify(job.highlights)}` : ''}

Return a JSON object with this exact structure:
{
  "professionalSummary": "",
  "targetTitle": "",
  "workExperience": [
    {
      "jobTitle": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "responsibilities": [""]
    }
  ],
  "skills": {
    "Category Name": ["skill1", "skill2"]
  }
}

Rules:
- Write a 2-3 sentence "professionalSummary" tailored to the target role. Highlight the candidate's most relevant experience and achievements for this specific position.
- Set "targetTitle" to the candidate's current job title. Only change it if the candidate's title is significantly different from what the posting seeks AND the candidate's experience genuinely qualifies them for the posted title.
- IMPORTANT: The candidate's "responsibilities" are rough guides describing the general scope of their work, NOT final resume bullet points. You MUST create entirely new, tailored bullet points for each position by: (1) analyzing the target job's requirements, (2) identifying equivalent or transferable job functions from the candidate's experience at each role, and (3) writing achievement-oriented bullets that demonstrate relevant competencies using the job posting's language and keywords. Every bullet should directly connect the candidate's past work to what the target role demands.
- Include measurable achievements where the candidate's original responsibilities support them (numbers, percentages, dollar amounts, team sizes).
- For "skills", return a JSON object (not an array) where each key is a category name (e.g., "Technical Skills", "Tools & Frameworks", "Soft Skills", "Industry Knowledge") and each value is an array of skill strings. Group the candidate's skills into 2-4 logical categories relevant to the target role. Place skills matching the job description first within each category. Only include skills the candidate actually has.
- Mirror exact phrasing from the job description where truthful (e.g., if the posting says "React.js" use "React.js" not "React").
- Spell out acronyms on first use where appropriate.
- Keep all work experience entries from the candidate's background. Do not remove any.
- Preserve all original dates, company names, and locations exactly as provided.
- Do NOT fabricate, exaggerate, or add any information not present in the candidate's background.
- NEVER use em dashes or en dashes. Use hyphens (-) or commas instead.`;
}

export function buildCVPrompt(resumeData: ResumeData, job: JobSummary): string {
  return `You are an expert CV writer and ATS optimization specialist.

Given the candidate's background and a target job posting, produce a TAILORED curriculum vitae (CV) in JSON format. A CV is comprehensive and includes ALL experience, education, and qualifications. It should be thorough while still being optimized for ATS parsing.

CANDIDATE BACKGROUND:
${JSON.stringify(
  {
    personalInfo: resumeData.personalInfo,
    workExperience: resumeData.workExperience.map((w) => ({
      jobTitle: w.jobTitle,
      company: w.company,
      location: w.location,
      startDate: w.startDate,
      endDate: w.endDate,
      current: w.current,
      responsibilities: w.responsibilities,
    })),
    education: resumeData.education.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
    })),
    skills: resumeData.skills,
    certifications: resumeData.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      dateObtained: c.dateObtained,
      expirationDate: c.expirationDate,
    })),
  },
  null,
  2
)}

TARGET JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}${job.isRemote ? ' (Remote)' : ''}
Type: ${job.employmentType}
Description: ${job.description}
${job.requiredSkills ? `Required Skills: ${job.requiredSkills.join(', ')}` : ''}
${job.highlights ? `Highlights: ${JSON.stringify(job.highlights)}` : ''}

Return a JSON object with this exact structure:
{
  "objectiveStatement": "",
  "workExperience": [
    {
      "jobTitle": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "responsibilities": [""]
    }
  ],
  "skills": {
    "Category Name": ["skill1", "skill2"]
  }
}

Rules:
- Write a brief "objectiveStatement" (2-3 sentences) expressing the candidate's career goals as they relate to this specific position.
- IMPORTANT: The candidate's "responsibilities" are rough guides describing the general scope of their work, NOT final CV bullet points. You MUST create entirely new, tailored bullet points for each position by: (1) analyzing the target job's requirements, (2) identifying equivalent or transferable job functions from the candidate's experience at each role, and (3) writing achievement-oriented bullets that demonstrate relevant competencies using the job posting's language and keywords. Every bullet should directly connect the candidate's past work to what the target role demands. Since this is a CV, be comprehensive and include more detail than a resume.
- Include ALL work experience entries.
- Include measurable achievements where the candidate's original responsibilities support them.
- For "skills", return a JSON object (not an array) where each key is a category name (e.g., "Technical Skills", "Tools & Frameworks", "Soft Skills", "Industry Knowledge") and each value is an array of skill strings. Group the candidate's skills into 2-4 logical categories relevant to the target role. Place skills matching the job description first within each category. Include all skills the candidate has.
- Mirror exact phrasing from the job description where truthful.
- Preserve all original dates, company names, and locations exactly as provided.
- Do NOT fabricate, exaggerate, or add any information not present in the candidate's background.
- NEVER use em dashes or en dashes. Use hyphens (-) or commas instead.`;
}

// ---------------------------------------------------------------------------
// Gemini API call
// ---------------------------------------------------------------------------

async function callGemini<T>(prompt: string, apiKey: string): Promise<T> {
  enforceRateLimit();

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  recordCall();

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const result: GeminiResponse = (await response.json()) as GeminiResponse;

  if (result.error) {
    throw new Error(`Gemini API error: ${result.error.message}`);
  }

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------------------
// Post-processing: strip dashes from all tailored text fields
// ---------------------------------------------------------------------------

function sanitizeTailoredWork(entries: TailoredWorkEntry[]): TailoredWorkEntry[] {
  return entries.map((entry) => ({
    ...entry,
    jobTitle: stripDashes(entry.jobTitle ?? ''),
    company: stripDashes(entry.company ?? ''),
    location: stripDashes(entry.location ?? ''),
    startDate: entry.startDate ?? '',
    endDate: entry.endDate ?? '',
    responsibilities: (entry.responsibilities ?? ['']).map((r) => stripDashes(String(r))),
  }));
}

// ---------------------------------------------------------------------------
// PDF layout builders (pdfmake document definitions)
// ---------------------------------------------------------------------------

interface PdfContent {
  text?: string | PdfContent[];
  style?: string;
  ul?: (string | PdfContent)[];
  columns?: PdfContent[];
  stack?: PdfContent[];
  width?: string | number;
  height?: number;
  alignment?: string;
  margin?: number[];
  bold?: boolean;
  italics?: boolean;
  fontSize?: number;
  color?: string;
  font?: string;
  lineHeight?: number;
  link?: string;
  decoration?: string;
  absolutePosition?: { x: number; y: number };
  canvas?: Array<Record<string, unknown>>;
  svg?: string;
  image?: string;
  fit?: [number, number];
}

interface PdfDocDefinition {
  content: PdfContent[];
  defaultStyle: { font: string; fontSize: number; lineHeight: number };
  styles: Record<string, Record<string, unknown>>;
  pageMargins: number[];
  pageSize?: { width: number; height: number };
}

function buildContactHeader(personalInfo: ResumeData['personalInfo']): PdfContent[] {
  const content: PdfContent[] = [];

  content.push({
    text: personalInfo.fullName,
    style: 'name',
    alignment: 'center',
  });

  const contactParts: string[] = [];
  if (personalInfo.email) contactParts.push(personalInfo.email);
  if (personalInfo.phone) contactParts.push(personalInfo.phone);
  if (personalInfo.location) contactParts.push(personalInfo.location);

  if (contactParts.length > 0) {
    content.push({
      text: contactParts.join('  |  '),
      alignment: 'center',
      fontSize: 9,
      color: '#555555',
      margin: [0, 2, 0, 0],
    });
  }

  const linkParts: string[] = [];
  if (personalInfo.linkedin) linkParts.push(personalInfo.linkedin);
  if (personalInfo.website) linkParts.push(personalInfo.website);

  if (linkParts.length > 0) {
    content.push({
      text: linkParts.join('  |  '),
      alignment: 'center',
      fontSize: 9,
      color: '#555555',
      margin: [0, 2, 0, 0],
    });
  }

  // Divider line
  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#cccccc' }],
    margin: [0, 5, 0, 5],
  });

  return content;
}

function buildSectionHeader(title: string): PdfContent {
  return {
    text: title.toUpperCase(),
    style: 'sectionHeader',
    margin: [0, 10, 0, 4],
  };
}

function buildWorkEntries(entries: TailoredWorkEntry[]): PdfContent[] {
  const content: PdfContent[] = [];

  for (const entry of entries) {
    const dateRange = entry.current
      ? `${entry.startDate} - Present`
      : `${entry.startDate} - ${entry.endDate}`;

    content.push({
      columns: [
        { text: entry.jobTitle, bold: true, width: '*' },
        { text: dateRange, alignment: 'right', width: 'auto', fontSize: 9, color: '#555555' },
      ],
      margin: [0, 4, 0, 0],
    });

    const companyLine = entry.location ? `${entry.company}, ${entry.location}` : entry.company;

    content.push({
      text: companyLine,
      italics: true,
      fontSize: 9,
      color: '#555555',
      margin: [0, 1, 0, 2],
    });

    const bullets = entry.responsibilities.filter((r) => r.trim().length > 0);
    if (bullets.length > 0) {
      content.push({
        ul: bullets,
        margin: [10, 0, 0, 4],
      });
    }
  }

  return content;
}

function buildEducationEntries(entries: Education[]): PdfContent[] {
  const content: PdfContent[] = [];

  for (const edu of entries) {
    const dateRange = edu.current
      ? `${edu.startDate} - Present`
      : edu.startDate && edu.endDate
        ? `${edu.startDate} - ${edu.endDate}`
        : edu.endDate || edu.startDate || '';

    const degreeLine = edu.fieldOfStudy ? `${edu.degree} in ${edu.fieldOfStudy}` : edu.degree;

    content.push({
      columns: [
        { text: degreeLine, bold: true, width: '*' },
        ...(dateRange
          ? [{ text: dateRange, alignment: 'right', width: 'auto', fontSize: 9, color: '#555555' }]
          : []),
      ],
      margin: [0, 4, 0, 0],
    });

    const instLine = edu.location ? `${edu.institution}, ${edu.location}` : edu.institution;

    content.push({
      text: instLine,
      italics: true,
      fontSize: 9,
      color: '#555555',
      margin: [0, 1, 0, 2],
    });
  }

  return content;
}

function sanitizeSkills(
  skills: Record<string, string[]> | string[]
): Record<string, string[]> | string[] {
  if (Array.isArray(skills)) {
    return skills.map((s) => stripDashes(String(s)));
  }
  const result: Record<string, string[]> = {};
  for (const [category, items] of Object.entries(skills)) {
    result[stripDashes(String(category))] = (items ?? []).map((s) => stripDashes(String(s)));
  }
  return result;
}

function hasSkills(skills: Record<string, string[]> | string[]): boolean {
  if (Array.isArray(skills)) return skills.length > 0;
  return Object.values(skills).some((items) => items.length > 0);
}

function buildSkillsSection(skills: Record<string, string[]> | string[]): PdfContent[] {
  // Handle flat array fallback (if AI returns old format)
  if (Array.isArray(skills)) {
    return [{ text: skills.join(', '), margin: [0, 4, 0, 4] }];
  }

  const content: PdfContent[] = [];
  for (const [category, items] of Object.entries(skills)) {
    if (items.length > 0) {
      content.push({
        text: [{ text: `${category}: `, bold: true }, { text: items.join(', ') }],
        margin: [0, 3, 0, 3],
      });
    }
  }
  return content;
}

function buildCertificationsEntries(certs: Certification[]): PdfContent[] {
  const content: PdfContent[] = [];

  for (const cert of certs) {
    const parts = [cert.name];
    if (cert.issuer) parts.push(cert.issuer);
    if (cert.dateObtained) parts.push(cert.dateObtained);

    content.push({
      text: parts.join(' - '),
      margin: [0, 2, 0, 2],
    });
  }

  return content;
}

const PDF_STYLES = {
  name: { fontSize: 18, bold: true, color: '#1a1a1a' },
  sectionHeader: { fontSize: 11, bold: true, color: '#1a1a1a' },
};

const DEFAULT_STYLE = { font: 'Helvetica', fontSize: 10, lineHeight: 1.3 };

function buildPdfStylesFromLayout(ls: LayoutStyles): {
  pdfStyles: typeof PDF_STYLES;
  defaultStyle: typeof DEFAULT_STYLE;
} {
  return {
    pdfStyles: {
      name: {
        fontSize: ls.name?.fontSize ?? 18,
        bold: ls.name?.bold ?? true,
        color: ls.name?.color ?? '#1a1a1a',
      },
      sectionHeader: {
        fontSize: ls.sectionHeader?.fontSize ?? 11,
        bold: ls.sectionHeader?.bold ?? true,
        color: ls.sectionHeader?.color ?? '#1a1a1a',
      },
    },
    defaultStyle: {
      font: ls.body?.font ?? 'Helvetica',
      fontSize: ls.body?.fontSize ?? 10,
      lineHeight: ls.body?.lineHeight ?? 1.3,
    },
  };
}

export function buildResumePdfLayout(
  tailored: TailoredResume,
  resumeData: ResumeData,
  layoutStyles?: LayoutStyles
): PdfDocDefinition {
  const content: PdfContent[] = [];

  // Contact header
  content.push(...buildContactHeader(resumeData.personalInfo));

  // Professional Summary
  content.push(buildSectionHeader('Professional Summary'));
  content.push({ text: stripDashes(tailored.professionalSummary), margin: [0, 0, 0, 4] });

  // Work Experience
  if (tailored.workExperience.length > 0) {
    content.push(buildSectionHeader('Work Experience'));
    content.push(...buildWorkEntries(tailored.workExperience));
  }

  // Education
  if (resumeData.education.length > 0) {
    content.push(buildSectionHeader('Education'));
    content.push(...buildEducationEntries(resumeData.education));
  }

  // Skills
  const sanitizedSkills = sanitizeSkills(tailored.skills);
  if (hasSkills(sanitizedSkills)) {
    content.push(buildSectionHeader('Skills'));
    content.push(...buildSkillsSection(sanitizedSkills));
  }

  // Certifications
  if (resumeData.certifications.length > 0) {
    content.push(buildSectionHeader('Certifications'));
    content.push(...buildCertificationsEntries(resumeData.certifications));
  }

  const derived = layoutStyles ? buildPdfStylesFromLayout(layoutStyles) : null;
  return {
    content,
    defaultStyle: derived?.defaultStyle ?? DEFAULT_STYLE,
    styles: derived?.pdfStyles ?? PDF_STYLES,
    pageMargins: [40, 40, 40, 40],
  };
}

export function buildCVPdfLayout(
  tailored: TailoredCV,
  resumeData: ResumeData,
  layoutStyles?: LayoutStyles
): PdfDocDefinition {
  const content: PdfContent[] = [];

  // Contact header
  content.push(...buildContactHeader(resumeData.personalInfo));

  // Objective
  content.push(buildSectionHeader('Objective'));
  content.push({ text: stripDashes(tailored.objectiveStatement), margin: [0, 0, 0, 4] });

  // Work Experience
  if (tailored.workExperience.length > 0) {
    content.push(buildSectionHeader('Work Experience'));
    content.push(...buildWorkEntries(tailored.workExperience));
  }

  // Education
  if (resumeData.education.length > 0) {
    content.push(buildSectionHeader('Education'));
    content.push(...buildEducationEntries(resumeData.education));
  }

  // Skills
  const sanitizedCVSkills = sanitizeSkills(tailored.skills);
  if (hasSkills(sanitizedCVSkills)) {
    content.push(buildSectionHeader('Skills'));
    content.push(...buildSkillsSection(sanitizedCVSkills));
  }

  // Certifications
  if (resumeData.certifications.length > 0) {
    content.push(buildSectionHeader('Certifications'));
    content.push(...buildCertificationsEntries(resumeData.certifications));
  }

  const derived = layoutStyles ? buildPdfStylesFromLayout(layoutStyles) : null;
  return {
    content,
    defaultStyle: derived?.defaultStyle ?? DEFAULT_STYLE,
    styles: derived?.pdfStyles ?? PDF_STYLES,
    pageMargins: [40, 40, 40, 40],
  };
}

// ---------------------------------------------------------------------------
// PDF buffer generation
// ---------------------------------------------------------------------------

async function generatePdfBuffer(docDefinition: PdfDocDefinition): Promise<Buffer> {
  const pdfmakeModule = await import('pdfmake/js/Printer.js');
  // Vite externalises CJS modules, so the ESM interop can double-wrap the
  // default export: { default: { __esModule: true, default: PdfPrinter } }.
  // Handle both the direct case (tests / plain Node) and the wrapped case.
  const resolved = pdfmakeModule.default;
  const PdfPrinter: typeof import('pdfmake/js/Printer.js').default =
    typeof resolved === 'function'
      ? resolved
      : ((resolved as Record<string, unknown>)
          .default as typeof import('pdfmake/js/Printer.js').default);

  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
    Times: {
      normal: 'Times-Roman',
      bold: 'Times-Bold',
      italics: 'Times-Italic',
      bolditalics: 'Times-BoldItalic',
    },
  };

  const printer = new PdfPrinter(fonts);
  // createPdfKitDocument is async in pdfmake v0.3.x
  const pdfDoc = await printer.createPdfKitDocument(docDefinition as never);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

// ---------------------------------------------------------------------------
// Orchestrators
// ---------------------------------------------------------------------------

export async function generateTailoredResume(
  resumeData: ResumeData,
  job: JobSummary,
  apiKey: string,
  savedLayout?: ResumeLayout
): Promise<Buffer> {
  const prompt = buildResumePrompt(resumeData, job);
  const raw = await callGemini<TailoredResume>(prompt, apiKey);

  const tailored: TailoredResume = {
    professionalSummary: stripDashes(String(raw.professionalSummary ?? '')),
    targetTitle: stripDashes(String(raw.targetTitle ?? resumeData.personalInfo.jobTitle)),
    workExperience: sanitizeTailoredWork(raw.workExperience ?? []),
    skills: raw.skills ?? resumeData.skills,
  };

  // Use visual layout when a saved canvas layout exists
  if (savedLayout && savedLayout.elements.length > 0) {
    const layout = buildVisualPdfLayout(tailored, resumeData, savedLayout);
    return generatePdfBuffer(layout);
  }

  const layoutStyles = savedLayout ? extractLayoutStyles(savedLayout) : undefined;
  const layout = buildResumePdfLayout(tailored, resumeData, layoutStyles);
  return generatePdfBuffer(layout);
}

export async function generateTailoredCV(
  resumeData: ResumeData,
  job: JobSummary,
  apiKey: string,
  savedLayout?: ResumeLayout
): Promise<Buffer> {
  const prompt = buildCVPrompt(resumeData, job);
  const raw = await callGemini<TailoredCV>(prompt, apiKey);

  const tailored: TailoredCV = {
    objectiveStatement: stripDashes(String(raw.objectiveStatement ?? '')),
    workExperience: sanitizeTailoredWork(raw.workExperience ?? []),
    skills: raw.skills ?? resumeData.skills,
  };

  // Use visual layout when a saved canvas layout exists
  if (savedLayout && savedLayout.elements.length > 0) {
    const layout = buildVisualPdfLayout(tailored, resumeData, savedLayout);
    return generatePdfBuffer(layout);
  }

  const layoutStyles = savedLayout ? extractLayoutStyles(savedLayout) : undefined;
  const layout = buildCVPdfLayout(tailored, resumeData, layoutStyles);
  return generatePdfBuffer(layout);
}

// ---------------------------------------------------------------------------
// DOCX layout builders
// ---------------------------------------------------------------------------

const FONT = 'Calibri';
const FONT_SIZE_NAME = 28; // 14pt in half-points
const FONT_SIZE_SECTION = 22; // 11pt
const FONT_SIZE_BODY = 20; // 10pt
const FONT_SIZE_SMALL = 18; // 9pt

interface DocxStyleSet {
  font: string;
  nameSize: number;
  sectionSize: number;
  bodySize: number;
  smallSize: number;
  nameColor: string;
  sectionColor: string;
  bodyColor: string;
}

function buildDocxStylesFromLayout(ls: LayoutStyles): DocxStyleSet {
  // Convert pt to half-points (DOCX uses half-points)
  const toHp = (pt: number) => Math.round(pt * 2);
  return {
    font: ls.body?.font ?? FONT,
    nameSize: ls.name ? toHp(ls.name.fontSize) : FONT_SIZE_NAME,
    sectionSize: ls.sectionHeader ? toHp(ls.sectionHeader.fontSize) : FONT_SIZE_SECTION,
    bodySize: ls.body ? toHp(ls.body.fontSize) : FONT_SIZE_BODY,
    smallSize: ls.contact ? toHp(ls.contact.fontSize) : FONT_SIZE_SMALL,
    nameColor: (ls.name?.color ?? '1A1A1A').replace('#', ''),
    sectionColor: (ls.sectionHeader?.color ?? '1A1A1A').replace('#', ''),
    bodyColor: (ls.body?.color ?? '1A1A1A').replace('#', ''),
  };
}

function docxContactHeader(
  personalInfo: ResumeData['personalInfo'],
  styles?: DocxStyleSet | null
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: personalInfo.fullName,
          bold: true,
          size: styles?.nameSize ?? FONT_SIZE_NAME,
          font: styles?.font ?? FONT,
          color: styles?.nameColor,
        }),
      ],
    })
  );

  const contactParts: string[] = [];
  if (personalInfo.email) contactParts.push(personalInfo.email);
  if (personalInfo.phone) contactParts.push(personalInfo.phone);
  if (personalInfo.location) contactParts.push(personalInfo.location);

  if (contactParts.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: styles?.smallSize ?? FONT_SIZE_SMALL,
            color: '555555',
            font: styles?.font ?? FONT,
          }),
        ],
      })
    );
  }

  const linkParts: string[] = [];
  if (personalInfo.linkedin) linkParts.push(personalInfo.linkedin);
  if (personalInfo.website) linkParts.push(personalInfo.website);

  if (linkParts.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: linkParts.join('  |  '),
            size: styles?.smallSize ?? FONT_SIZE_SMALL,
            color: '555555',
            font: styles?.font ?? FONT,
          }),
        ],
      })
    );
  }

  // Divider
  paragraphs.push(
    new Paragraph({
      spacing: { after: 120 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
    })
  );

  return paragraphs;
}

function docxSectionHeader(title: string, styles?: DocxStyleSet | null): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: styles?.sectionSize ?? FONT_SIZE_SECTION,
        font: styles?.font ?? FONT,
        color: styles?.sectionColor ?? '1A1A1A',
      }),
    ],
  });
}

function docxWorkEntries(entries: TailoredWorkEntry[], styles?: DocxStyleSet | null): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const font = styles?.font ?? FONT;
  const bodySize = styles?.bodySize ?? FONT_SIZE_BODY;
  const smallSize = styles?.smallSize ?? FONT_SIZE_SMALL;

  for (const entry of entries) {
    const dateRange = entry.current
      ? `${entry.startDate} - Present`
      : `${entry.startDate} - ${entry.endDate}`;

    // Job title + date range on same line using tab stop
    paragraphs.push(
      new Paragraph({
        spacing: { before: 80 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: entry.jobTitle, bold: true, size: bodySize, font }),
          new TextRun({ text: '\t', size: bodySize, font }),
          new TextRun({ text: dateRange, size: smallSize, color: '555555', font }),
        ],
      })
    );

    const companyLine = entry.location ? `${entry.company}, ${entry.location}` : entry.company;
    paragraphs.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: companyLine,
            italics: true,
            size: smallSize,
            color: '555555',
            font,
          }),
        ],
      })
    );

    for (const r of entry.responsibilities.filter((s) => s.trim().length > 0)) {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 20 },
          children: [new TextRun({ text: r, size: bodySize, font })],
        })
      );
    }
  }

  return paragraphs;
}

function docxEducationEntries(entries: Education[], styles?: DocxStyleSet | null): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const font = styles?.font ?? FONT;
  const bodySize = styles?.bodySize ?? FONT_SIZE_BODY;
  const smallSize = styles?.smallSize ?? FONT_SIZE_SMALL;

  for (const edu of entries) {
    const dateRange = edu.current
      ? `${edu.startDate} - Present`
      : edu.startDate && edu.endDate
        ? `${edu.startDate} - ${edu.endDate}`
        : edu.endDate || edu.startDate || '';

    const degreeLine = edu.fieldOfStudy ? `${edu.degree} in ${edu.fieldOfStudy}` : edu.degree;

    const children: TextRun[] = [
      new TextRun({ text: degreeLine, bold: true, size: bodySize, font }),
    ];
    if (dateRange) {
      children.push(new TextRun({ text: '\t', size: bodySize, font }));
      children.push(new TextRun({ text: dateRange, size: smallSize, color: '555555', font }));
    }

    paragraphs.push(
      new Paragraph({
        spacing: { before: 80 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children,
      })
    );

    const instLine = edu.location ? `${edu.institution}, ${edu.location}` : edu.institution;
    paragraphs.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: instLine,
            italics: true,
            size: smallSize,
            color: '555555',
            font,
          }),
        ],
      })
    );
  }

  return paragraphs;
}

function docxSkillsSection(
  skills: Record<string, string[]> | string[],
  styles?: DocxStyleSet | null
): Paragraph[] {
  const font = styles?.font ?? FONT;
  const bodySize = styles?.bodySize ?? FONT_SIZE_BODY;

  if (Array.isArray(skills)) {
    return [
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: skills.join(', '), size: bodySize, font })],
      }),
    ];
  }

  const paragraphs: Paragraph[] = [];
  for (const [category, items] of Object.entries(skills)) {
    if (items.length > 0) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${category}: `, bold: true, size: bodySize, font }),
            new TextRun({ text: items.join(', '), size: bodySize, font }),
          ],
        })
      );
    }
  }
  return paragraphs;
}

function docxCertificationsEntries(
  certs: Certification[],
  styles?: DocxStyleSet | null
): Paragraph[] {
  const font = styles?.font ?? FONT;
  const bodySize = styles?.bodySize ?? FONT_SIZE_BODY;

  return certs.map((cert) => {
    const parts = [cert.name];
    if (cert.issuer) parts.push(cert.issuer);
    if (cert.dateObtained) parts.push(cert.dateObtained);

    return new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: parts.join(' - '), size: bodySize, font })],
    });
  });
}

export function buildResumeDocxLayout(
  tailored: TailoredResume,
  resumeData: ResumeData,
  layoutStyles?: LayoutStyles
): Paragraph[] {
  const s = layoutStyles ? buildDocxStylesFromLayout(layoutStyles) : null;
  const font = s?.font ?? FONT;
  const bodySize = s?.bodySize ?? FONT_SIZE_BODY;

  const sections: Paragraph[] = [];

  sections.push(...docxContactHeader(resumeData.personalInfo, s));

  sections.push(docxSectionHeader('Professional Summary', s));
  sections.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: stripDashes(tailored.professionalSummary),
          size: bodySize,
          font,
        }),
      ],
    })
  );

  if (tailored.workExperience.length > 0) {
    sections.push(docxSectionHeader('Work Experience', s));
    sections.push(...docxWorkEntries(tailored.workExperience, s));
  }

  if (resumeData.education.length > 0) {
    sections.push(docxSectionHeader('Education', s));
    sections.push(...docxEducationEntries(resumeData.education, s));
  }

  const sanitizedSkills = sanitizeSkills(tailored.skills);
  if (hasSkills(sanitizedSkills)) {
    sections.push(docxSectionHeader('Skills', s));
    sections.push(...docxSkillsSection(sanitizedSkills, s));
  }

  if (resumeData.certifications.length > 0) {
    sections.push(docxSectionHeader('Certifications', s));
    sections.push(...docxCertificationsEntries(resumeData.certifications, s));
  }

  return sections;
}

export function buildCVDocxLayout(
  tailored: TailoredCV,
  resumeData: ResumeData,
  layoutStyles?: LayoutStyles
): Paragraph[] {
  const s = layoutStyles ? buildDocxStylesFromLayout(layoutStyles) : null;
  const font = s?.font ?? FONT;
  const bodySize = s?.bodySize ?? FONT_SIZE_BODY;

  const sections: Paragraph[] = [];

  sections.push(...docxContactHeader(resumeData.personalInfo, s));

  sections.push(docxSectionHeader('Objective', s));
  sections.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: stripDashes(tailored.objectiveStatement),
          size: bodySize,
          font,
        }),
      ],
    })
  );

  if (tailored.workExperience.length > 0) {
    sections.push(docxSectionHeader('Work Experience', s));
    sections.push(...docxWorkEntries(tailored.workExperience, s));
  }

  if (resumeData.education.length > 0) {
    sections.push(docxSectionHeader('Education', s));
    sections.push(...docxEducationEntries(resumeData.education, s));
  }

  const sanitizedCVSkills = sanitizeSkills(tailored.skills);
  if (hasSkills(sanitizedCVSkills)) {
    sections.push(docxSectionHeader('Skills', s));
    sections.push(...docxSkillsSection(sanitizedCVSkills, s));
  }

  if (resumeData.certifications.length > 0) {
    sections.push(docxSectionHeader('Certifications', s));
    sections.push(...docxCertificationsEntries(resumeData.certifications, s));
  }

  return sections;
}

// ---------------------------------------------------------------------------
// DOCX buffer generation
// ---------------------------------------------------------------------------

async function generateDocxBuffer(paragraphs: Paragraph[]): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

// ---------------------------------------------------------------------------
// DOCX Orchestrators
// ---------------------------------------------------------------------------

export async function generateTailoredResumeDocx(
  resumeData: ResumeData,
  job: JobSummary,
  apiKey: string,
  savedLayout?: ResumeLayout
): Promise<Buffer> {
  const prompt = buildResumePrompt(resumeData, job);
  const raw = await callGemini<TailoredResume>(prompt, apiKey);

  const tailored: TailoredResume = {
    professionalSummary: stripDashes(String(raw.professionalSummary ?? '')),
    targetTitle: stripDashes(String(raw.targetTitle ?? resumeData.personalInfo.jobTitle)),
    workExperience: sanitizeTailoredWork(raw.workExperience ?? []),
    skills: raw.skills ?? resumeData.skills,
  };

  // Use visual layout when a saved canvas layout exists
  if (savedLayout && savedLayout.elements.length > 0) {
    const result = buildVisualDocxLayout(tailored, resumeData, savedLayout);
    if (result.doc) {
      return Buffer.from(await Packer.toBuffer(result.doc));
    }
  }

  const layoutStyles = savedLayout ? extractLayoutStyles(savedLayout) : undefined;
  const layout = buildResumeDocxLayout(tailored, resumeData, layoutStyles);
  return generateDocxBuffer(layout);
}

export async function generateTailoredCVDocx(
  resumeData: ResumeData,
  job: JobSummary,
  apiKey: string,
  savedLayout?: ResumeLayout
): Promise<Buffer> {
  const prompt = buildCVPrompt(resumeData, job);
  const raw = await callGemini<TailoredCV>(prompt, apiKey);

  const tailored: TailoredCV = {
    objectiveStatement: stripDashes(String(raw.objectiveStatement ?? '')),
    workExperience: sanitizeTailoredWork(raw.workExperience ?? []),
    skills: raw.skills ?? resumeData.skills,
  };

  // Use visual layout when a saved canvas layout exists
  if (savedLayout && savedLayout.elements.length > 0) {
    const result = buildVisualDocxLayout(tailored, resumeData, savedLayout);
    if (result.doc) {
      return Buffer.from(await Packer.toBuffer(result.doc));
    }
  }

  const layoutStyles = savedLayout ? extractLayoutStyles(savedLayout) : undefined;
  const layout = buildCVDocxLayout(tailored, resumeData, layoutStyles);
  return generateDocxBuffer(layout);
}
