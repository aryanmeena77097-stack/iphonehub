export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = req.body;
    console.log("Sunpays Webhook Received:", JSON.stringify(event));

    // Yahan aap database update ya order confirm karne ka logic likh sakte hain
    // Example: if (event.status === "settled" || event.status === "success") { ... }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
