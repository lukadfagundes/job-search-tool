import { useState } from 'react';
import { TextTools } from './TextTools.tsx';
import { ShapeTools } from './ShapeTools.tsx';
import { ImageTools } from './ImageTools.tsx';
import { ColorTools } from './ColorTools.tsx';
import { TemplateTools } from './TemplateTools.tsx';
import type { LayoutElement, TemplateDefinition } from '../../../../shared/layout-types.ts';

type ToolTab = 'text' | 'shapes' | 'images' | 'colors' | 'templates';

interface ToolPanelProps {
  onAddElement: (element: Omit<LayoutElement, 'id' | 'zIndex'>) => void;
  onPickImage: () => void;
  selectedElement: LayoutElement | null;
  onUpdateElement: (id: string, updates: Partial<LayoutElement>) => void;
  templates: TemplateDefinition[];
  onApplyTemplate: (template: TemplateDefinition) => void;
}

const tabs: { id: ToolTab; label: string; icon: string }[] = [
  {
    id: 'text',
    label: 'Text',
    icon: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12',
  },
  {
    id: 'shapes',
    label: 'Shapes',
    icon: 'M6.75 6.75h10.5v10.5H6.75z',
  },
  {
    id: 'images',
    label: 'Images',
    icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z',
  },
  {
    id: 'colors',
    label: 'Colors',
    icon: 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z',
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  },
];

export function ToolPanel({
  onAddElement,
  onPickImage,
  selectedElement,
  onUpdateElement,
  templates,
  onApplyTemplate,
}: ToolPanelProps) {
  const [activeTab, setActiveTab] = useState<ToolTab>('templates');

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
      {/* Tab icons */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-xs transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title={tab.label}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            <span className="text-[10px]">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'text' && (
          <TextTools
            onAddElement={onAddElement}
            selectedElement={selectedElement}
            onUpdateElement={onUpdateElement}
          />
        )}
        {activeTab === 'shapes' && <ShapeTools onAddElement={onAddElement} />}
        {activeTab === 'images' && (
          <ImageTools onAddElement={onAddElement} onPickImage={onPickImage} />
        )}
        {activeTab === 'colors' && (
          <ColorTools selectedElement={selectedElement} onUpdateElement={onUpdateElement} />
        )}
        {activeTab === 'templates' && (
          <TemplateTools templates={templates} onApplyTemplate={onApplyTemplate} />
        )}
      </div>
    </div>
  );
}
