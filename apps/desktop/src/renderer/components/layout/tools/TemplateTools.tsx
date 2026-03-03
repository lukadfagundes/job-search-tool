import type { TemplateDefinition } from '../../../../shared/layout-types.ts';

interface TemplateToolsProps {
  templates: TemplateDefinition[];
  onApplyTemplate: (template: TemplateDefinition) => void;
}

export function TemplateTools({ templates, onApplyTemplate }: TemplateToolsProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        Resume Templates
      </p>
      <div className="grid grid-cols-1 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onApplyTemplate(template)}
            className="group flex flex-col items-stretch rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 overflow-hidden transition-colors"
          >
            {/* Thumbnail preview */}
            <div className="h-32 w-full" style={{ background: template.thumbnail }} />
            {/* Label */}
            <div className="px-3 py-2 text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {template.name}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                {template.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
