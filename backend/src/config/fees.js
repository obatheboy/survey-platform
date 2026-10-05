/* =====================================================
   💰 FEES - SINGLE SOURCE OF TRUTH
   =====================================================
   The account activation fee is a one-time KES 97 gate. Paying it
   unlocks the app (dashboard, surveys, withdrawal, work tasks).
   It pays out nothing - the only money a user receives is the KES 1,200
   welcome bonus credited at signup and KES 75 per completed survey.

   WHY THIS FILE EXISTS
   --------------------
   The fee used to be duplicated across six backend tables and four
   frontend files. That is dangerous: MegaPay verification compares the
   amount actually paid against the server's expected amount with a
   strict `===` (see megapay.service.js checkTransactionStatus). If the
   frontend displays one number and the server expects another, the
   payment is never confirmed and nobody gets in.

   Every fee table must now import ACTIVATION_FEE from here instead of
   hardcoding a number.
   ===================================================== */

/* One-time activation fee - the gate to the dashboard */
const ACTIVATION_FEE = 97;

/* Legacy login fee. Distinct from the activation fee and not charged
   on the current flow; kept for the /api/login-fee routes. */
const LOGIN_FEE = 95;

/* Paid to the user for each completed survey. The backend credits this
   server-side; the frontend only displays it. Both sides import it so
   the advertised amount always matches the amount credited. */
const SURVEY_EARNINGS = 75;

/* Every plan key now costs the same single activation fee. The
   REGULAR/VIP/VVIP keys are retained because they still appear in
   user.plans, activation_requests and admin screens, but they are no
   longer different prices. */
const PLAN_AMOUNTS = {
  WELCOME_BONUS: ACTIVATION_FEE,
  REGULAR: ACTIVATION_FEE,
  VIP: ACTIVATION_FEE,
  VVIP: ACTIVATION_FEE,
};

const getPlanAmount = (planKey) => {
  return PLAN_AMOUNTS[String(planKey || "").toUpperCase()] ?? ACTIVATION_FEE;
};

const getPlanAmountByKey = (planKey) => {
  return PLAN_AMOUNTS[String(planKey || "").toUpperCase()] ?? null;
};

module.exports = {
  ACTIVATION_FEE,
  LOGIN_FEE,
  SURVEY_EARNINGS,
  PLAN_AMOUNTS,
  getPlanAmount,
  getPlanAmountByKey,
};