const https = require("https");

// MegaPay's new host stores the `reference` we send into its own MySQL
// `TransactionReference` column, which is short (VARCHAR). Long references
// (e.g. "PLAN_REGULAR_<id>_<ts>_<rand>") cause:
//   SQLSTATE[22001]: Data too long for column 'TransactionReference'
// Always send a short reference to MegaPay. Max ~20 chars to be safe.
const generateShortReference = (prefix = "PAY") => {
  const ts = Date.now().toString(36).slice(-6);
  const rand = Math.random().toString(36).substring(2, 6);
  return `${prefix}${ts}${rand}`.toUpperCase().slice(0, 20);
};

const MEGAPAY_CONFIG = {
  apiKey: "MGPYiEkLNh2R",
  email: "obavanteshia65@gmail.com",
  endpoint: "https://api.megapay.co.ke/backend/v1/initiatestk",
  statusEndpoint: "https://api.megapay.co.ke/backend/v1/transactionstatus"
};

// ✅ FIXED: Format phone to 254XXXXXXXXX format (no leading 0)
// Accepts: 07XXXXXXXX, 2547XXXXXXXX, 7XXXXXXXX
const formatPhone = (phone) => {
  let cleaned = phone.replace(/[^0-9]/g, '');

  // If it starts with 0 (e.g., 0712345678), replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  // If it starts with 7 (e.g., 712345678), add 254
  else if (cleaned.startsWith('7')) {
    cleaned = '254' + cleaned;
  }
  // If it starts with +254, remove the +
  else if (cleaned.startsWith('254') && cleaned.length === 12) {
    // Already correct format
  }

  // Ensure we have exactly 12 digits (254 + 9 digits)
  if (cleaned.length !== 12) {
    console.warn(`⚠️ Phone number length is ${cleaned.length}, expected 12 digits for 254 format. Original: ${phone}`);
  }

  console.log(`📱 Formatted phone: ${cleaned}`);
  return cleaned;
};

const makeMegaPayRequest = (url, data) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      timeout: 60000 // Increased from 30000 to 60000
    };

    const postData = JSON.stringify(data);
    options.headers["Content-Length"] = Buffer.byteLength(postData);

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        if (!body || body.trim() === "") {
          resolve({ error: "Empty response from MegaPay" });
          return;
        }

        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve({ error: "Invalid JSON response", raw: body.substring(0, 500) });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    req.write(postData);
    req.end();
  });
};

const initiateSTKPush = async (amount, phoneNumber, reference) => {
  try {
    const formattedPhone = formatPhone(phoneNumber);

    const requestBody = {
      api_key: MEGAPAY_CONFIG.apiKey,
      email: MEGAPAY_CONFIG.email,
      amount: amount.toString(),
      msisdn: formattedPhone,
      reference: reference
    };

    console.log("=== MegaPay STK Push Request ===");
    console.log("Endpoint:", MEGAPAY_CONFIG.endpoint);
    console.log("Phone:", formattedPhone);
    console.log("Amount:", amount);
    console.log("Reference:", reference);

    const response = await makeMegaPayRequest(MEGAPAY_CONFIG.endpoint, requestBody);

    // MegaPay may return the transaction id under several field names.
    const extractTxId = (r) =>
      r.transaction_request_id || r.transactionRequestId || r.TransactionRequestID ||
      r.transaction_id || r.transactionId || r.CheckoutRequestID || r.checkoutRequestId || null;

    // Normalize the human-readable message (new host uses `msg`, old uses `message`).
    const megaMsg = response.message || response.msg || response.errorMessage || response.error || "";

    // Determine success across the various shapes MegaPay returns:
    //  - new host: { success: 200, msg: "Enter MPESA PIN..." }
    //  - old host: { ResultCode: "0", success: true, message: "Please enter your MPESA PIN..." }
    //  - error-with-PIN-prompt: { message/msg: "...enter pin..." }
    const isSuccessCode =
      response.success === "200" || response.success === 200 || response.success === true ||
      response.ResultCode === "0" || response.ResultCode === 0 ||
      response.ResponseCode === "0" || response.ResponseCode === 0;

    const msgLc = String(megaMsg).toLowerCase();
    const looksLikeStkPrompt = msgLc.includes("pin") || msgLc.includes("stk push sent") ||
      msgLc.includes("check your phone") || msgLc.includes("sent to") ||
      msgLc.includes("enter mpesa") || msgLc.includes("complete");

    if (isSuccessCode || looksLikeStkPrompt) {
      console.log("MegaPay STK Push successful");
      return {
        success: true,
        message: megaMsg || "STK Push sent! Check your phone and enter PIN.",
        transaction_request_id: extractTxId(response),
        phone: formattedPhone
      };
    }

    console.error("MegaPay STK Push failed:", response);
    return {
      success: false,
      message: megaMsg || "STK Push failed",
      details: response
    };
  } catch (error) {
    console.error("MegaPay error:", error.message);
    return {
      success: false,
      message: error.message || "Payment gateway error"
    };
  }
};

/**
 * Check MegaPay transaction status
 * Endpoint: POST https://api.megapay.co.ke/backend/v1/transactionstatus
 * Supports both Till (M-Pesa STK) and Bank Account modes
 * Success condition: ResultCode === "200" AND TransactionStatus === "Completed" AND amount matches expected
 */
