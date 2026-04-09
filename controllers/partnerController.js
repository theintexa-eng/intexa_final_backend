const Partner = require('../models/Partner');
const { submitLead } = require('../services/formSubmissionService');

function sanitizeOptionalField(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue || undefined;
}

function buildPartnerPayload(payload = {}) {
  return {
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    businessName: sanitizeOptionalField(payload.businessName),
    city: sanitizeOptionalField(payload.city),
    message: sanitizeOptionalField(payload.message),
  };
}

async function submitPartner(req, res) {
  return submitLead({
    req,
    res,
    model: Partner,
    buildPayload: buildPartnerPayload,
    buildLeadPayload: ({ savedDocument, validatedPayload }) => ({
      ...savedDocument.toObject(),
      formType: 'partner',
      source: validatedPayload.source,
    }),
  });
}

module.exports = {
  submitPartner,
};