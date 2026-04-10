const https = require("https");

const INSTASEND_SECRET_KEY = process.env.INSTASEND_SECRET_KEY;
const INSTASEND_PUBLIC_KEY = process.env.INSTASEND_PUBLIC_KEY;
const INSTASEND_ENV = process.env.INSTASEND_ENV || "live";

const BASE_URL = INSTASEND_ENV === "live" 
  ? "api.instasend.co" 
  : "sandbox-api.instasend.co";

const makeRequest = (path, method, data = null) => {
  return new Promise((resolve, reject) => {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${INSTASEND_SECRET_KEY}`
    };

    const options = {
      hostname: BASE_URL,
      path: `/api/v1/${path}`,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(json.message || "Request failed"));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

exports.createPaymentLink = async (amount, phone, userId, description) => {
  try {
    const response = await makeRequest("checkout/", "POST", {
      amount: amount,
      currency: "KES",
      phone: phone,
      description: description || "Login Fee Payment",
      redirect_url: `${process.env.FRONTEND_URL}/login-fee-callback`,
      callback_url: `${process.env.FRONTEND_URL}/api/login-fee-webhook`,
      metadata: {
        user_id: userId,
        type: "LOGIN_FEE"
      }
    });
    return response;
  } catch (error) {
    console.error("Instasend create payment error:", error);
    throw error;
  }
};

exports.verifyPayment = async (checkoutId) => {
  try {
    const response = await makeRequest(`checkout/${checkoutId}/`, "GET");
    return response;
  } catch (error) {
    console.error("Instasend verify payment error:", error);
    throw error;
  }
};

exports.getPublicKey = () => {
  return INSTASEND_PUBLIC_KEY;
};
