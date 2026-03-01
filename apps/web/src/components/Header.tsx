interface HeaderProps {
  view: 'search' | 'saved';
  onViewChange: (view: 'search' | 'saved') => void;
  remainingRequests: number | null;
  weeklyRemaining: number | null;
  monthlyRemaining: number | null;
}

export function Header({ view, onViewChange, weeklyRemaining, monthlyRemaining }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          <h1 className="text-xl font-bold text-gray-900">Job Hunt</h1>
        </div>

        <nav className="flex items-center gap-4">
          <button
            onClick={() => onViewChange('search')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'search'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => onViewChange('saved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'saved'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Saved Jobs
          </button>

          {(weeklyRemaining !== null || monthlyRemaining !== null) && (
            <span className="text-xs text-gray-400 ml-4">
              {weeklyRemaining !== null && `${weeklyRemaining}/50 weekly`}
              {weeklyRemaining !== null && monthlyRemaining !== null && ' | '}
              {monthlyRemaining !== null && `${monthlyRemaining}/200 monthly`}
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
