const DEFAULT_WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0';

function sanitizeValue(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

function buildConfirmationMessage(formData = {}) {
  const name = sanitizeValue(formData.name) || 'there';
  const formType = sanitizeValue(formData.formType) || 'lead';

  return `Hi ${name}, thanks for your ${formType} submission. Our team has received your details and will contact you shortly.`;
}

async function parseApiResponse(response) {
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

function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_KEY);
}

async function sendWhatsAppConfirmation(formData = {}) {
  const apiKey = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_KEY;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipientPhone = sanitizeValue(formData.phone);

  if (!apiKey) {
    throw new Error('WHATSAPP_API_KEY is not defined in the environment variables.');
  }

  if (!phoneNumberId) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID is not defined in the environment variables.');
  }

  if (!recipientPhone) {
    throw new Error('phone is required to send a WhatsApp confirmation message.');
  }

  const apiBaseUrl = process.env.WHATSAPP_API_URL || DEFAULT_WHATSAPP_API_URL;
  const requestBody = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientPhone,
    type: 'text',
    text: {
      body: buildConfirmationMessage(formData),
      preview_url: false,
    },
  };

  let response;

  try {
    response = await fetch(`${apiBaseUrl}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    throw new Error(`Failed to connect to WhatsApp API: ${error.message}`);
  }

  const responseBody = await parseApiResponse(response);

  if (!response.ok) {
    const message =
      responseBody?.error?.message ||
      responseBody?.message ||
      'WhatsApp API request failed.';
    const error = new Error(message);

    error.status = response.status;
    error.details = responseBody;

    throw error;
  }

  return responseBody;
}

module.exports = {
  isWhatsAppConfigured,
  sendWhatsAppConfirmation,
};