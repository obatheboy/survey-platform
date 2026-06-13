const ACTIVATION_PLANS = ["REGULAR", "VIP", "VVIP"];

const ensurePlanEntry = (user, planKey) => {
  if (!user.plans) {
    user.plans = {};
    return true;
  }

  if (!user.plans[planKey]) {
    user.plans[planKey] = {
      surveys_completed: 0,
      completed: false,
      is_activated: false,
      total_surveys: 10,
      activated_at: null,
    };
    return true;
  }

  return false;
};

const isPlanDone = (user, planKey) => {
  return user.plans_paid?.[planKey] === true || user.plans?.[planKey]?.is_activated === true;
};

const getRemainingActivationPlans = (user) => {
  return ACTIVATION_PLANS.filter(planKey => !isPlanDone(user, planKey));
};

const getNextActivationPlan = (user) => {
  return getRemainingActivationPlans(user)[0] || null;
};

const buildActivationRedirect = (user) => {
  const remainingPlans = getRemainingActivationPlans(user);
  const allDone = remainingPlans.length === 0;

  if (allDone) {
    return {
      redirect_to: "/withdraw-form",
      remaining_plans: [],
      next_plan: null
    };
  }

  const nextPlan = remainingPlans[0];

  return {
    redirect_to: `/dashboard?focusPlan=${nextPlan}&highlightPlan=${nextPlan}`,
    remaining_plans: remainingPlans,
    next_plan: nextPlan
  };
};

const syncActivationStatus = (user) => {
  let changed = false;
  let allPaid = true;
  let allManuallyActivated = true;

  ACTIVATION_PLANS.forEach((planKey) => {
    changed = ensurePlanEntry(user, planKey) || changed;

    const paid = user.plans_paid?.[planKey] === true;
    const activated = user.plans[planKey].is_activated === true;
    const isDone = paid || activated;

    if (!paid) allPaid = false;
    if (!activated) allManuallyActivated = false;

    if (isDone) {
      if (!user.plans_paid) user.plans_paid = {};
      if (!user.plans_paid[planKey]) {
        user.plans_paid[planKey] = true;
        changed = true;
      }

      if (!activated) {
        user.plans[planKey].is_activated = true;
        changed = true;
      }

      if (!user.plans[planKey].activated_at) {
        user.plans[planKey].activated_at = new Date();
        changed = true;
      }
    }
  });

  const shouldActivate = allPaid || allManuallyActivated;

  if (user.all_plans_completed !== shouldActivate) {
    user.all_plans_completed = shouldActivate;
    changed = true;
  }

  if (user.is_activated !== shouldActivate) {
    user.is_activated = shouldActivate;
    changed = true;
  }

  if (shouldActivate && !user.activated_at) {
    user.activated_at = new Date();
    changed = true;
  }

  if (shouldActivate && !user.activated_by) {
    user.activated_by = ACTIVATION_PLANS.find(planKey => isPlanDone(user, planKey)) || "REGULAR";
    changed = true;
  }

  return { user, changed };
};

module.exports = {
  ACTIVATION_PLANS,
  syncActivationStatus,
  isPlanDone,
  getRemainingActivationPlans,
  getNextActivationPlan,
  buildActivationRedirect,
};
