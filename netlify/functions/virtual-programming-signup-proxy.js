const crypto = require('node:crypto');

const DEFAULT_ADMIN_URL = 'https://cyp-admin.netlify.app/.netlify/functions/public-virtual-programming-signup';
const DEFAULT_SOURCE = 'www.iowacyp.com';
const DEFAULT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 20;
const ALLOWED_SERVICE_AREAS = new Set([
  'Des Moines',
  'Sioux City',
  'Council Bluffs',
  'Waterloo',
  'Cedar Rapids',
  'Davenport',
]);
const RATE_LIMIT_BUCKETS = new Map();

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
  };
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function isAllowedServiceArea(value) {
  return ALLOWED_SERVICE_AREAS.has(normalizeText(value));
}

function isValidEmail(value) {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(String(value || '').trim());
}

function normalizeTags(input) {
  if (Array.isArray(input)) {
    return Array.from(new Set(input.map((entry) => normalizeLower(entry)).filter(Boolean))).slice(0, 20);
  }
  if (typeof input === 'string') {
    return Array.from(new Set(input.split(',').map((entry) => normalizeLower(entry)).filter(Boolean))).slice(0, 20);
  }
  return [];
}

function parseRawBody(event) {
  const raw = event?.body || '';
  if (!event?.isBase64Encoded) {
    return String(raw);
  }
  return Buffer.from(String(raw), 'base64').toString('utf8');
}

function parseJsonBody(rawBody) {
  try {
    return rawBody ? JSON.parse(rawBody) : {};
  } catch (_error) {
    return null;
  }
}

function resolveIp(headers) {
  const forwarded = String(headers?.['x-forwarded-for'] || '');
  if (forwarded) {
    return normalizeText(forwarded.split(',')[0]);
  }
  return normalizeText(headers?.['client-ip'] || headers?.['x-real-ip'] || '');
}

function checkRateLimit(ip, limit, windowMs) {
  const key = ip || 'unknown';
  const now = Date.now();
  const windowStart = now - windowMs;
  const existing = RATE_LIMIT_BUCKETS.get(key);

  if (!existing || existing.windowStart < windowStart) {
    RATE_LIMIT_BUCKETS.set(key, { windowStart: now, count: 1 });
  } else {
    existing.count += 1;
    RATE_LIMIT_BUCKETS.set(key, existing);
  }

  for (const [bucketKey, bucket] of RATE_LIMIT_BUCKETS.entries()) {
    if (bucket.windowStart < windowStart) {
      RATE_LIMIT_BUCKETS.delete(bucketKey);
    }
  }

  const current = RATE_LIMIT_BUCKETS.get(key);
  return (current?.count || 0) <= limit;
}

