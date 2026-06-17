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
    console.log("Endpoint:", MEGAPAY_CONFIG.statusEndpoint);
    console.log("Transaction Request ID:", transactionRequestId);
    console.log("Expected Amount:", expectedAmount);

    const response = await makeMegaPayRequest(MEGAPAY_CONFIG.statusEndpoint, requestBody);

    console.log("MegaPay Status Response:", JSON.stringify(response, null, 2));

    const resultCode = String(response.ResultCode || "").trim();
    const txStatus = String(response.TransactionStatus || "").toLowerCase().trim();
    const actualAmount = Number(response.TransactionAmount);

    // Success condition: ResultCode === "200" AND TransactionStatus is a completed variant
    const hasValidReference = Boolean(
      (response.TransactionReference && response.TransactionReference !== transactionRequestId && 
       !['PLACEHOLDER','TEST','DUMMY','FAKE','TEMP','NULL','undefined','null','none','NA','N/A'].includes(String(response.TransactionReference).toUpperCase())) ||
      (response.transaction_reference && !['PLACEHOLDER','TEST','DUMMY','FAKE','TEMP','NULL','undefined','null','none','NA','N/A'].includes(String(response.transaction_reference).toUpperCase())) ||
      (response.reference && !['PLACEHOLDER','TEST','DUMMY','FAKE','TEMP','NULL','undefined','null','none','NA','N/A'].includes(String(response.reference).toUpperCase())) ||
      (response.TransactionId && response.TransactionId !== transactionRequestId && !['PLACEHOLDER','TEST','DUMMY','FAKE','TEMP','NULL','undefined','null','none','NA','N/A'].includes(String(response.TransactionId).toUpperCase())) ||
      (response.transaction_id && !['PLACEHOLDER','TEST','DUMMY','FAKE','TEMP','NULL','undefined','null','none','NA','N/A'].includes(String(response.transaction_id).toUpperCase()))
    );
    const hasValidAmount = !isNaN(actualAmount) && actualAmount > 0;
    const amountMatches = !isNaN(expectedAmount) && !isNaN(actualAmount) && actualAmount === Number(expectedAmount);
    const hasValidPhone = Boolean(response.Msisdn);
    
    console.log(`🔍 MegaPay validation check - ResultCode: ${resultCode}, Status: ${txStatus}, hasReference: ${hasValidReference}, amount=${actualAmount} (expected=${expectedAmount}, match=${amountMatches}), hasPhone: ${hasValidPhone}`);
    
    if (resultCode === "200" && hasValidReference && amountMatches && hasValidPhone && (txStatus === "completed" || txStatus === "complete" || txStatus === "success" || txStatus === "paid")) {
      console.log(`✅ MegaPay payment VERIFIED - TransactionReference: ${response.TransactionReference}, Amount: KES ${actualAmount}`);
      return {
        success: true,
        completed: true,
        amount: actualAmount,
        phone: response.Msisdn,
        reference: response.TransactionReference || response.transaction_reference || response.reference || response.TransactionId || response.transaction_id,
        resultCode: response.ResultCode,
        resultDesc: response.ResultDesc
      };
    } else if (resultCode === "200" && hasValidReference && hasValidAmount && !amountMatches && hasValidPhone && (txStatus === "completed" || txStatus === "complete" || txStatus === "success" || txStatus === "paid")) {
      console.log(`❌ Amount mismatch - expected KES ${expectedAmount} but got KES ${actualAmount}`);
    } else {
      console.log(`⏳ MegaPay payment NOT CONFIRMED - missing validation: Reference=${hasValidReference}, AmountMatch=${amountMatches}(${actualAmount}/${expectedAmount}), Phone=${hasValidPhone}`);
    }

    // Payment not yet completed or doesn't match expected amount
    return {
      success: true,
      completed: false,
      amount: actualAmount,
      status: response.TransactionStatus || "Pending",
      resultCode: response.ResultCode,
      resultDesc: response.ResultDesc || (amountMatches ? "Transaction not yet completed" : "Amount does not match expected payment")
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