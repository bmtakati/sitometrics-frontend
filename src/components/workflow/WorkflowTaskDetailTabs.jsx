import React from 'react';
import { FiCheck } from 'react-icons/fi';
import WorkflowComments from './WorkflowComments';
import { workflowStatusBadgeStyle, workflowStatusMeta } from '../../utils/workflowStatusMeta';

const formatDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
};

export const WorkflowTaskSummary = ({ darkMode, detail, workflowStatusMap }) => (
  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
    <div>
      <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Workflow</div>
      <div className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{detail.workflow?.name || '—'}</div>
    </div>
    <div>
      <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</div>
      <span
        className="mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium"
        style={workflowStatusBadgeStyle(detail.status, workflowStatusMap, detail.status_meta)}
      >
        {workflowStatusMeta(detail.status, workflowStatusMap, detail.status_meta).label}
      </span>
    </div>
    <div>
      <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current step</div>
      <div className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{detail.current_step?.name || '—'}</div>
    </div>
    <div>
      <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Started</div>
      <div className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
        {detail.started_by?.name || '—'}
        {detail.started_at ? ` · ${formatDateTime(detail.started_at)}` : ''}
      </div>
    </div>
  </div>
);

export const WorkflowStepsTab = ({ darkMode, detail, workflowStatusMap }) => {
  const timeline = Array.isArray(detail?.timeline) ? detail.timeline : [];
  const currentStepCode = detail?.current_step?.code;

  if (!timeline.length) {
    return (
      <div className={`rounded-lg border border-dashed px-4 py-6 text-sm ${
        darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
      }`}>
        No workflow steps are available yet.
      </div>
    );
  }

  return (
    <ol className="relative space-y-4">
      {timeline.map((item, index) => {
        const isCurrent = Boolean(item.is_current) || (currentStepCode && String(item.step_code) === String(currentStepCode));
        const isComplete = ['approved', 'completed'].includes(String(item.status));
        const isRejected = ['rejected', 'returned', 'cancelled'].includes(String(item.status));
        const statusMeta = workflowStatusMeta(item.status, workflowStatusMap, item.status_meta);

        return (
          <li key={`${item.step_code || item.step || 'step'}-${index}`} className="relative flex gap-4">
            {index < timeline.length - 1 ? (
              <span className={`absolute left-[1.125rem] top-10 h-[calc(100%+1rem)] border-l-2 border-dotted ${
                darkMode ? 'border-gray-600' : 'border-gray-300'
              }`}
              />
            ) : null}
            <span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
              isRejected
                ? darkMode ? 'border-red-700 bg-red-950 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
                : isComplete
                  ? 'border-green-600 bg-green-600 text-white'
                  : isCurrent
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : darkMode ? 'border-gray-600 bg-gray-800 text-gray-300' : 'border-gray-300 bg-white text-gray-600'
            }`}
            >
              {isComplete ? <FiCheck className="h-4 w-4" strokeWidth={3} /> : index + 1}
            </span>
            <div className={`min-w-0 flex-1 rounded-lg border px-4 py-3 ${
              isCurrent
                ? darkMode ? 'border-primary-700 bg-primary-950/30' : 'border-primary-200 bg-primary-50'
                : darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
            }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {item.step || 'Workflow step'}
                  </h3>
                  {item.assignee_role ? (
                    <p className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Role: {item.assignee_role}
                    </p>
                  ) : null}
                  <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.actor || 'Unassigned'}
                    {item.acted_at ? ` · ${formatDateTime(item.acted_at)}` : ''}
                  </p>
                  {item.action_label ? (
                    <p className={`mt-1 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.action_label}
                    </p>
                  ) : null}
                </div>
                <span
                  className="inline-flex w-fit rounded-full border px-2 py-1 text-xs font-semibold"
                  style={workflowStatusBadgeStyle(item.status, workflowStatusMap, item.status_meta)}
                >
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export const WorkflowCommentsTab = ({
  darkMode,
  detail,
  actionFilter = null,
  actionForm = null,
}) => (
  <WorkflowComments
    darkMode={darkMode}
    detail={detail}
    actionFilter={actionFilter}
    actionForm={actionForm}
  />
);
