const Inquiry = require('../models/inquiry.model');
const { sendAdminEmail, sendUserConfirmation } = require('../services/email.service');
const { triggerWhatsAppIntegration } = require('../services/whatsapp.service');
const { triggerZohoIntegration } = require('../services/zoho.service');

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

function buildValidationError(errors) {
  return {
    success: false,
    message: 'Validation failed',
    errors,
  };
}

function validateStep1Payload(payload = {}) {
  const normalizedPayload = {
    name: sanitizeOptionalField(payload.name),
    phone: sanitizeOptionalField(payload.phone),
    email: normalizeEmail(payload.email),
    city: sanitizeOptionalField(payload.city),
    source: sanitizeOptionalField(payload.source) || 'website',
  };
  const errors = [];

  if (!normalizedPayload.name) {
    errors.push('name is required');
  }

  if (!normalizedPayload.phone) {
    errors.push('phone is required');
  }

  if (!normalizedPayload.email) {
    errors.push('email is required');
  } else if (!validateEmail(normalizedPayload.email)) {
    errors.push('email format is invalid');
  }

  if (!normalizedPayload.city) {
    errors.push('city is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: normalizedPayload,
  };
}

function validateStep2Payload(payload = {}) {
  const normalizedPayload = {
    propertyType: sanitizeOptionalField(payload.propertyType),
    budget: sanitizeOptionalField(payload.budget),
    timeline: sanitizeOptionalField(payload.timeline),
    message: sanitizeOptionalField(payload.message),
  };
  const errors = [];

  if (!normalizedPayload.propertyType) {
    errors.push('propertyType is required');
  }

  if (!normalizedPayload.budget) {
    errors.push('budget is required');
  }

  if (!normalizedPayload.timeline) {
    errors.push('timeline is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: normalizedPayload,
  };
}

async function generateUniqueInquiryId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inquiryId = `INX-${Date.now() + attempt}`;
    const existingInquiry = await Inquiry.exists({ inquiryId });

    if (!existingInquiry) {
      return inquiryId;
    }
  }

  throw new Error('Failed to generate a unique inquiry ID.');
}

function buildStartInquiryPayload(payload, inquiryId) {
  return {
    inquiryId,
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    city: payload.city,
    source: payload.source,
    stepCompleted: 1,
    status: 'in_progress',
  };
}

function buildCompleteLeadPayload(inquiry) {
  return {
    ...inquiry.toObject(),
    formType: 'inquiry',
  };
}

function validateCompletionState(inquiry) {
  const missingFields = [];

  if (!sanitizeOptionalField(inquiry.name)) {
    missingFields.push('name is required');
  }

  if (!sanitizeOptionalField(inquiry.phone)) {
    missingFields.push('phone is required');
  }

  if (!normalizeEmail(inquiry.email)) {
    missingFields.push('email is required');
  }

  if (!sanitizeOptionalField(inquiry.city)) {
    missingFields.push('city is required');
  }

  if (!sanitizeOptionalField(inquiry.propertyType)) {
    missingFields.push('propertyType is required');
  }

  if (!sanitizeOptionalField(inquiry.budget)) {
    missingFields.push('budget is required');
  }

  if (!sanitizeOptionalField(inquiry.timeline)) {
    missingFields.push('timeline is required');
  }

  return missingFields;
}

async function findInquiryById(inquiryId) {
  return Inquiry.findOne({ inquiryId: sanitizeOptionalField(inquiryId) });
}

async function startInquiry(req, res) {
  try {
    const validation = validateStep1Payload(req.body);

    if (!validation.isValid) {
      return res.status(400).json(buildValidationError(validation.errors));
    }

    const inquiryId = await generateUniqueInquiryId();
    const inquiry = await Inquiry.create(buildStartInquiryPayload(validation.value, inquiryId));

    try {
      await sendAdminEmail(buildCompleteLeadPayload(inquiry), {
        subject: 'New Lead Received - Inquiry Started',
      });
    } catch (error) {
      await Inquiry.deleteOne({ _id: inquiry._id });

      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to send admin email',
        details: error.details,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Inquiry started successfully',
      inquiryId: inquiry.inquiryId,
    });
  } catch (error) {
    console.error('startInquiry failed:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to start inquiry',
    });
  }
}

async function updateInquiryStep2(req, res) {
  try {
    const inquiryId = sanitizeOptionalField(req.params.inquiryId);

    if (!inquiryId) {
      return res.status(400).json(buildValidationError(['inquiryId is required']));
    }

    const validation = validateStep2Payload(req.body);

    if (!validation.isValid) {
      return res.status(400).json(buildValidationError(validation.errors));
    }

    const inquiry = await findInquiryById(inquiryId);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found',
      });
    }

    inquiry.propertyType = validation.value.propertyType;
    inquiry.budget = validation.value.budget;
    inquiry.timeline = validation.value.timeline;
    inquiry.message = validation.value.message;
    inquiry.stepCompleted = Math.max(inquiry.stepCompleted || 1, 2);

    await inquiry.save();

    return res.status(200).json({
      success: true,
      message: 'Inquiry updated successfully',
      inquiryId: inquiry.inquiryId,
    });
  } catch (error) {
    console.error('updateInquiryStep2 failed:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update inquiry',
    });
  }
}

async function completeInquiry(req, res) {
  try {
    const inquiryId = sanitizeOptionalField(req.params.inquiryId);

    if (!inquiryId) {
      return res.status(400).json(buildValidationError(['inquiryId is required']));
    }

    const inquiry = await findInquiryById(inquiryId);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found',
      });
    }

    const completionErrors = validateCompletionState(inquiry);

    if (completionErrors.length > 0) {
      return res.status(400).json(buildValidationError(completionErrors));
    }

    inquiry.status = 'completed';
    inquiry.stepCompleted = 3;
    await inquiry.save();

    const leadPayload = buildCompleteLeadPayload(inquiry);

    try {
      await sendAdminEmail(leadPayload, {
        subject: 'New Lead Received - Inquiry Completed',
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to send admin email',
        details: error.details,
      });
    }

    await sendUserConfirmation(leadPayload);
    await triggerWhatsAppIntegration(leadPayload);
    await triggerZohoIntegration(leadPayload);

    return res.status(200).json({
      success: true,
      message: 'Inquiry completed successfully',
      inquiryId: inquiry.inquiryId,
    });
  } catch (error) {
    console.error('completeInquiry failed:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to complete inquiry',
    });
  }
}

module.exports = {
  startInquiry,
  updateInquiryStep2,
  completeInquiry,
};