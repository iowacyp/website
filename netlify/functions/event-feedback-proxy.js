const ADMIN_URL = "https://cyp-admin.netlify.app/.netlify/functions/public-event-feedback"

exports.handler = async (event) => {
  const method = String(event?.httpMethod || "GET").toUpperCase()
  if (!["GET", "POST"].includes(method)) return { statusCode: 405, body: JSON.stringify({ ok: false, error: "Method not allowed." }) }
  const token = String(event?.queryStringParameters?.token || "").trim()
  const target = method === "GET" ? `${ADMIN_URL}?token=${encodeURIComponent(token)}` : ADMIN_URL
  try {
    const response = await fetch(target, { method, headers: { "content-type": "application/json" }, body: method === "POST" ? String(event?.body || "{}") : undefined })
    return { statusCode: response.status, headers: { "content-type": "application/json; charset=utf-8" }, body: await response.text() }
  } catch { return { statusCode: 502, body: JSON.stringify({ ok: false, error: "Feedback service is temporarily unavailable." }) } }
}
