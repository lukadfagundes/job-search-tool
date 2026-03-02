interface SidebarProps {
  isOpen: boolean;
  view: 'search' | 'saved' | 'settings';
  onViewChange: (view: 'search' | 'saved' | 'settings') => void;
  onClose: () => void;
  weeklyRemaining: number | null;
  monthlyRemaining: number | null;
}

const navItems: { id: 'search' | 'saved' | 'settings'; label: string; icon: string }[] = [
  {
    id: 'search',
    label: 'Search',
    icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  },
  {
    id: 'saved',
    label: 'Saved Jobs',
    icon: 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.38.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
];

export function Sidebar({
  isOpen,
  view,
  onViewChange,
  onClose,
  weeklyRemaining,
  monthlyRemaining,
}: SidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        data-testid="sidebar-backdrop"
      />

      {/* Sidebar panel */}
      <nav
        className="fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col"
        data-testid="sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-lg font-bold text-gray-900 dark:text-white">Menu</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
            aria-label="Close menu"
          >
            &times;
          </button>
        </div>

        {/* Nav items */}
        <ul className="flex-1 py-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  onViewChange(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  view === item.id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Quota display */}
        {(weeklyRemaining !== null || monthlyRemaining !== null) && (
          <div
            className="px-4 py-3 border-t border-gray-200 dark:border-gray-700"
            data-testid="sidebar-quota"
          >
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              API Quota
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {weeklyRemaining !== null && `${weeklyRemaining}/50 weekly`}
              {weeklyRemaining !== null && monthlyRemaining !== null && ' · '}
              {monthlyRemaining !== null && `${monthlyRemaining}/200 monthly`}
            </p>
          </div>
        )}
      </nav>
    </>
  );
}
