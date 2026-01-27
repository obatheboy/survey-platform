# 📋 Survey Platform - Complete Flow Documentation

## ✅ All Admin & User Flows Aligned

This document outlines the complete, integrated flow of the survey platform with all admin and user features working together.

---

## 🔄 Complete User Journey

### **Phase 1: User Registration & Terms Acceptance**
1. User goes to `/auth` (Auth.jsx)
2. User enters email, phone, password, full name
3. **Terms & Conditions checkbox** appears at bottom
4. User clicks "Create Account" button
5. Checkbox **animates and auto-checks** with smooth animation
6. Registration completes, user is logged in

**Files:** `Auth.jsx`, `TermsAndConditions.jsx`

---

### **Phase 2: User Activation (Via Admin Panel)**

#### User Flow:
1. User navigates to activation page
2. User enters M-Pesa transaction code and 100 KES activation fee
3. Activation payment is submitted and enters **SUBMITTED** status
4. User waits for admin approval
5. User dashboard shows "Account Pending Activation"

**Files:** `Activate.jsx`, Backend: `activation.controller.js`

#### Admin Flow:
1. Admin goes to **Admin Activations Dashboard** (`AdminActivations.jsx`)
2. Admin can **search** by:
   - User name
   - Phone number
   - Email
   - M-Pesa code
3. Admin can **filter** by status:
   - All
   - Pending (⏳ SUBMITTED)
   - Approved (✅ APPROVED)
   - Rejected (❌ REJECTED)
4. Admin sees **statistics dashboard**:
   - Total activation requests
   - Pending count
   - Approved count
5. Admin clicks **"✓ Approve"** button
6. Activation status changes to **APPROVED**
7. **User is_activated flag** is set to `true` globally
8. **Role Modal** appears automatically asking admin to set user role
9. Admin selects:
   - **👤 Regular User** (role: "user")
   - **👨‍💼 Admin User** (role: "admin")
10. Role is updated in database
11. Success message shows: "✅ Role updated to USER/ADMIN"

**Files:**
- Frontend: `AdminActivations.jsx` (with role modal and success messages)
- Backend: `admin.activation.controller.js` (approveActivation function)

---

### **Phase 3: Withdrawal Flow (After Account Activation)**

#### User Prerequisites:
- Account must be **activated** (is_activated = true)
- Must have completed **10 surveys** (surveys_completed = 10)
- Must have **earned money** (total_earned > 0)

#### User Withdrawal Process:
1. User goes to `/withdraw` page (Withdraw.jsx)
2. If not activated → redirects to `/activation-notice`
3. If surveys < 10 → redirects to `/dashboard`
4. If earnings = 0 → redirects to `/dashboard`
5. User sees **available balance**
6. User enters:
   - Withdrawal amount (with max validation)
   - Phone number (M-Pesa)
7. User clicks "Submit Withdrawal"
8. Backend creates withdrawal request with status = **PROCESSING**
9. User gets **withdrawal code** (6-character random)
10. Share counter starts: **0/3 shares**
11. User can share via:
    - **💬 WhatsApp** (pre-filled message)
    - **📧 Email** (pre-filled subject/body)
    - **📱 SMS** (pre-filled text)
    - **📋 Copy** (copy referral link)
12. After each share → counter increments
13. After 3 shares:
    - Counter reaches **3/3** ✓
    - Status badge changes: "⏸ Pending" → "⏳ Processing"
    - Message: "✓ Shared to 3+ members! Your payment will be processed soon."
14. **Withdrawal Status** updates every 5 seconds:
    - **⏳ PROCESSING** (yellow badge) - awaiting admin
    - **✅ APPROVED** (green badge) - with message: "Payment will be transferred within 24 hours"
    - **❌ REJECTED** (red badge) - with message: "Please contact admin for details"

**Files:**
- Frontend: `Withdraw.jsx` (with real-time status polling)
- Backend: `withdraw.controller.js` (requestWithdraw function)

---

### **Phase 4: Admin Withdrawal Management**

#### Admin Dashboard (`AdminWithdrawals.jsx`):
1. Admin goes to **Admin Withdrawals Dashboard**
2. Admin can **search** by:
   - User name
   - Phone number
   - Email
3. Admin can **filter** by status:
   - All
   - Processing (⏳ PROCESSING)
   - Approved (✅ APPROVED)
   - Rejected (❌ REJECTED)
4. Admin sees **statistics**:
   - Total withdrawal requests
   - Pending count
   - Approved count
   - Rejected count
