import React, { useEffect, useMemo, useState } from 'react';
import { FiLoader } from 'react-icons/fi';
import FormModal from '../FormModal/FormModal';
import WorkflowCommentsActionForm from './WorkflowCommentsActionForm';
import {
  WorkflowCommentsTab,
  WorkflowStepsTab,
  WorkflowTaskSummary,
} from './WorkflowTaskDetailTabs';
import { formatWorkflowCommentsTabLabel, getWorkflowCommentsCount } from '../../utils/workflowComments';
import { buildWorkflowStatusMap } from '../../utils/workflowStatusMeta';
import apiFetch from '../../utils/apiFetch';
import { publicKey } from '../../utils/publicKey';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { showErrorDialog, showSuccessToast } from '../../utils/dialogUtils';
import useDarkMode from '../../hooks/useDarkMode';
import { notifyWorkflowPendingCountChanged } from '../../utils/workflowEvents';

const WorkflowTaskModal = ({
  isOpen,
  onClose,
  instanceKey,
  defaultDetail = null,
  onCompleted,
  readOnly = false,
}) => {
  const darkMode = useDarkMode();
  const { user } = useAuth();
  const canApprove = !readOnly && (
    hasPermission(user, 'approve-workflows')
    || hasPermission(user, 'verify-purchase-requisitions')
    || hasPermission(user, 'approve-purchase-requisitions')
    || hasPermission(user, 'verify-local-purchase-orders')
    || hasPermission(user, 'approve-local-purchase-orders')
    || hasPermission(user, 'verify-goods-received-notes')
    || hasPermission(user, 'approve-goods-received-notes')
  );
  const canReject = !readOnly && (
    hasPermission(user, 'reject-workflows')
    || hasPermission(user, 'reject-purchase-requisitions')
    || hasPermission(user, 'reject-local-purchase-orders')
    || hasPermission(user, 'reject-goods-received-notes')
  );
  const canReturn = !readOnly && hasPermission(user, 'return-workflows');

  const [detail, setDetail] = useState(defaultDetail);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [actionResetKey, setActionResetKey] = useState(0);
  const [workflowStatusMap, setWorkflowStatusMap] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    apiFetch(`${API_BASE_URL}/api/status-groups/all`)
      .then((response) => response.json().catch(() => ({})))
      .then((json) => {
        if (!cancelled) {
          setWorkflowStatusMap(buildWorkflowStatusMap(Array.isArray(json?.data) ? json.data : []));
        }
      })
      .catch(() => {
        if (!cancelled) setWorkflowStatusMap({});
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setDetail(defaultDetail);
      setDetailLoading(false);
      setActing(false);
      return;
    }

    const key = instanceKey || publicKey(defaultDetail) || defaultDetail?.uid || defaultDetail?.id;
    if (!key) {
      setDetail(defaultDetail);
      return;
    }

    let cancelled = false;
    setDetail(defaultDetail);
    setDetailLoading(true);

    apiFetch(`${API_BASE_URL}/api/workflow-instances/${encodeURIComponent(key)}`)
      .then((response) => response.json().then((json) => ({ response, json })).catch(() => ({ response, json: {} })))
      .then(({ response, json }) => {
        if (cancelled) return;
        if (!response.ok || json.success === false) {
          throw new Error(json.message || 'Failed to load workflow instance');
        }
        setDetail(json.data);
      })
      .catch((error) => {
        if (!cancelled) {
          showErrorDialog(error.message || 'Failed to load workflow instance');
          onClose?.();
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [defaultDetail, instanceKey, isOpen, onClose]);

  const runAction = async (action, actionComment) => {
    const key = publicKey(detail) || detail?.uid || detail?.id;
    if (!key) return;

    setActing(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/workflow-instances/${encodeURIComponent(key)}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: String(actionComment || '').trim() }),
      });
      const json = await response.json();
      if (!response.ok || json.success === false) {
        throw new Error(json.message || `Failed to ${action} workflow`);
      }
      showSuccessToast(json.message || `Workflow ${action}d successfully`);
      notifyWorkflowPendingCountChanged();
      setActionResetKey((value) => value + 1);
      onClose?.();
      onCompleted?.();
    } catch (error) {
      showErrorDialog(error.message || `Failed to ${action} workflow`);
    } finally {
      setActing(false);
    }
  };

  const handleWorkflowAction = (action, actionComment) => {
    runAction(action === 'verify' ? 'approve' : action, actionComment);
  };

  const workflowCommentCount = getWorkflowCommentsCount(detail);
  const actionForm = !readOnly && detail && !detailLoading ? (
    <WorkflowCommentsActionForm
      key={actionResetKey}
      darkMode={darkMode}
      workflow={detail}
      loading={acting}
      canApprove={canApprove}
      canReject={canReject}
      canReturn={canReturn}
      onAction={handleWorkflowAction}
    />
  ) : null;

  const tabs = useMemo(() => [
    {
      id: 'comments',
      label: formatWorkflowCommentsTabLabel(workflowCommentCount),
      fields: [{
        name: 'comments',
        type: 'custom',
        fullWidth: true,
        render: () => (
          detailLoading ? (
            <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <FiLoader className="w-4 h-4 animate-spin" />
              Loading workflow details...
            </div>
          ) : detail ? (
            <WorkflowCommentsTab
              darkMode={darkMode}
              detail={detail}
              actionForm={actionForm}
            />
          ) : (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No details available.</p>
          )
        ),
      }],
    },
    {
      id: 'steps',
      label: 'Steps',
      fields: [{
        name: 'steps',
        type: 'custom',
        fullWidth: true,
        render: () => (
          detailLoading ? (
            <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <FiLoader className="w-4 h-4 animate-spin" />
              Loading workflow details...
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <WorkflowTaskSummary
                darkMode={darkMode}
                detail={detail}
                workflowStatusMap={workflowStatusMap}
              />
              <WorkflowStepsTab darkMode={darkMode} detail={detail} workflowStatusMap={workflowStatusMap} />
            </div>
          ) : (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No details available.</p>
          )
        ),
      }],
    },
  ], [actionForm, darkMode, detail, detailLoading, workflowCommentCount, workflowStatusMap]);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={() => {
        if (acting) return;
        onClose?.();
      }}
      title={readOnly ? 'Workflow Progress' : 'Workflow Task'}
      fields={[]}
      tabs={tabs}
      initialTab="comments"
      formData={{}}
      onInputChange={() => {}}
      onSubmit={(event) => event.preventDefault()}
      errors={{}}
      isLoading={detailLoading || acting}
      readOnly
      hideFooter
      maxWidth="max-w-3xl"
      fieldsLayout="stack"
    />
  );
};

export default WorkflowTaskModal;
