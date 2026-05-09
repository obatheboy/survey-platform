const https = require("https");

const MEGAPAY_CONFIG = {
  apiKey: "MGPYsOrn4Vvi",
  email: "obavanteshia65@gmail.com",
  endpoint: "https://megapay.co.ke/backend/v1/initiatestk"
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
    console.log("Body:", JSON.stringify(requestBody, null, 2));

    const response = await new Promise((resolve, reject) => {
      const url = new URL(MEGAPAY_CONFIG.endpoint);

      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        timeout: 30000
      };

      const postData = JSON.stringify(requestBody);
      options.headers["Content-Length"] = Buffer.byteLength(postData);

      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", chunk => body += chunk);
        res.on("end", () => {
          console.log("=== MegaPay Raw Response ===");
          console.log("Status:", res.statusCode);
          console.log("Body:", body);

          if (!body || body.trim() === "") {
            resolve({ success: false, error: "Empty response from MegaPay" });
            return;
          }

          try {
            const json = JSON.parse(body);
            resolve(json);
          } catch (e) {
            resolve({ success: false, error: "Invalid JSON response", raw: body.substring(0, 500) });
          }
        });
      });

      req.on("error", (err) => {
        console.error("MegaPay request error:", err.message);
        reject(err);
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timed out"));
      });

      req.write(postData);
      req.end();
    });

    // MegaPay returns success === "200" on success
    if (response.success === "200") {
      console.log("MegaPay STK Push successful");
      return {
        success: true,
        message: "STK Push sent! Check your phone and enter PIN.",
        transaction_request_id: response.transaction_request_id || null,
        phone: formattedPhone
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

// Plan amounts in KES - KEEP EXACTLY THE SAME AS BEFORE
const PLAN_AMOUNTS = {
  WELCOME_BONUS: 100,
  REGULAR: 100,
  VIP: 200,
  VVIP: 300
};

const getPlanAmount = (planKey) => {
  return PLAN_AMOUNTS[planKey?.toUpperCase()] || PLAN_AMOUNTS.REGULAR;
};

const getPlanAmountByKey = (planKey) => {
  return PLAN_AMOUNTS[planKey?.toUpperCase()] || null;
};

module.exports = {
  initiateSTKPush,
  formatPhone,
  PLAN_AMOUNTS,
  getPlanAmount,
  getPlanAmountByKey
};