const Contact = require('../models/Contact');
const { submitLead } = require('../services/formSubmissionService');

function sanitizeOptionalField(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue || undefined;
}

function buildContactPayload(payload = {}) {
  return {
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    message: sanitizeOptionalField(payload.message),
    source: sanitizeOptionalField(payload.source) || 'website',
  };
}

async function submitContact(req, res) {
  return submitLead({
    req,
    res,
    model: Contact,
    buildPayload: buildContactPayload,
    buildLeadPayload: ({ savedDocument }) => ({
      ...savedDocument.toObject(),
      formType: 'contact',
    }),
  });
}

module.exports = {
  submitContact,
};