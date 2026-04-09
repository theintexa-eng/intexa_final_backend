const PartnerApplication = require('../models/partner.model');
const {
  sendPartnerAdminEmail,
  sendPartnerUserEmail,
} = require('../services/email.service');
const { sendWhatsAppPartner } = require('../services/whatsapp.service');
const { sendZohoPartner } = require('../services/zoho.service');

function sanitizeOptionalField(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue || undefined;
}

function normalizeEmail(value) {
  const normalizedValue = sanitizeOptionalField(value);
  return normalizedValue ? normalizedValue.toLowerCase() : undefined;
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildValidationResponse(errors) {
  return {
    success: false,
    message: 'Validation failed',
    errors,
  };
}

function normalizePartnerPayload(payload = {}) {
  return {
    studioName: sanitizeOptionalField(payload.studioName),
    yearOfEstablishment: sanitizeOptionalField(payload.yearOfEstablishment),
    founderName: sanitizeOptionalField(payload.founderName),
    teamSize: sanitizeOptionalField(payload.teamSize),
    contactName: sanitizeOptionalField(payload.contactName),
    phone: sanitizeOptionalField(payload.phone),
    email: normalizeEmail(payload.email),
    city: sanitizeOptionalField(payload.city),
    specialization: sanitizeOptionalField(payload.specialization),
    projectValueRange: sanitizeOptionalField(payload.projectValueRange),
    portfolioLink: sanitizeOptionalField(payload.portfolioLink),
    website: sanitizeOptionalField(payload.website),
    gstNumber: sanitizeOptionalField(payload.gstNumber),
    clientRef1: sanitizeOptionalField(payload.clientRef1),
    clientRef2: sanitizeOptionalField(payload.clientRef2),
    consent: payload.consent === true,
    status: 'submitted',
  };
}

function validatePartnerPayload(payload = {}) {
  const normalizedPayload = normalizePartnerPayload(payload);
  const errors = [];

  if (!normalizedPayload.phone) {
    errors.push('phone is required');
  }

  if (!normalizedPayload.email) {
    errors.push('email is required');
  } else if (!validateEmail(normalizedPayload.email)) {
    errors.push('email format is invalid');
  }

  if (!normalizedPayload.gstNumber) {
    errors.push('gstNumber is required');
  }

  if (!normalizedPayload.consent) {
    errors.push('consent must be true');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: normalizedPayload,
  };
}

async function generateUniquePartnerId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const partnerId = `PTN-${Date.now() + attempt}`;
    const existingPartner = await PartnerApplication.exists({ partnerId });

    if (!existingPartner) {
      return partnerId;
    }
  }

  throw new Error('Failed to generate a unique partner ID.');
}

function buildLeadPayload(partnerApplication) {
  return {
    ...partnerApplication.toObject(),
    formType: 'partner_application',
    name: partnerApplication.contactName,
    businessName: partnerApplication.studioName,
  };
}

async function rollbackPartnerApplication(documentId) {
  try {
    await PartnerApplication.deleteOne({ _id: documentId });
  } catch (error) {
    console.error('Partner rollback failed:', error.message);
  }
}

async function applyPartner(req, res) {
  try {
    const validation = validatePartnerPayload(req.body);

    if (!validation.isValid) {
      return res.status(400).json(buildValidationResponse(validation.errors));
    }

    const partnerId = await generateUniquePartnerId();
    const partnerApplication = await PartnerApplication.create({
      partnerId,
      ...validation.value,
    });

    const leadPayload = buildLeadPayload(partnerApplication);

    try {
      await sendPartnerAdminEmail(leadPayload);
      await sendPartnerUserEmail(leadPayload);
    } catch (error) {
      await rollbackPartnerApplication(partnerApplication._id);

      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to send partner emails',
        details: error.details,
      });
    }

    await sendWhatsAppPartner(leadPayload);
    await sendZohoPartner(leadPayload);

    return res.status(201).json({
      success: true,
      message: 'Partner application submitted successfully',
      partnerId: partnerApplication.partnerId,
    });
  } catch (error) {
    console.error('applyPartner failed:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to submit partner application',
    });
  }
}

module.exports = {
  applyPartner,
};