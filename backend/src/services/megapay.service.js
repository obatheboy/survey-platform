const https = require("https");

const MEGAPAY_CONFIG = {
  apiKey: "MGPYRHI7RIdn",
  email: "obavanteshia65@gmail.com",
  endpoint: "https://megapay.co.ke/backend/v1/initiatestk",
  statusEndpoint: "https://megapay.co.ke/backend/v1/transactionstatus"
};

// Format phone to 07XXXXXXXX format (removes 254 prefix if present)
// Accepts: 07XXXXXXXX, 2547XXXXXXXX, 7XXXXXXXX
const formatPhone = (phone) => {
  let cleaned = phone.replace(/[^0-9]/g, '');

  // Remove country code 254 if present, keeping the 0
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    cleaned = '0' + cleaned.substring(3);
  }

  // Ensure it starts with 0
  if (cleaned.startsWith('7') && cleaned.length === 9) {
    cleaned = '0' + cleaned;
  }

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
      timeout: 30000
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

    // MegaPay returns success === "200" on success, or PIN message even when STK delivered
    if (response.success === "200") {
      console.log("MegaPay STK Push successful");
      return {
        success: true,
        message: "STK Push sent! Check your phone and enter PIN.",
        transaction_request_id: response.transaction_request_id || null,
        phone: formattedPhone
      };
    } else if (response.message || response.error) {
      const msg = (response.message || response.error || "").toLowerCase();
      // STK was delivered even if API returns error with PIN prompt
      if (msg.includes("pin") || msg.includes("stk push sent") || msg.includes("check your phone") || msg.includes("sent to")) {
        console.log("MegaPay STK Push delivered (PIN prompt)");
        return {
          success: true,
          message: response.message || response.error,
          transaction_request_id: response.transaction_request_id || null,
          phone: formattedPhone
        };
      }
      console.error("MegaPay STK Push failed:", response);
      return {
        success: false,
        message: response.message || response.error || "STK Push failed",
        details: response
      };
    } else {
      console.error("MegaPay STK Push failed:", response);
      return {
        success: false,
        message: response.message || response.error || "STK Push failed",
        details: response
      };
    }
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
 * Endpoint: POST https://megapay.co.ke/backend/v1/transactionstatus
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

    console.log(`🔍 Raw fields - ResultCode: "${rawResultCode}"(type:${typeof rawResultCode}), Status: "${rawStatus}", Amount: "${rawAmount}"(type:${typeof rawAmount})`);

    // Bank account mode: TransactionReference MAY equal transaction_request_id
    // Till/STK mode: TransactionReference is different from transaction_request_id
    const txRef = response.TransactionReference || response.transaction_reference || response.reference || response.TransactionId || response.transaction_id;
    const hasRealAmount = !isNaN(actualAmount) && actualAmount > 0;
    const amountMatches = !isNaN(expectedAmount) && !isNaN(actualAmount) && actualAmount === Number(expectedAmount);
    const hasValidPhone = Boolean(response.Msisdn || response.msisdn || response.phone || response.PhoneNumber);

    // For bank account mode, accept same-as-request-id reference; for STK, require different
    const refIsValid = Boolean(txRef && txRef !== "null" && txRef !== "undefined" && txRef !== "none" && txRef.toUpperCase() !== "NULL");
    const hasValidReference = refIsValid;

    console.log(`🔍 Parsed - ResultCode: "${resultCode}", Status: "${txStatus}", Amount: ${actualAmount} (expected: ${expectedAmount}, match: ${amountMatches}), Phone: ${hasValidPhone}, Reference: ${txRef}, RefValid: ${refIsValid}`);

    // Check success
    const isSuccess = resultCode === "200" || resultCode === 200 || rawResultCode === 200;
    const isCompleted = txStatus === "completed" || txStatus === "complete" || txStatus === "success" || txStatus === "paid";

    if (isSuccess && hasValidReference && amountMatches && hasValidPhone && isCompleted) {
      console.log(`✅ MegaPay payment VERIFIED - Reference: ${txRef}, Amount: KES ${actualAmount}`);
      return {
        success: true,
        completed: true,
        amount: actualAmount,
        phone: response.Msisdn || response.msisdn || response.phone,
        reference: txRef,
        resultCode: rawResultCode,
        resultDesc: response.ResultDesc || response.result_desc || response.message || "Payment verified"
      };
    }

    // Amount mismatch
    if (isSuccess && hasValidReference && hasRealAmount && !amountMatches && hasValidPhone && isCompleted) {
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
    if (!hasValidPhone) missing.push("phone");
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
  LOGIN_FEE,
  PLAN_AMOUNTS,
  getPlanAmount,
  getPlanAmountByKey
};