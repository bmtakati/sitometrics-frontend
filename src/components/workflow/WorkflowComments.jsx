import React, { useMemo } from 'react';
import { FiCalendar } from 'react-icons/fi';
import {
  filterWorkflowComments,
  mapWorkflowCommentEntry,
} from '../../utils/workflowComments';

const EmptyCommentsState = ({ darkMode }) => (
  <div
    className={`rounded-xl border border-dashed px-4 py-8 text-center sm:px-6 ${
      darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-300 bg-gray-50/60'
    }`}
  >
    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      No workflow comments yet
    </p>
    <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
      Comments and feedback will appear here as the workflow progresses.
    </p>
  </div>
);

const WorkflowCommentItem = ({ item, darkMode, isLast }) => {
  const {
    statusConfig,
    route,
    actorName,
    actorRole,
    comment,
    formattedDate,
    isHumanFeedback,
  } = item;

  const actorAttribution = actorRole ? `${actorName}, ${actorRole}` : actorName;

  const StatusIcon = statusConfig.icon;
  const badgeClass = darkMode ? statusConfig.badgeClassDark : statusConfig.badgeClass;
  const iconClass = darkMode ? statusConfig.iconClassDark : statusConfig.iconClass;
  const lineClass = darkMode ? statusConfig.lineClassDark : statusConfig.lineClass;

  return (
    <li className="relative flex gap-3 sm:gap-4">
      {!isLast ? (
        <span
          className={`absolute left-[1.125rem] top-10 h-[calc(100%-0.5rem)] w-px sm:left-[1.375rem] ${lineClass}`}
          aria-hidden="true"
        />
      ) : null}

      <div className="flex w-9 shrink-0 justify-center sm:w-11">
        <span
          className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border sm:h-10 sm:w-10 ${iconClass}`}
          aria-hidden="true"
        >
          <StatusIcon className="h-4 w-4" />
        </span>
      </div>

      <article
        className={`mb-3 min-w-0 flex-1 rounded-xl border px-3 py-3 shadow-sm sm:mb-3.5 sm:px-4 ${
          darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
        }`}
        aria-label={`${statusConfig.label} workflow comment`}
      >
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide ${badgeClass}`}
            >
              {statusConfig.label}
            </span>
            {route ? (
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {route}
              </span>
            ) : null}
          </div>

          {formattedDate ? (
            <time
              dateTime={item.actedAt || undefined}
              className={`inline-flex shrink-0 items-center gap-1 text-xs tabular-nums ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <FiCalendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formattedDate}</span>
            </time>
          ) : null}
        </header>

        <div
          className={`mt-3 rounded-lg border px-3 py-2.5 text-sm leading-relaxed ${
            comment
              ? isHumanFeedback
                ? darkMode
                  ? 'border-gray-600 border-l-2 border-l-orange-500 bg-gray-900/60 text-gray-100'
                  : 'border-gray-200 border-l-2 border-l-orange-500 bg-white text-gray-800'
                : darkMode
                  ? 'border-gray-600 bg-gray-900/70 text-gray-300'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
              : darkMode
                ? 'border-gray-600 bg-gray-900/40 text-gray-500'
                : 'border-gray-200 bg-gray-50 text-gray-400'
          }`}
        >
          {comment ? (
            <>
              {comment}
              <span className={`ml-1.5 text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ({actorAttribution})
              </span>
            </>
          ) : (
            <>
              <span className="italic">No comment provided.</span>
              <span className={`ml-1.5 text-xs font-normal not-italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ({actorAttribution})
              </span>
            </>
          )}
        </div>
      </article>
    </li>
  );
};

const WorkflowTimeline = ({ items, darkMode }) => (
  <ol className="relative m-0 list-none p-0">
    {items.map((item, index) => (
      <WorkflowCommentItem
        key={item.id || index}
        item={item}
        darkMode={darkMode}
        isLast={index === items.length - 1}
      />
    ))}
  </ol>
);

const WorkflowComments = ({
  darkMode,
  detail,
  actionFilter = null,
  actionForm = null,
}) => {
  const items = useMemo(() => (
    filterWorkflowComments(detail, actionFilter).map(mapWorkflowCommentEntry)
  ), [detail, actionFilter]);

  return (
    <section aria-label="Workflow comments">
      {items.length ? (
        <WorkflowTimeline items={items} darkMode={darkMode} />
      ) : (
        <EmptyCommentsState darkMode={darkMode} />
      )}
      {actionForm ? (
        <div className={`mt-4 border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {actionForm}
        </div>
      ) : null}
    </section>
  );
};

export default WorkflowComments;
export { EmptyCommentsState, WorkflowCommentItem, WorkflowTimeline, WorkflowComments };
