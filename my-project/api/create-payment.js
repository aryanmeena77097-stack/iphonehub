import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      amount,
      customer_name,
      customer_phone,
      customer_email,
      method = "upi",
    } = req.body || {};

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: "Valid amount required" });
    }

    if (!process.env.PAYIN_API_KEY || !process.env.PAYIN_API_SECRET) {
      return res.status(500).json({
        error: "PAYIN_API_KEY or PAYIN_API_SECRET missing in Vercel Environment Variables",
      });
    }

    const order_id = `ORD_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const notify_url = `${protocol}://${host}/api/webhook`;

    const payload = {
      order_id,
      amount: numericAmount,
      currency: "INR",
      method: method || "upi",
      customer_name: customer_name || "Customer",
      customer_phone: customer_phone || "9999999999",
      ...(customer_email ? { customer_email } : {}),
      notify_url,
    };

    const body = JSON.stringify(payload);

    const signature = crypto
      .createHmac("sha256", process.env.PAYIN_API_SECRET)
      .update(body)
      .digest("hex");

    const response = await fetch("https://ttpay.buzz/api/public/v1/payins", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.PAYIN_API_KEY,
        "x-signature": signature,
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || data?.error || "Gateway rejected request",
        details: data,
      });
    }

    const checkoutUrl = data.checkout_url || data.payment_url || data.redirect_url;

    if (!checkoutUrl) {
      return res.status(500).json({
        error: "No checkout_url returned by gateway",
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      order_id,
      checkout_url: checkoutUrl,
      gateway_response: data,
    });
  } catch (err) {
    console.error("create-payment error:", err);
    return res.status(500).json({ error: "Server error while creating payment" });
  }
}
