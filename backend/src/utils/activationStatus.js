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

const syncActivationStatus = (user) => {
  let changed = false;
  let allPaid = true;
  let allManuallyActivated = true;

  ACTIVATION_PLANS.forEach((planKey) => {
    changed = ensurePlanEntry(user, planKey) || changed;

    const paid = user.plans_paid?.[planKey] === true;
    const activated = user.plans[planKey].is_activated === true;

    if (!paid) allPaid = false;
    if (!activated) allManuallyActivated = false;

    if (paid || activated) {
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

  if (shouldActivate && !user.is_activated) {
    user.is_activated = true;
    changed = true;
  }

  if (shouldActivate && !user.activated_at) {
    user.activated_at = new Date();
    changed = true;
  }

  return { user, changed };
};

module.exports = {
  ACTIVATION_PLANS,
  syncActivationStatus,
};
