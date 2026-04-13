const axios = require('axios');

const DEFAULT_ZOHO_API_URL = 'https://www.zohoapis.in/crm/v2/Leads';
const DEFAULT_ZOHO_TOKEN_URL = 'https://accounts.zoho.in/oauth/v2/token';

function sanitizeValue(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue || undefined;
}

function maskEmail(email) {
  const normalizedEmail = sanitizeValue(email);

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return normalizedEmail;
  }

  const [localPart, domain] = normalizedEmail.split('@');
  const visibleLocalPart = localPart.slice(0, 2);
  return `${visibleLocalPart}***@${domain}`;
}

function maskPhone(phone) {
  const normalizedPhone = sanitizeValue(phone);

  if (!normalizedPhone) {
    return normalizedPhone;
  }

  const lastFourDigits = normalizedPhone.slice(-4);
  return `******${lastFourDigits}`;
}

function splitName(name) {
  const normalizedName = sanitizeValue(name) || 'User';
  const nameParts = normalizedName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts.slice(1).join(' ') || 'Lead';

  return {
    firstName,
    lastName,
    normalizedName,
  };
}

function buildDescription(data = {}) {
  const lines = [
    `Name: ${sanitizeValue(data.name) || 'User'}`,
    `City: ${sanitizeValue(data.city) || 'Not provided'}`,
    `Property Type: ${sanitizeValue(data.propertyType) || 'Not provided'}`,
    `Budget: ${sanitizeValue(data.budget) || 'Not provided'}`,
    `Timeline: ${sanitizeValue(data.timeline) || 'Not provided'}`,
    `Message: ${sanitizeValue(data.message) || 'Not provided'}`,
  ];

  return lines.join('\n');
}

function buildZohoLeadPayload(data = {}) {
  const { firstName, lastName } = splitName(data.name);

const leadRecord = {
  First_Name: firstName,
  Last_Name: lastName,
  Email: sanitizeValue(data.email),
  Mobile: sanitizeValue(data.phone),
  Lead_Source: "Website", // 🔥 ADD THIS
  Description: buildDescription(data),
};

// clean undefined
const cleanedRecord = {};
Object.entries(leadRecord).forEach(([key, value]) => {
  if (value !== undefined && value !== null && value !== '') {
    cleanedRecord[key] = value;
  }
});

  return {
    data: [cleanedRecord],
  };
}

function buildSafePayloadLog(payload) {
  return {
    data: payload.data.map((lead) => ({
      ...lead,
      Email: maskEmail(lead.Email),
      Mobile: maskPhone(lead.Mobile), // ✅ FIX
    })),
  };
}

function isZohoConfigured() {
  return Boolean(
    process.env.ZOHO_REFRESH_TOKEN &&
      process.env.ZOHO_CLIENT_ID &&
      process.env.ZOHO_CLIENT_SECRET
  );
}

function buildZohoErrorDetails(error) {
  return {
    status: error.response?.status || 500,
    message:
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.data?.[0]?.message ||
      error.message ||
      'Zoho API request failed.',
    details: error.response?.data || null,
  };
}

async function generateAccessToken() {
  if (!isZohoConfigured()) {
    throw new Error('Zoho credentials missing');
  }

  try {
    // Exchange the refresh token for a short-lived access token before each CRM request.
    const response = await axios.post(
      process.env.ZOHO_TOKEN_URL || DEFAULT_ZOHO_TOKEN_URL,
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: 'refresh_token',
        },
      }
    );

    const accessToken = response.data?.access_token;

    if (!accessToken) {
      throw new Error('Zoho token response did not include an access token.');
    }

    console.log('Zoho token generated successfully');
    return accessToken;
  } catch (error) {
    const errorDetails = buildZohoErrorDetails(error);
    console.error('Zoho token generation failed:', errorDetails);
    throw error;
  }
}

async function sendToZoho(data = {}) {
  if (!isZohoConfigured()) {
    console.log('Zoho skipped - credentials missing');
    return null;
  }

  try {
    // Build the CRM lead payload with the required inquiry details.
    const payload = buildZohoLeadPayload(data);
    const accessToken = await generateAccessToken();

    console.log('Zoho request payload:', buildSafePayloadLog(payload));

    // Send the lead to Zoho CRM using the generated OAuth access token.
    const response = await axios.post(
  process.env.ZOHO_API_URL || DEFAULT_ZOHO_API_URL,
  payload,
  {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    validateStatus: () => true, // 🔥 ADD THIS
  }
);

console.log("Zoho RAW RESPONSE:", response.data);
  } catch (error) {
    const errorDetails = buildZohoErrorDetails(error);
    console.error('Zoho error response:', errorDetails);
    return null;
  }
}

async function sendLeadToZoho(data = {}) {
  return sendToZoho(data);
}

module.exports = {
  isZohoConfigured,
  sendLeadToZoho,
  sendToZoho,
};