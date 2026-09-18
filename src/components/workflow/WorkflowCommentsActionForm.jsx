import React, { useState } from 'react';
import {
  FiCheck,
  FiCornerUpLeft,
  FiLoader,
  FiSend,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import { showErrorToast, showWorkflowActionConfirm } from '../../utils/dialogUtils';
import { getWorkflowAvailableActions, getWorkflowForwardButtonLabel } from '../../utils/workflowActions';

const COMMENT_REQUIRED_MESSAGE = 'Comments are required.';

const ACTION_LABELS = {
  submit: 'Submit',
  resubmit: 'Resubmit',
  return: 'Return',
  reject: 'Reject',
  cancel: 'Cancel',
};

const ACTION_BUTTON_BASE =
  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const getActionButtonClasses = (action, darkMode) => {
  const base = darkMode
    ? 'border-gray-600 bg-gray-800/50 text-gray-300'
    : 'border-gray-200 bg-white text-gray-600';

  const hoverByAction = {
    submit: darkMode
      ? 'hover:border-primary-500 hover:bg-gray-800 hover:text-primary-300'
      : 'hover:border-primary-300 hover:bg-gray-50 hover:text-primary-600',
    resubmit: darkMode
      ? 'hover:border-primary-500 hover:bg-gray-800 hover:text-primary-300'
      : 'hover:border-primary-300 hover:bg-gray-50 hover:text-primary-600',
    verify: darkMode
      ? 'hover:border-green-500 hover:bg-gray-800 hover:text-green-300'
      : 'hover:border-green-400 hover:bg-gray-50 hover:text-green-600',
    return: darkMode
      ? 'hover:border-orange-500 hover:bg-gray-800 hover:text-orange-300'
      : 'hover:border-orange-400 hover:bg-gray-50 hover:text-orange-600',
    reject: darkMode
      ? 'hover:border-red-500 hover:bg-gray-800 hover:text-red-300'
      : 'hover:border-red-400 hover:bg-gray-50 hover:text-red-600',
    cancel: darkMode
      ? 'hover:border-gray-500 hover:bg-gray-800 hover:text-gray-200'
      : 'hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700',
  };

  return `${ACTION_BUTTON_BASE} ${base} ${hoverByAction[action] || hoverByAction.cancel}`;
};

const getActionIconClasses = (action, darkMode) => {
  const iconColors = {
    submit: darkMode ? 'text-primary-400' : 'text-primary-600',
    resubmit: darkMode ? 'text-primary-400' : 'text-primary-600',
    verify: darkMode ? 'text-green-400' : 'text-green-600',
    return: darkMode ? 'text-orange-400' : 'text-orange-600',
    reject: darkMode ? 'text-red-400' : 'text-red-600',
    cancel: darkMode ? 'text-gray-400' : 'text-gray-500',
  };

  return `h-4 w-4 shrink-0 ${iconColors[action] || iconColors.cancel}`;
};

const WorkflowCommentsActionForm = ({
  darkMode,
  workflow,
  previewMode = false,
  loading = false,
  resubmitReady = true,
  canApprove = true,
  canReject = true,
  canReturn: canReturnPermission = true,
  canCancel = true,
  onAction,
}) => {
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const availableActions = getWorkflowAvailableActions(workflow);
  const forwardButtonLabel = getWorkflowForwardButtonLabel(workflow);

  const canSubmit = !previewMode && availableActions.includes('submit');
  const canResubmit = !previewMode && availableActions.includes('resubmit');
  const canVerify = !previewMode && availableActions.includes('approve') && canApprove;
  const canReturnAction = !previewMode && availableActions.includes('return') && canReturnPermission;
  const canRejectAction = !previewMode && availableActions.includes('reject') && canReject;
  const canCancelAction = !previewMode && availableActions.includes('cancel') && canCancel;
  const starterAction = canResubmit ? 'resubmit' : (canSubmit ? 'submit' : null);
  const isInitialSubmit = starterAction === 'submit';
  const showCommentBox = !isInitialSubmit;
  const showCancelButton = canCancelAction && !isInitialSubmit;
  const starterLabel = starterAction === 'submit'
    ? (forwardButtonLabel || 'Submit')
    : (starterAction === 'resubmit' ? (forwardButtonLabel || 'Submit') : null);

  const hasActions = Boolean(starterAction) || canVerify || canReturnAction || canRejectAction || showCancelButton;
  if (!hasActions) return null;

  const handleCommentChange = (event) => {
    setComment(event.target.value);
    if (commentError) {
      setCommentError('');
    }
  };

  const getActionLabel = (action) => {
    if (action === 'verify' || action === 'submit' || action === 'resubmit') {
      return forwardButtonLabel || ACTION_LABELS[action] || action;
    }
    return ACTION_LABELS[action] || action;
  };

  const handleAction = async (action) => {
    const trimmedComment = comment.trim();
    if (showCommentBox && !trimmedComment) {
      setCommentError(COMMENT_REQUIRED_MESSAGE);
      showErrorToast(COMMENT_REQUIRED_MESSAGE);
      return;
    }

    setCommentError('');

    const actionLabel = getActionLabel(action);
    const result = await showWorkflowActionConfirm({
      action,
      actionLabel,
      comment: trimmedComment,
      darkMode,
    });

    if (!result?.isConfirmed) return;

    onAction?.(action, trimmedComment);
  };

  return (
    <section
      className={`mb-4 rounded-xl border px-3 py-3 sm:px-4 ${
        darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50'
      }`}
      aria-label="Workflow action form"
    >
      {showCommentBox ? (
        <>
          <div className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Add comment and submit
          </div>
          <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Choose a workflow action below. A comment is required.
          </p>
        </>
      ) : null}

      {showCommentBox ? (
        <label className={`mt-3 block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Comment
          <textarea
            value={comment}
            onChange={handleCommentChange}
            rows={3}
            disabled={loading}
            placeholder="Write workflow comments..."
            aria-invalid={Boolean(commentError)}
            aria-describedby={commentError ? 'workflow-comment-error' : undefined}
            className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
              commentError
                ? 'border-red-500 ring-1 ring-red-500'
                : darkMode
                  ? 'border-gray-600'
                  : 'border-gray-300'
            } ${
              darkMode
                ? 'bg-gray-900 text-gray-100 placeholder:text-gray-500'
                : 'bg-white text-gray-900 placeholder:text-gray-400'
            }`}
          />
          {commentError ? (
            <p id="workflow-comment-error" className="mt-1 text-sm text-red-600" role="alert">
              {commentError}
            </p>
          ) : null}
        </label>
      ) : null}

      <div className={`${showCommentBox ? 'mt-3' : ''} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex flex-wrap items-center gap-3 sm:justify-start">
          {showCancelButton ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('cancel')}
              className={getActionButtonClasses('cancel', darkMode)}
            >
              <FiX className={getActionIconClasses('cancel', darkMode)} />
              Cancel
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-center">
          {canReturnAction ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('return')}
              className={getActionButtonClasses('return', darkMode)}
            >
              <FiCornerUpLeft className={getActionIconClasses('return', darkMode)} />
              Return
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {canRejectAction ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('reject')}
              className={getActionButtonClasses('reject', darkMode)}
            >
              <FiXCircle className={getActionIconClasses('reject', darkMode)} />
              Reject
            </button>
          ) : null}
          {canVerify ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('verify')}
              className={getActionButtonClasses('verify', darkMode)}
            >
              {loading ? (
                <FiLoader className={`${getActionIconClasses('verify', darkMode)} animate-spin`} />
              ) : (
                <FiCheck className={getActionIconClasses('verify', darkMode)} />
              )}
              {forwardButtonLabel}
            </button>
          ) : null}
          {starterAction ? (
            <button
              type="button"
              disabled={loading || !resubmitReady}
              onClick={() => handleAction(starterAction)}
              title={!resubmitReady ? 'Complete all required sections before continuing.' : undefined}
              className={getActionButtonClasses(starterAction, darkMode)}
            >
              {loading ? (
                <FiLoader className={`${getActionIconClasses(starterAction, darkMode)} animate-spin`} />
              ) : (
                <FiSend className={getActionIconClasses(starterAction, darkMode)} />
              )}
              {starterLabel}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default WorkflowCommentsActionForm;
