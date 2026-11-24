import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, customer_name, customer_phone, customer_email, method = "upi" } = req.body;

    // Unique Order ID generate karna
    const order_id = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    // Host URL dynamically nikalna webhook ke liye
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const notify_url = `${protocol}://${host}/api/webhook`;

    const payload = {
      order_id: order_id,
      amount: Number(amount),
      currency: "INR",
      method: method, // "upi" | "bank" | "usdt"
      customer_name: customer_name || "Customer",
      customer_phone: customer_phone || "9999999999",
      ...(customer_email && { customer_email }),
      notify_url: notify_url,
    };

    const body = JSON.stringify(payload);

    // HMAC-SHA256 Signature generate karna
    const signature = crypto
      .createHmac("sha256", process.env.PAYIN_API_SECRET)
      .update(body)
      .digest("hex");

    // Sunpays API ko request bhejna
    const response = await fetch("https://ttpay.buzz/api/public/v1/payins", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.PAYIN_API_KEY,
        "x-signature": signature,
      },
      body: body,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "Payment gateway error", details: data });
    }

    // Checkout URL frontend ko wapas bhejna
    return res.status(200).json({
      success: true,
      order_id: order_id,
      checkout_url: data.checkout_url || data.payment_url,
    });
  } catch (error) {
    console.error("Payment Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
