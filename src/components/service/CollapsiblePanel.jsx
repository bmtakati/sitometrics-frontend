import React from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const CollapsiblePanel = ({ title, expanded, onToggle, children, headerAction = null }) => (
  <div className="rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{title}</h3>
        <span className="shrink-0 text-stone-400">
          {expanded ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
    </div>
    {expanded ? <div className="space-y-4 border-t border-stone-200 px-4 pb-4 pt-4 dark:border-stone-700">{children}</div> : null}
  </div>
);

export default CollapsiblePanel;
