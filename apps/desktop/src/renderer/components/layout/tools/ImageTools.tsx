import type { LayoutElement, IconProps } from '../../../../shared/layout-types.ts';
import { RESUME_ICONS, RESUME_COLORS, CANVAS_WIDTH } from '../../../../shared/layout-types.ts';

interface ImageToolsProps {
  onAddElement: (element: Omit<LayoutElement, 'id' | 'zIndex'>) => void;
  onPickImage: () => void;
}

export function ImageTools({ onAddElement, onPickImage }: ImageToolsProps) {
  const addProfilePhoto = () => {
    onPickImage();
  };

  const addIcon = (icon: (typeof RESUME_ICONS)[number]) => {
    onAddElement({
      type: 'icon',
      x: CANVAS_WIDTH / 2 - 12,
      y: 200,
      width: 24,
      height: 24,
      rotation: 0,
      locked: false,
      visible: true,
      props: {
        path: icon.path,
        fill: RESUME_COLORS.mutedText,
        name: icon.name,
        viewBox: icon.viewBox,
        filled: icon.filled ?? false,
      } as IconProps,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Photos
        </p>
        <button
          onClick={addProfilePhoto}
          className="w-full px-3 py-2.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
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
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          Upload Image
        </button>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Icons
        </p>
        <div className="grid grid-cols-4 gap-2">
          {RESUME_ICONS.map((icon) => (
            <button
              key={icon.name}
              onClick={() => addIcon(icon)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={icon.name}
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill={icon.filled ? 'currentColor' : 'none'}
                viewBox={icon.viewBox}
                strokeWidth={icon.filled ? 0 : 1.5}
                stroke={icon.filled ? 'none' : 'currentColor'}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
              </svg>
              <span className="text-[8px] text-gray-500 dark:text-gray-400 capitalize truncate w-full text-center">
                {icon.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
