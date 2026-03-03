import type { LayoutElement, TextProps } from '../../../../shared/layout-types.ts';
import { RESUME_COLORS, CANVAS_WIDTH } from '../../../../shared/layout-types.ts';

interface TextToolsProps {
  onAddElement: (element: Omit<LayoutElement, 'id' | 'zIndex'>) => void;
  selectedElement: LayoutElement | null;
  onUpdateElement: (id: string, updates: Partial<LayoutElement>) => void;
}

const fontFamilies = ['Helvetica', 'Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'];

export function TextTools({ onAddElement, selectedElement, onUpdateElement }: TextToolsProps) {
  const isTextSelected = selectedElement?.type === 'text';
  const textProps = isTextSelected ? (selectedElement!.props as TextProps) : null;

  const addText = (preset: 'heading' | 'subheading' | 'body' | 'label') => {
    const presets: Record<string, Omit<TextProps, 'dataBinding'>> = {
      heading: {
        text: 'Heading',
        fontFamily: 'Helvetica',
        fontSize: 18,
        fontStyle: 'bold',
        textDecoration: 'none',
        fill: RESUME_COLORS.navy,
        align: 'left',
        lineHeight: 1.2,
        letterSpacing: 1,
      },
      subheading: {
        text: 'Subheading',
        fontFamily: 'Helvetica',
        fontSize: 12,
        fontStyle: 'bold',
        textDecoration: 'none',
        fill: RESUME_COLORS.darkText,
        align: 'left',
        lineHeight: 1.3,
        letterSpacing: 0.5,
      },
      body: {
        text: 'Body text goes here. Click to edit.',
        fontFamily: 'Helvetica',
        fontSize: 9,
        fontStyle: 'normal',
        textDecoration: 'none',
        fill: RESUME_COLORS.darkText,
        align: 'left',
        lineHeight: 1.5,
        letterSpacing: 0,
      },
      label: {
        text: 'SECTION LABEL',
        fontFamily: 'Helvetica',
        fontSize: 10,
        fontStyle: 'bold',
        textDecoration: 'none',
        fill: RESUME_COLORS.navy,
        align: 'left',
        lineHeight: 1.2,
        letterSpacing: 2,
      },
    };

    const props = presets[preset];
    onAddElement({
      type: 'text',
      x: CANVAS_WIDTH / 2 - 100,
      y: 100,
      width: 200,
      height: preset === 'body' ? 60 : 24,
      rotation: 0,
      locked: false,
      visible: true,
      props,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Add Text
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(['heading', 'subheading', 'body', 'label'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => addText(preset)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors capitalize"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {isTextSelected && textProps && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Text Properties
          </p>

          {/* Font family */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Font</label>
            <select
              value={textProps.fontFamily}
              onChange={(e) =>
                onUpdateElement(selectedElement!.id, {
                  props: { ...textProps, fontFamily: e.target.value },
                })
              }
              className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {fontFamilies.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Font size */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Size: {textProps.fontSize}pt
            </label>
            <input
              type="range"
              min={6}
              max={72}
              step={1}
              value={textProps.fontSize}
              onChange={(e) =>
                onUpdateElement(selectedElement!.id, {
                  props: { ...textProps, fontSize: Number(e.target.value) },
                })
              }
              className="w-full"
            />
          </div>

          {/* Style buttons */}
          <div className="flex gap-1">
            {(['bold', 'italic'] as const).map((style) => (
              <button
                key={style}
                onClick={() => {
                  const current = textProps.fontStyle;
                  let newStyle: TextProps['fontStyle'];
                  if (style === 'bold') {
                    newStyle = current.includes('bold')
                      ? (current.replace('bold', '').trim() as TextProps['fontStyle']) || 'normal'
                      : current === 'normal'
                        ? 'bold'
                        : 'bold italic';
                  } else {
                    newStyle = current.includes('italic')
                      ? (current.replace('italic', '').trim() as TextProps['fontStyle']) || 'normal'
                      : current === 'normal'
                        ? 'italic'
                        : 'bold italic';
                  }
                  onUpdateElement(selectedElement!.id, {
                    props: { ...textProps, fontStyle: newStyle },
                  });
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                  textProps.fontStyle.includes(style)
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {style === 'bold' ? 'B' : 'I'}
              </button>
            ))}
            <button
              onClick={() =>
                onUpdateElement(selectedElement!.id, {
                  props: {
                    ...textProps,
                    textDecoration: textProps.textDecoration === 'underline' ? 'none' : 'underline',
                  },
                })
              }
              className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                textProps.textDecoration === 'underline'
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              U
            </button>
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Alignment</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() =>
                    onUpdateElement(selectedElement!.id, {
                      props: { ...textProps, align },
                    })
                  }
                  className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                    textProps.align === align
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Color</label>
            <input
              type="color"
              value={textProps.fill}
              onChange={(e) =>
                onUpdateElement(selectedElement!.id, {
                  props: { ...textProps, fill: e.target.value },
                })
              }
              className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
          </div>

          {/* Line height */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Line Height: {textProps.lineHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min={0.8}
              max={3}
              step={0.1}
              value={textProps.lineHeight}
              onChange={(e) =>
                onUpdateElement(selectedElement!.id, {
                  props: { ...textProps, lineHeight: Number(e.target.value) },
                })
              }
              className="w-full"
            />
          </div>

          {/* Letter spacing */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Letter Spacing: {textProps.letterSpacing.toFixed(1)}
            </label>
            <input
              type="range"
              min={-2}
              max={10}
              step={0.5}
              value={textProps.letterSpacing}
              onChange={(e) =>
                onUpdateElement(selectedElement!.id, {
                  props: { ...textProps, letterSpacing: Number(e.target.value) },
                })
              }
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
