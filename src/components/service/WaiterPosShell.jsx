import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiClipboard, FiCoffee, FiList, FiLogOut, FiPlus } from 'react-icons/fi';
import { usePosMode } from '../../context/PosModeContext';
import { useAuth } from '../../context/AuthContext';
import PosLogoutConfirm from './PosLogoutConfirm';

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
  const { setPosMode } = usePosMode();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleExit = () => {
    if (onExitPos) onExitPos();
    else setPosMode(false);
  };

  const handleLogout = () => {
    setConfirmLogout(true);
  };

  const performLogout = async () => {
    setConfirmLogout(false);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
    setPosMode(false);
    logout();
    navigate('/');
  };

  const tabs = [
    { id: 'orders', label: 'Orders', icon: FiList },
    { id: 'new', label: 'New', icon: FiPlus },
    { id: 'detail', label: selectedOrderLabel ? 'Order' : 'Current', icon: FiClipboard },
  ];

  return createPortal(
    <div
      className="fixed inset-0 flex h-[100dvh] w-screen flex-col bg-stone-100 dark:bg-stone-950"
      style={{ zIndex: 2147483000, top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-stone-200 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-900">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FiCoffee className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">{outletSelect}</div>
        </div>
        {onExitPos ? (
          <button
            type="button"
            onClick={handleExit}
            className="min-h-14 rounded-xl border border-stone-200 px-4 text-base font-semibold text-stone-600 dark:border-stone-600 dark:text-stone-300"
          >
            Exit POS
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-red-600 px-4 text-base font-semibold text-white"
        >
          <FiLogOut className="h-5 w-5" />
          Logout
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
                    ? 'bg-amber-500 text-stone-950'
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
      <PosLogoutConfirm
        open={confirmLogout}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={performLogout}
      />
    </div>,
    document.body
  );
};

export default WaiterPosShell;