exports.handler = async (event) => {
  const method = String(event?.httpMethod || 'GET').toUpperCase();
  if (method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' });
  }

  const sharedSecret =
    normalizeText(process.env.PUBLIC_VIRTUAL_PROGRAMMING_SHARED_SECRET) ||
    normalizeText(process.env.PUBLIC_SUBSCRIBE_SHARED_SECRET);
  if (!sharedSecret) {
    return json(500, { ok: false, error: 'Missing PUBLIC_VIRTUAL_PROGRAMMING_SHARED_SECRET.' });
  }

  const rateLimitWindowMs = Number.parseInt(
    String(process.env.PUBLIC_VIRTUAL_PROGRAMMING_RATE_LIMIT_WINDOW_MS || process.env.PUBLIC_SUBSCRIBE_RATE_LIMIT_WINDOW_MS || DEFAULT_RATE_LIMIT_WINDOW_MS),
    10
  );
  const rateLimitMax = Number.parseInt(
    String(process.env.PUBLIC_VIRTUAL_PROGRAMMING_RATE_LIMIT_MAX || process.env.PUBLIC_SUBSCRIBE_RATE_LIMIT_MAX || DEFAULT_RATE_LIMIT_MAX),
    10
  );
  const clientIp = resolveIp(event?.headers || {});

  const rateOk = checkRateLimit(
    clientIp || 'unknown',
    Number.isFinite(rateLimitMax) ? rateLimitMax : DEFAULT_RATE_LIMIT_MAX,
    Number.isFinite(rateLimitWindowMs) ? rateLimitWindowMs : DEFAULT_RATE_LIMIT_WINDOW_MS
  );
  if (!rateOk) {
    return json(429, { ok: false, error: 'Too many requests. Please try again later.' });
  }

  const rawBody = parseRawBody(event);
  const body = parseJsonBody(rawBody);
  if (!body || typeof body !== 'object') {
    return json(400, { ok: false, error: 'Invalid JSON payload.' });
  }

  const botField = normalizeText(body['bot-field'] || body.bot_field || body.botField);
  if (botField) {
    return json(200, { ok: true, action: 'ignored' });
  }

  const firstName = normalizeText(body.parent_first_name || body.first_name || body.firstName);
  const lastName = normalizeText(body.parent_last_name || body.last_name || body.lastName);
  const email = normalizeLower(body.email);
  const serviceArea = normalizeText(body.service_area || body.serviceArea || body.city);
  if (!firstName || !lastName || !email || !isValidEmail(email)) {
    return json(400, { ok: false, error: 'Parent/guardian first name, last name, and a valid email are required.' });
  }
  if (serviceArea && !isAllowedServiceArea(serviceArea)) {
    return json(400, { ok: false, error: 'Please select a valid service area / closest city.' });
  }

  const payload = {
    parent_first_name: firstName,
    parent_last_name: lastName,
    email,
    phone: normalizeText(body.phone) || null,
    city: serviceArea || null,
    military_affiliation: normalizeText(body.military_affiliation || body.affiliation) || null,
    child_youth_names: normalizeText(body.child_youth_names || body.child_names) || null,
    child_youth_ages: normalizeText(body.child_youth_ages || body.child_ages) || null,
    virtual_programming_interest: normalizeText(body.virtual_programming_interest || body.interest) || null,
    comments: normalizeText(body.comments || body.notes) || null,
    source: normalizeText(body.source) || normalizeText(process.env.PUBLIC_VIRTUAL_PROGRAMMING_SOURCE) || DEFAULT_SOURCE,
    tags: normalizeTags(body.tags),
    submitted_at: normalizeText(body.submitted_at || body.submittedAt) || new Date().toISOString(),
  };

  const adminEndpoint = normalizeText(process.env.ADMIN_PUBLIC_VIRTUAL_PROGRAMMING_URL) || DEFAULT_ADMIN_URL;
  const timestamp = String(Date.now());
  const payloadString = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', sharedSecret).update(`${timestamp}.${payloadString}`).digest('hex');

  try {
    const response = await fetch(adminEndpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-subscribe-source': payload.source || DEFAULT_SOURCE,
        'x-subscribe-timestamp': timestamp,
        'x-subscribe-signature': `sha256=${signature}`,
      },
      body: payloadString,
    });

    let responseBody = {};
    try {
      responseBody = await response.json();
    } catch (_error) {
      responseBody = {};
    }

    if (!response.ok || responseBody?.ok !== true) {
      console.error('virtual-programming-signup-proxy forwarding failure', {
        status: response.status,
        adminEndpoint,
        responseBody,
        email,
      });
      return json(502, {
        ok: false,
        error: 'Unable to submit the virtual programming form right now. Please try again.',
      });
    }

    return json(200, {
      ok: true,
      action: responseBody.action || 'created',
      contact_id: responseBody.contact_id || null,
    });
  } catch (error) {
    console.error('virtual-programming-signup-proxy unexpected failure', {
      message: String(error?.message || error),
      adminEndpoint,
      email,
      ip: clientIp || null,
    });
    return json(500, {
      ok: false,
      error: 'Unable to submit the virtual programming form right now. Please try again.',
    });
  }
};
