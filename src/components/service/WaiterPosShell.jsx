import React from 'react';
import { FiClipboard, FiCoffee, FiList, FiMaximize, FiMinimize, FiPlus } from 'react-icons/fi';
import { usePosMode } from '../../context/PosModeContext';

/**
 * Touch / POS shell for waiter: bottom tabs, large tap targets, no app chrome.
 */
const WaiterPosShell = ({
  tab,
  onTabChange,
  outletSelect,
  alerts,
  ordersPanel,
  newOrderPanel,
  detailPanel,
  selectedOrderLabel,
  onExitPos,
}) => {
  const { enterFullscreen, exitFullscreen, isFullscreen, setPosMode } = usePosMode();

  const handleExit = () => {
    if (onExitPos) onExitPos();
    else setPosMode(false);
  };

  const tabs = [
    { id: 'orders', label: 'Orders', icon: FiList },
    { id: 'new', label: 'New', icon: FiPlus },
    { id: 'detail', label: selectedOrderLabel ? 'Order' : 'Current', icon: FiClipboard },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-stone-100 dark:bg-stone-950">
      <header className="flex shrink-0 items-center gap-2 border-b border-stone-200 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-900">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FiCoffee className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">{outletSelect}</div>
        </div>
        <button
          type="button"
          onClick={() => (isFullscreen ? exitFullscreen() : enterFullscreen())}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-stone-200 text-stone-600 dark:border-stone-600 dark:text-stone-300"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <FiMinimize className="h-5 w-5" /> : <FiMaximize className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={handleExit}
          className="min-h-11 rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 dark:border-stone-600 dark:text-stone-300"
        >
          Exit POS
        </button>
      </header>

      {alerts ? <div className="shrink-0 space-y-2 px-3 pt-2">{alerts}</div> : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-24">
        {tab === 'orders' ? ordersPanel : null}
        {tab === 'new' ? newOrderPanel : null}
        {tab === 'detail' ? detailPanel : null}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-[70] border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-700 dark:bg-stone-900/95">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-1 p-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default WaiterPosShell;
