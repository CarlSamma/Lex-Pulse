import { Search, Loader2 } from 'lucide-react';
import { AppView } from '../types/legal';

interface TopBarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onTriggerCercaNovita: () => void;
  isRunning: boolean;
  hasDeliverables: boolean;
}

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'pipeline', label: 'Scenario & Pipeline' },
  { id: 'deliverables', label: 'Deliverable' },
  { id: 'schema', label: 'Schema Flusso' },
  { id: 'checklist', label: 'Checklist & Export' },
];

export function TopBar({
  activeView,
  onSelectView,
  onTriggerCercaNovita,
  isRunning,
  hasDeliverables,
}: TopBarProps) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-[#E5E0D5] bg-[#FBF9F5]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectView('pipeline')}
          className="font-serif text-xl font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A8A]"
        >
          LexPulse
        </button>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Navigazione principale"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            const showNotice = item.id === 'deliverables' && hasDeliverables;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A8A] ${
                  isActive
                    ? 'text-[#1E3A8A] font-semibold'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {item.label}
                {showNotice && !isActive ? ' *' : ''}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute right-0 bottom-0 left-0 h-[1.5px] bg-[#1E3A8A]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onTriggerCercaNovita}
            disabled={isRunning}
            className="inline-flex items-center gap-2 rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#172E6E] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Analisi in corso</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" aria-hidden="true" />
                <span>Cerca Novità</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation strip */}
      <div className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-[#E5E0D5] px-6 py-2.5 text-xs font-medium">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`whitespace-nowrap shrink-0 py-1 ${
                isActive ? 'text-[#1E3A8A] font-semibold' : 'text-[#57534E]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
