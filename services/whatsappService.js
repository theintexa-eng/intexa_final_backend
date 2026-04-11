const axios = require('axios');

const INTERAKT_API_URL = 'https://api.interakt.ai/v1/public/message/';
const DEFAULT_COUNTRY_CODE = '+91';
const DEFAULT_LANGUAGE_CODE = 'en';

function sanitizeValue(value, fallback = "User") {
  if (!value || String(value).trim() === "") {
    return fallback;
  }
  return String(value).trim();
}

function sanitizePhoneNumber(phone) {
  const numericPhone = sanitizeValue(phone).replace(/\D/g, '');
  return numericPhone.length > 10 ? numericPhone.slice(-10) : numericPhone;
}

function getCountryCode() {
  return sanitizeValue(process.env.INTERAKT_COUNTRY_CODE) || DEFAULT_COUNTRY_CODE;
}

function buildInteraktPayload({ phone, name, inquiryId } = {}) {
  return {
    countryCode: getCountryCode(),
    phoneNumber: sanitizePhoneNumber(phone),
    fullName: sanitizeValue(name), // 👈 ADD THIS
    type: 'Template',
    template: {
      name: process.env.INTERAKT_USER_TEMPLATE,
      languageCode: 'en',
      bodyValues: [
        sanitizeValue(name),
        sanitizeValue(inquiryId),
      ],
    },
  };
}

function buildTeamInteraktPayload({ name, phone, inquiryId } = {}) {
  return {
    countryCode: getCountryCode(),
    phoneNumber: sanitizePhoneNumber(process.env.INTERAKT_TEAM_PHONE),
    fullName: sanitizeValue(name), // 👈 ADD THIS
    type: 'Template',
    template: {
      name: process.env.INTERAKT_TEAM_TEMPLATE,
      languageCode: 'en',
      bodyValues: [
        sanitizeValue(name),
        sanitizeValue(phone),
        sanitizeValue(inquiryId),
      ],
    },
  };
}

function isWhatsAppConfigured() {
  return Boolean(process.env.INTERAKT_API_KEY);
}

function buildInteraktHeaders() {
  return {
    Authorization: `Basic ${process.env.INTERAKT_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function sendInteraktMessage(payload) {
  const apiKey = process.env.INTERAKT_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (!payload.phoneNumber) {
    console.error('WhatsApp skipped - valid phone number missing');
    return null;
  }

  if (!payload.template?.name) {
    console.error('WhatsApp skipped - template name missing');
    return null;
  }

  try {
    console.log('PAYLOAD:', payload);
    console.log('SENDING TEMPLATE:', payload.template.name);
    console.log('VALUES:', payload.template.bodyValues);

    const response = await axios.post(INTERAKT_API_URL, payload, {
      headers: buildInteraktHeaders(),
    });

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Interakt API request failed.';

    console.error('WhatsApp failed:', message);
    return null;
  }
}

async function sendWhatsAppMessage({ phone, name, inquiryId } = {}) {
  const payload = buildInteraktPayload({ phone, name, inquiryId });
  return sendInteraktMessage(payload);
}

async function sendWhatsAppConfirmation(formData = {}) {
  return sendWhatsAppMessage({
    phone: formData.phone,
    name: formData.contactName || formData.name,
    inquiryId: formData.inquiryId,
  });
}

async function sendTeamWhatsApp(formData = {}) {
  const teamPhones = process.env.INTERAKT_TEAM_PHONE.split(',');

  for (let phone of teamPhones) {
    const cleanPhone = phone.trim();

    const payload = {
      countryCode: getCountryCode(),
      phoneNumber: sanitizePhoneNumber(cleanPhone),
      fullName: sanitizeValue(formData.name),
      type: 'Template',
      template: {
        name: process.env.INTERAKT_TEAM_TEMPLATE,
        languageCode: "en",
        bodyValues: [
          sanitizeValue(formData.name),
          sanitizeValue(formData.phone),
          sanitizeValue(formData.inquiryId),
        ],
      },
    };

    await sendInteraktMessage(payload);
  }

  return true;
}

module.exports = {
  isWhatsAppConfigured,
  sanitizePhoneNumber,
  sendWhatsAppMessage,
  sendWhatsAppConfirmation,
  sendTeamWhatsApp,
};