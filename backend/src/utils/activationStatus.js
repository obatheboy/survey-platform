const ACTIVATION_PLANS = ["REGULAR", "VIP", "VVIP"];

const PLAN_FIELD_MAP = {
  REGULAR: "regular_paid",
  VIP: "vip_paid",
  VVIP: "vvip_paid",
};

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
  if (PLAN_FIELD_MAP[planKey] && user[PLAN_FIELD_MAP[planKey]] === true) return true;
  if (user.plans_paid?.[planKey] === true) return true;
  return user.plans?.[planKey]?.is_activated === true;
};

const getNextUnpaidPlanForRedirect = (user) => {
  const unpaidPlans = ACTIVATION_PLANS.filter(planKey => !isPlanDone(user, planKey));
  return unpaidPlans[0] || null;
};

const isWelcomeBonusPaid = (user) => {
  return user.welcome_bonus_paid === true || user.plans_paid?.WELCOME_BONUS === true;
};

const getRemainingActivationPlans = (user) => {
  return ACTIVATION_PLANS.filter(planKey => !isPlanDone(user, planKey));
};

const getNextActivationPlan = (user) => {
  return getRemainingActivationPlans(user)[0] || null;
};

const buildActivationRedirect = (user) => {
  const remainingPlans = getRemainingActivationPlans(user);
  const accountActivated = user.account_activated === true || user.all_plans_completed === true || user.is_activated === true;

  if (remainingPlans.length === 0) {
    return {
      redirect_to: "/dashboard",
      remaining_plans: [],
      next_plan: null,
      dashboard: true
    };
  }

  const nextPlan = remainingPlans[0];

  return {
    redirect_to: `/dashboard?focusPlan=${nextPlan}&highlightPlan=${nextPlan}`,
    remaining_plans: remainingPlans,
    next_plan: nextPlan,
    dashboard: false
  };
};

const buildPaymentRedirect = (user) => {
  const remainingSurveyPlans = getRemainingActivationPlans(user);

  if (remainingSurveyPlans.length > 0) {
    const nextPlan = remainingSurveyPlans[0];
    return {
      redirect_to: `/dashboard?focusPlan=${nextPlan}&highlightPlan=${nextPlan}`,
      next_plan: nextPlan,
      remaining_plans: remainingSurveyPlans,
      dashboard: false
    };
  }

  return {
    redirect_to: "/dashboard",
    next_plan: null,
    remaining_plans: [],
    dashboard: true
  };
};

const syncActivationStatus = (user) => {
  let changed = false;
  let paidCount = 0;

  ACTIVATION_PLANS.forEach((planKey) => {
    ensurePlanEntry(user, planKey);

    // Only trust explicit payment flags - NOT is_activated alone
    // is_activated can be true without payment if it was set during testing
    const paid = isPlanDone(user, planKey);

    if (paid) {
      paidCount++;
      if (!user.plans_paid) user.plans_paid = {};
      if (user.plans_paid[planKey] !== true) {
        user.plans_paid[planKey] = true;
        changed = true;
      }
      const field = PLAN_FIELD_MAP[planKey];
      if (user[field] !== true) {
        user[field] = true;
        changed = true;
      }
      if (!user.plans[planKey].is_activated) {
        user.plans[planKey].is_activated = true;
        changed = true;
      }
      if (!user.plans[planKey].activated_at) {
        user.plans[planKey].activated_at = new Date();
        changed = true;
      }
    } else {
      // NOT paid - ensure is_activated is also false
      if (user.plans[planKey].is_activated === true) {
        user.plans[planKey].is_activated = false;
        changed = true;
      }
    }
  });

  const shouldActivate = paidCount === ACTIVATION_PLANS.length;

  if (user.account_activated !== shouldActivate) {
    user.account_activated = shouldActivate;
    changed = true;
  }

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
  isWelcomeBonusPaid,
  getRemainingActivationPlans,
  getNextActivationPlan,
  getNextUnpaidPlanForRedirect,
  buildActivationRedirect,
  buildPaymentRedirect,
};
