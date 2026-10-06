/* =====================================================
   💰 FEES - FRONTEND MIRROR
   =====================================================
   MUST match backend/src/config/fees.js.

   MegaPay verification compares the amount actually paid against the
   server's expected amount with a strict `===`. If this number drifts
   from the backend, a user pays the displayed amount, verification
   fails, and the account is never activated. Treat these two files as
   a single unit.

   The activation fee is a one-time gate to the dashboard. It pays out
   nothing.
   ===================================================== */

export const ACTIVATION_FEE = 97;

/* Paid to the user for each completed survey. Mirrors
   SURVEY_EARNINGS in backend/src/config/fees.js - the backend credits this
   server-side, so both must agree or the advertised amount is wrong. */
export const SURVEY_EARNINGS = 75;

/* ChatWazungu profile unlock - cost to unlock one profile */
export const UNLOCK_FEE = 99;

/* Paid to the user for each ChatWazungu profile unlock. */
export const CHAT_UNLOCK_EARNINGS = 50;

export default { ACTIVATION_FEE, SURVEY_EARNINGS, UNLOCK_FEE, CHAT_UNLOCK_EARNINGS };