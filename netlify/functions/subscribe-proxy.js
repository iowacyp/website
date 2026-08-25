const crypto = require('node:crypto');

const DEFAULT_ADMIN_URL = 'https://cyp-admin.netlify.app/.netlify/functions/public-subscribe';
const DEFAULT_ADMIN_EVENT_SUPPORT_URL = 'https://cyp-admin.netlify.app/.netlify/functions/public-event-support-intake';
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

  const sharedSecret = normalizeText(process.env.PUBLIC_SUBSCRIBE_SHARED_SECRET);
  if (!sharedSecret) {
    return json(500, { ok: false, error: 'Missing PUBLIC_SUBSCRIBE_SHARED_SECRET.' });
  }

  const rateLimitWindowMs = Number.parseInt(
    String(process.env.PUBLIC_SUBSCRIBE_RATE_LIMIT_WINDOW_MS || DEFAULT_RATE_LIMIT_WINDOW_MS),
    10
  );
  const rateLimitMax = Number.parseInt(String(process.env.PUBLIC_SUBSCRIBE_RATE_LIMIT_MAX || DEFAULT_RATE_LIMIT_MAX), 10);
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

  const email = normalizeLower(body.email);
  if (!email || !isValidEmail(email)) {
    return json(400, { ok: false, error: 'Valid email is required.' });
  }

  const affiliation = normalizeText(body.affiliation || body.program || body.branch || body.military_affiliation);
  const serviceArea = normalizeText(body.service_area || body.serviceArea || body.city);
  const virtualContent = body.virtual_content === true || ['true', 'yes', 'on', '1'].includes(normalizeLower(body.virtual_content));
  const participantCount = Number.parseInt(String(body.num_participants ?? body.participant_count ?? ''), 10);
  const consent = String(body.consent || '').toLowerCase();
  if (!affiliation || !serviceArea) {
    return json(400, { ok: false, error: 'Affiliation / program and service area are required.' });
  }
  if (!isAllowedServiceArea(serviceArea)) {
    return json(400, { ok: false, error: 'Please select a valid service area / closest city.' });
  }
  if (!['true', 'yes', 'on', '1'].includes(consent)) {
    return json(400, { ok: false, error: 'Consent is required.' });
  }
  if (virtualContent && (!Number.isInteger(participantCount) || participantCount < 1 || participantCount > 25)) {
    return json(400, { ok: false, error: 'Number of children/youth must be between 1 and 25.' });
  }

  const payload = {
    email,
    first_name: normalizeText(body.first_name || body.name) || null,
    phone: normalizeText(body.phone) || null,
    organization: normalizeText(body.organization) || null,
    organization: normalizeText(body.organization) || null,
    region: normalizeText(body.region) || null,
    service_area: serviceArea,
    affiliation,
    virtual_content: virtualContent,
    num_participants: virtualContent ? participantCount : null,
    source: normalizeText(body.source) || normalizeText(process.env.PUBLIC_SUBSCRIBE_SOURCE) || DEFAULT_SOURCE,
    tags: normalizeTags(body.tags),
    event_signup: normalizeText(body.event_signup) || null,
    support_role: normalizeText(body.support_role) || null,
    volunteer_type: normalizeText(body.volunteer_type) || null,
    details: normalizeText(body.details) || null,
    submitted_at: normalizeText(body.submitted_at || body.submittedAt) || new Date().toISOString(),
  };

  const adminEndpoint = payload.event_signup && payload.support_role
    ? normalizeText(process.env.ADMIN_PUBLIC_EVENT_SUPPORT_URL) || DEFAULT_ADMIN_EVENT_SUPPORT_URL
    : normalizeText(process.env.ADMIN_PUBLIC_SUBSCRIBE_URL) || DEFAULT_ADMIN_URL;
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
      console.error('subscribe-proxy forwarding failure', {
        status: response.status,
        adminEndpoint,
        responseBody,
        email,
      });
      return json(502, {
        ok: false,
        error: 'Unable to complete subscription right now. Please try again.',
      });
    }

    return json(200, {
      ok: true,
      action: responseBody.action || 'updated',
      contact_id: responseBody.contact_id || null,
      unsubscribed_all: responseBody.unsubscribed_all === true,
      email_status: responseBody.email_status || null,
    });
  } catch (error) {
    console.error('subscribe-proxy unexpected failure', {
      message: String(error?.message || error),
      adminEndpoint,
      email,
      ip: clientIp || null,
    });
    return json(500, {
      ok: false,
      error: 'Unable to complete subscription right now. Please try again.',
    });
  }
};
