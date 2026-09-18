export const WORKFLOW_REVIEW_ACTIONS = ['approve', 'reject', 'return'];

export const WORKFLOW_BUTTON_LABELS = {
  submit: 'Submit',
  forward: 'Forward',
  approve: 'Endorse',
};

export const suggestWorkflowStepButtonLabel = ({
  stepOrder = 1,
  totalSteps = 1,
  isStartStep = false,
} = {}) => {
  const order = Number(stepOrder);
  const total = Number(totalSteps);

  if (isStartStep || order <= 1) {
    return WORKFLOW_BUTTON_LABELS.submit;
  }

  if (order >= total) {
    return WORKFLOW_BUTTON_LABELS.approve;
  }

  return WORKFLOW_BUTTON_LABELS.forward;
};

export const getWorkflowForwardButtonLabel = (workflow) => {
  const currentStep = workflow?.current_step;
  if (!currentStep) {
    return WORKFLOW_BUTTON_LABELS.forward;
  }

  const resolved = currentStep.resolved_button_label || currentStep.button_label;
  if (resolved) {
    return resolved;
  }

  const timeline = Array.isArray(workflow?.timeline) ? workflow.timeline : [];
  const currentOrder = Number(currentStep.order ?? currentStep.step_order ?? 1);
  const totalSteps = timeline.length
    ? Math.max(...timeline.map((step) => Number(step.order ?? step.step_order ?? 0)), currentOrder)
    : currentOrder;

  return suggestWorkflowStepButtonLabel({
    stepOrder: currentOrder,
    totalSteps,
    isStartStep: currentOrder <= 1,
  });
};

export const getWorkflowAvailableActions = (workflow) => (
  Array.isArray(workflow?.available_actions) ? workflow.available_actions : []
);

export const canActOnWorkflow = (workflow, actions = WORKFLOW_REVIEW_ACTIONS) => {
  const available = getWorkflowAvailableActions(workflow);
  return actions.some((action) => available.includes(action));
};

export const canVerifyWorkflow = (workflow) => (
  getWorkflowAvailableActions(workflow).includes('approve')
);

export const canRejectWorkflow = (workflow) => (
  getWorkflowAvailableActions(workflow).includes('reject')
);

export const canReturnWorkflowAction = (workflow) => (
  getWorkflowAvailableActions(workflow).includes('return')
);

export const resolveWorkflowActionPermissions = (user, workflow, hasPermission) => ({
  canApprove: hasPermission(user, 'approve-workflows') || canVerifyWorkflow(workflow),
  canReject: hasPermission(user, 'reject-workflows') || canRejectWorkflow(workflow),
  canReturn: hasPermission(user, 'return-workflows') || canReturnWorkflowAction(workflow),
});

export const canModifySubmittedAssessment = (workflow) => (
  workflow?.can_modify === true
  || getWorkflowAvailableActions(workflow).includes('resubmit')
);

export const getWorkflowFeedback = (workflow) => workflow?.latest_feedback || null;

export const isWorkflowReturned = (workflow) => String(workflow?.status || '').toLowerCase() === 'returned';

export const resolveWorkflowPreviewMode = ({
  requestedMode,
  workflow,
  submitted = false,
}) => {
  if (requestedMode === 'preview') {
    return true;
  }

  if (!submitted || !workflow) {
    return false;
  }

  return !canActOnWorkflow(workflow) && !canModifySubmittedAssessment(workflow);
};