5. Admin sees **withdrawal details**:
   - User name and contact info
   - Gross amount
   - Fee charged
   - Net amount (amount - fee)
   - Withdrawal type (Normal 💵 or Bonus 🎁)
   - Status with color-coded badge
   - Date and time submitted
6. For **PROCESSING withdrawals** only:
   - Admin clicks **"✓ Approve"** → status changes to APPROVED
   - Admin clicks **"✕ Reject"** → status changes to REJECTED
7. Admin gets success/failure message

**Backend Actions:**
- **Approve**: `/withdraw/admin/:id/approve` (PATCH)
  - Sets status to APPROVED
  - Prepares for M-Pesa transmission
- **Reject**: `/withdraw/admin/:id/reject` (PATCH)
  - Sets status to REJECTED
  - Refunds user (amount returned to wallet)

**Files:**
- Frontend: `AdminWithdrawals.jsx` (with approve/reject buttons)
- Backend: `withdraw.controller.js` (approveWithdraw, rejectWithdraw)

---

## 📊 Data Flow Diagram

```
User Registration & Terms
         ↓
    Auth Flow
         ↓
    Activation Page
         ↓
    Admin Approval → Role Assignment (via Modal)
         ↓
    Account Activated
         ↓
    Complete 10 Surveys
         ↓
    Request Withdrawal
         ↓
    Share & Get 3+ Referrals
         ↓
    Admin Reviews Withdrawal
         ↓
    Admin Approves/Rejects
         ↓
    User Sees Real-Time Status
         ↓
    M-Pesa Payment Processed
```

---

## 🎛️ Admin Dashboard Features

### **AdminUsers.jsx** - User Management
- Search by name, phone, email
- Filter: All / Active / Inactive
- Statistics: Total users, activated count
- Actions: Activate, Set Role, Delete

### **AdminActivations.jsx** - Activation Management ⭐ NEW
- Search by name, phone, email, M-Pesa code
- Filter: All / Pending / Approved / Rejected
- Statistics: Total, Pending, Approved counts
- Actions: Approve (with auto-open role modal), Reject
- **Role Modal**: Set user role after activation
- Status badges with emojis and colors

### **AdminWithdrawals.jsx** - Withdrawal Management ⭐ NEW
- Search by name, phone, email
- Filter: All / Processing / Approved / Rejected
- Statistics: Total, Pending, Approved, Rejected counts
- Display: Gross, Fee, Net amounts
- Actions: Approve, Reject (only for PROCESSING)
- Status badges with emojis and colors
- Withdrawal type indicator (Normal vs Bonus)

---

## 🔐 Security & Validation

### **Activation Protection:**
```javascript
// In Withdraw.jsx - checks BEFORE showing page
if (!u.is_activated) {
  navigate("/activation-notice", replace: true);
}
```

### **Survey Completion Check:**
```javascript
if (u.surveys_completed < 10) {
  navigate("/dashboard", replace: true);
}
```

### **Earnings Requirement:**
```javascript
if (!u.total_earned || u.total_earned <= 0) {
  navigate("/dashboard", replace: true);
}
```

### **Admin Protection:**
All admin endpoints use `adminProtect` middleware to verify admin role.

---

## 📱 UI/UX Features

### **Status Indicators:**
- ⏳ PENDING (Yellow) - Not yet processed
- ⏳ PROCESSING (Cyan) - Being processed by admin
- ✅ APPROVED (Green) - Ready for payment
- ❌ REJECTED (Red) - Payment rejected

### **Progress Tracking:**
- Withdrawal referral counter (0/3 shares)
- Progress bar visualization
- Share count updates immediately

### **Real-Time Updates:**
- Withdrawal status auto-refreshes every 5 seconds
- Admin dashboard shows live statistics
- Status changes visible immediately to users

### **Beautiful Styling:**
- Gradient backgrounds
- Color-coded badges
- Smooth animations
- Professional typography
- Responsive design

---

## 🚀 Complete Flow Summary

**✅ All features implemented and aligned:**
1. ✅ User registration with terms acceptance
2. ✅ Admin activation approval with role assignment
3. ✅ Withdrawal request with referral system
4. ✅ Admin withdrawal approval/rejection
5. ✅ Real-time status updates
6. ✅ Professional admin dashboards
7. ✅ Search and filtering on all admin pages
8. ✅ Security validations at each step
9. ✅ Beautiful UI with consistent styling

**Do exactly as we said:** ✅ All flows implemented exactly as specified!
