export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Webhook payload:", JSON.stringify(req.body || {}));
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("webhook error:", err);
    return res.status(500).json({ error: "Webhook failed" });
  }
}