const checkTransactionStatus = async (transactionRequestId, expectedAmount) => {
  try {
    const requestBody = {
      api_key: MEGAPAY_CONFIG.apiKey,
      email: MEGAPAY_CONFIG.email,
      transaction_request_id: transactionRequestId
    };

    console.log("=== MegaPay Transaction Status Check ===");
    console.log("Transaction Request ID:", transactionRequestId);
    console.log("Expected Amount:", expectedAmount);

    const response = await makeMegaPayRequest(MEGAPAY_CONFIG.statusEndpoint, requestBody);

    console.log("📬 MegaPay Full Response:", JSON.stringify(response, null, 2));

    // Parse result code - could be string "200" or number 200
    const rawResultCode = response.ResultCode || response.result_code || response.success || "";
    const resultCode = String(rawResultCode).trim();

    // Parse status - could be TransactionStatus, transaction_status, or status
    const rawStatus = response.TransactionStatus || response.transaction_status || response.status || "";
    const txStatus = String(rawStatus).toLowerCase().trim();

    // Parse amount - could be TransactionAmount, transaction_amount, or amount
    const rawAmount = response.TransactionAmount || response.transaction_amount || response.amount || 0;
    const actualAmount = Number(rawAmount);

    // Bank account mode: TransactionReference MAY equal transaction_request_id
    // Till/STK mode: TransactionReference is different from transaction_request_id
    const txRef = response.TransactionReference || response.transaction_reference || response.reference || response.TransactionId || response.transaction_id;
    const hasRealAmount = !isNaN(actualAmount) && actualAmount > 0;
    const amountMatches = !isNaN(expectedAmount) && !isNaN(actualAmount) && actualAmount === Number(expectedAmount);

    console.log(`🔍 Raw fields - ResultCode: "${rawResultCode}"(type:${typeof rawResultCode}), Status: "${rawStatus}", Amount: "${rawAmount}"(type:${typeof rawAmount})`);

    // For bank account mode, accept same-as-request-id reference; for STK, require different
    const refIsValid = Boolean(txRef && txRef !== "null" && txRef !== "undefined" && txRef !== "none" && txRef.toUpperCase() !== "NULL");
    const hasValidReference = refIsValid;

    console.log(`🔍 Parsed - ResultCode: "${resultCode}", Status: "${txStatus}", Amount: ${actualAmount} (expected: ${expectedAmount}, match: ${amountMatches}), Reference: ${txRef}, RefValid: ${refIsValid}`);

    // Check success - for Bank Account mode, phone may not be present
    const isSuccess = resultCode === "200" || resultCode === 200 || rawResultCode === 200;
    const isCompleted = txStatus === "completed" || txStatus === "complete" || txStatus === "success" || txStatus === "paid";

    if (isSuccess && hasValidReference && amountMatches && isCompleted) {
      console.log(`✅ MegaPay payment VERIFIED - Reference: ${txRef}, Amount: KES ${actualAmount}`);
      return {
        success: true,
        completed: true,
        amount: actualAmount,
        phone: response.Msisdn || response.msisdn || response.phone || null,
        reference: txRef,
        resultCode: rawResultCode,
        resultDesc: response.ResultDesc || response.result_desc || response.message || "Payment verified"
      };
    }

    // Amount mismatch
    if (isSuccess && hasValidReference && hasRealAmount && !amountMatches && isCompleted) {
      console.log(`❌ Amount mismatch - expected KES ${expectedAmount} but got KES ${actualAmount}`);
      return {
        success: true,
        completed: false,
        amount: actualAmount,
        status: rawStatus,
        resultCode: rawResultCode,
        resultDesc: `Amount mismatch: expected KES ${expectedAmount}, got KES ${actualAmount}`
      };
    }

    // Not yet completed
    const missing = [];
    if (!hasValidReference) missing.push("reference");
    if (!amountMatches && hasRealAmount) missing.push("amount_match");
    if (!isCompleted) missing.push("completed_status");
    if (!isSuccess) missing.push("result_code");

    console.log(`⏳ Payment NOT confirmed - missing: ${missing.join(", ")}`);

    return {
      success: true,
      completed: false,
      amount: actualAmount,
      status: rawStatus || "Pending",
      resultCode: rawResultCode,
      resultDesc: response.ResultDesc || response.result_desc || response.message || "Transaction not yet completed",
      missing_fields: missing
    };
  } catch (error) {
    console.error("MegaPay status check error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to check transaction status"
    };
  }
};

// Plan amounts in KES - KEEP EXACTLY THE SAME AS BEFORE
const PLAN_AMOUNTS = {
  WELCOME_BONUS: 100,
  REGULAR: 100,
  VIP: 200,
  VVIP: 300
};

const LOGIN_FEE = 95;

const getPlanAmount = (planKey) => {
  return PLAN_AMOUNTS[planKey?.toUpperCase()] || PLAN_AMOUNTS.REGULAR;
};

const getPlanAmountByKey = (planKey) => {
  return PLAN_AMOUNTS[planKey?.toUpperCase()] || null;
};

module.exports = {
  initiateSTKPush,
  checkTransactionStatus,
  formatPhone,
  generateShortReference,
  LOGIN_FEE,
  PLAN_AMOUNTS,
  getPlanAmount,
  getPlanAmountByKey
};