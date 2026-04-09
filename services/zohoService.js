const DEFAULT_ZOHO_API_URL = 'https://www.zohoapis.com/crm/v2/Leads';
const DEFAULT_ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';

function sanitizeValue(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue || undefined;
}

function buildZohoLeadPayload(leadData = {}) {
  const name = sanitizeValue(leadData.name);
  const businessName = sanitizeValue(leadData.businessName);
  const payload = {
    Last_Name: name || 'Unknown',
    Company: businessName || 'Individual',
    Email: sanitizeValue(leadData.email),
    Phone: sanitizeValue(leadData.phone),
    City: sanitizeValue(leadData.city),
    Lead_Source: sanitizeValue(leadData.source) || 'Website',
    Description: sanitizeValue(leadData.message),
    Full_Name: name,
  };

  return {
    data: [Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))],
  };
}

async function parseZohoResponse(response) {
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

function isZohoConfigured() {
  return Boolean(
    process.env.ZOHO_REFRESH_TOKEN &&
      process.env.ZOHO_CLIENT_ID &&
      process.env.ZOHO_CLIENT_SECRET
  );
}

async function generateZohoAccessToken() {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;

  if (!isZohoConfigured()) {
    throw new Error('Zoho credentials missing');
  }

  const tokenUrl = process.env.ZOHO_TOKEN_URL || DEFAULT_ZOHO_TOKEN_URL;
  const requestBody = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });

  let response;

  try {
    response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody.toString(),
    });
  } catch (error) {
    throw new Error(`Failed to connect to Zoho token API: ${error.message}`);
  }

  const responseBody = await parseZohoResponse(response);

  if (!response.ok || !responseBody?.access_token) {
    const message = responseBody?.error || responseBody?.message || 'Failed to generate Zoho access token.';
    const error = new Error(message);

    error.status = response.status || 500;
    error.details = responseBody;

    throw error;
  }

  return responseBody.access_token;
}

async function sendLeadToZoho(leadData = {}) {
  const accessToken = await generateZohoAccessToken();

  const apiUrl = process.env.ZOHO_API_URL || DEFAULT_ZOHO_API_URL;
  const payload = buildZohoLeadPayload(leadData);

  let response;

  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(`Failed to connect to Zoho API: ${error.message}`);
  }

  const responseBody = await parseZohoResponse(response);

  if (!response.ok) {
    const message =
      responseBody?.message ||
      responseBody?.data?.[0]?.message ||
      'Zoho API request failed.';
    const error = new Error(message);

    error.status = response.status;
    error.details = responseBody;

    throw error;
  }

  return responseBody;
}

module.exports = {
  isZohoConfigured,
  sendLeadToZoho,
};